from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "images" / "elaf-logo.png"
src = Image.open(SRC).convert("RGBA")

w, h = src.size
minx, miny, maxx, maxy = w, h, 0, 0
for y in range(h):
    for x in range(w):
        r, g, b, a = src.getpixel((x, y))
        if a > 40 and (r + g + b) > 60:
            minx = min(minx, x)
            miny = min(miny, y)
            maxx = max(maxx, x)
            maxy = max(maxy, y)

pad = 12
crop = src.crop(
    (
        max(0, minx - pad),
        max(0, miny - pad),
        min(w, maxx + pad + 1),
        min(h, maxy + pad + 1),
    )
)


def knock_out_black(img: Image.Image, threshold: int = 40) -> Image.Image:
    """Make near-black pixels transparent so logo sits on white cleanly."""
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a > 0 and (r + g + b) <= threshold * 3:
                px[x, y] = (0, 0, 0, 0)
    return out


crop = knock_out_black(crop)


def make_square(img: Image.Image, size: int, bg=(0, 0, 0, 255), scale=0.78) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    cw, ch = img.size
    target = int(size * scale)
    ratio = min(target / cw, target / ch)
    nw, nh = max(1, int(cw * ratio)), max(1, int(ch * ratio))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    canvas.alpha_composite(resized, (ox, oy))
    return canvas


def to_white_silhouette(img: Image.Image) -> Image.Image:
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    px = img.load()
    opx = out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a > 20 and (r + g + b) > 40:
                lum = min(255, int(0.2 * r + 0.7 * g + 0.1 * b))
                alpha = max(a, lum)
                opx[x, y] = (255, 255, 255, alpha)
            else:
                opx[x, y] = (0, 0, 0, 0)
    return out


def round_mask(size: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.ellipse((0, 0, size - 1, size - 1), fill=255)
    return m


web_512 = make_square(crop, 512, bg=(255, 255, 255, 255), scale=0.82)
web_512.convert("RGB").save(ROOT / "public" / "elaf-logo.png", optimize=True)
web_512.save(ROOT / "public" / "images" / "elaf-logo-icon.png", optimize=True)

densities = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
fg_densities = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

res = ROOT / "android" / "app" / "src" / "main" / "res"
for folder, size in densities.items():
    d = res / folder
    d.mkdir(parents=True, exist_ok=True)
    icon = make_square(crop, size, bg=(255, 255, 255, 255), scale=0.82)
    icon.save(d / "ic_launcher.png")
    base = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    base.alpha_composite(make_square(crop, size, bg=(0, 0, 0, 0), scale=0.82))
    base.putalpha(round_mask(size))
    base.save(d / "ic_launcher_round.png")

for folder, size in fg_densities.items():
    d = res / folder
    d.mkdir(parents=True, exist_ok=True)
    fg = make_square(crop, size, bg=(0, 0, 0, 0), scale=0.66)
    fg.save(d / "ic_launcher_foreground.png")

(res / "values" / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    "<resources>\n"
    '    <color name="ic_launcher_background">#FFFFFF</color>\n'
    "</resources>\n",
    encoding="utf-8",
)

(res / "drawable" / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
    '    android:width="108dp"\n'
    '    android:height="108dp"\n'
    '    android:viewportWidth="108"\n'
    '    android:viewportHeight="108">\n'
    '  <path android:fillColor="#FFFFFF"\n'
    '      android:pathData="M0,0h108v108h-108z"/>\n'
    "</vector>\n",
    encoding="utf-8",
)

notif_sizes = {
    "drawable-mdpi": 24,
    "drawable-hdpi": 36,
    "drawable-xhdpi": 48,
    "drawable-xxhdpi": 72,
    "drawable-xxxhdpi": 96,
    "drawable": 48,
}
sil_src = to_white_silhouette(crop)
for folder, size in notif_sizes.items():
    d = res / folder
    d.mkdir(parents=True, exist_ok=True)
    sq = make_square(sil_src, size, bg=(0, 0, 0, 0), scale=0.9)
    sq.save(d / "ic_stat_elaf.png")

(res / "drawable").mkdir(parents=True, exist_ok=True)
make_square(crop, 256, bg=(255, 255, 255, 255), scale=0.85).save(
    res / "drawable" / "ic_elaf_large.png"
)
make_square(crop, 192, bg=(255, 255, 255, 255), scale=0.85).save(
    res / "drawable" / "ic_elaf.png"
)

print("OK icons generated")
for p in [
    "public/elaf-logo.png",
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png",
    "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png",
    "android/app/src/main/res/drawable/ic_stat_elaf.png",
    "android/app/src/main/res/drawable/ic_elaf_large.png",
]:
    fp = ROOT / p
    print(p, fp.stat().st_size if fp.exists() else "MISSING")
