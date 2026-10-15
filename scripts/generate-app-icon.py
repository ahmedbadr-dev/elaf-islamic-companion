"""Generate Android + web app icons from branded teal Elaf logo."""
from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "images" / "app-icon-source.png"
TEAL = (13, 138, 150, 255)  # approximate brand teal from icon

src = Image.open(SRC).convert("RGBA")

# Sample corner for exact background color
px = src.getpixel((8, 8))
BG = (px[0], px[1], px[2], 255)
print("bg", BG)


def fit(img: Image.Image, size: int, scale: float = 1.0) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BG)
    target = max(1, int(size * scale))
    resized = img.resize((target, target), Image.Resampling.LANCZOS)
    ox = (size - target) // 2
    oy = (size - target) // 2
    canvas.alpha_composite(resized, (ox, oy))
    return canvas


def round_icon(img: Image.Image) -> Image.Image:
    size = img.size[0]
    out = img.copy()
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out.putalpha(mask)
    return out


def extract_white_logo(img: Image.Image) -> Image.Image:
    """Keep near-white logo pixels, transparent elsewhere (for notification/stat)."""
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sp = img.load()
    op = out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = sp[x, y]
            # white-ish logo strokes
            if a > 10 and r > 200 and g > 200 and b > 200:
                op[x, y] = (255, 255, 255, a)
    return out


res = ROOT / "android" / "app" / "src" / "main" / "res"

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

for folder, size in densities.items():
    d = res / folder
    d.mkdir(parents=True, exist_ok=True)
    icon = fit(src, size, 1.0)
    icon.save(d / "ic_launcher.png", optimize=True)
    round_icon(icon).save(d / "ic_launcher_round.png", optimize=True)

# Adaptive foreground: full artwork inset into safe zone (~66–72%)
for folder, size in fg_densities.items():
    d = res / folder
    d.mkdir(parents=True, exist_ok=True)
    # transparent canvas + centered full icon (with teal bg included) so pattern shows
    fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inset = int(size * 0.72)
    layer = src.resize((inset, inset), Image.Resampling.LANCZOS)
    ox = (size - inset) // 2
    oy = (size - inset) // 2
    fg.alpha_composite(layer, (ox, oy))
    fg.save(d / "ic_launcher_foreground.png", optimize=True)

hex_bg = "#{:02X}{:02X}{:02X}".format(BG[0], BG[1], BG[2])
(res / "values" / "ic_launcher_background.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    "<resources>\n"
    f'    <color name="ic_launcher_background">{hex_bg}</color>\n'
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
    f'  <path android:fillColor="{hex_bg}"\n'
    '      android:pathData="M0,0h108v108h-108z"/>\n'
    "</vector>\n",
    encoding="utf-8",
)

# Ensure adaptive XML points at mipmap foreground + color background
(res / "mipmap-anydpi-v26").mkdir(parents=True, exist_ok=True)
adaptive = (
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
    '    <background android:drawable="@color/ic_launcher_background"/>\n'
    '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
    "</adaptive-icon>\n"
)
(res / "mipmap-anydpi-v26" / "ic_launcher.xml").write_text(adaptive, encoding="utf-8")
(res / "mipmap-anydpi-v26" / "ic_launcher_round.xml").write_text(adaptive, encoding="utf-8")

# Notification white silhouette
logo = extract_white_logo(src)
notif_sizes = {
    "drawable-mdpi": 24,
    "drawable-hdpi": 36,
    "drawable-xhdpi": 48,
    "drawable-xxhdpi": 72,
    "drawable-xxxhdpi": 96,
    "drawable": 48,
}
for folder, size in notif_sizes.items():
    d = res / folder
    d.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    target = int(size * 0.88)
    layer = logo.resize((target, target), Image.Resampling.LANCZOS)
    canvas.alpha_composite(layer, ((size - target) // 2, (size - target) // 2))
    canvas.save(d / "ic_stat_elaf.png", optimize=True)

# Web / PWA / splash favicon assets
web = fit(src, 512, 1.0)
web.save(ROOT / "public" / "app-icon.png", optimize=True)
web.convert("RGB").save(ROOT / "public" / "elaf-logo.png", optimize=True, quality=95)
web.save(ROOT / "public" / "images" / "elaf-logo-icon.png", optimize=True)

# Large drawable copies
(res / "drawable").mkdir(parents=True, exist_ok=True)
fit(src, 256, 1.0).save(res / "drawable" / "ic_elaf_large.png", optimize=True)
fit(src, 192, 1.0).save(res / "drawable" / "ic_elaf.png", optimize=True)

# resources/icon for capacitor assets tooling
resources = ROOT / "resources"
resources.mkdir(parents=True, exist_ok=True)
fit(src, 1024, 1.0).convert("RGB").save(resources / "icon.png", optimize=True, quality=95)

print("OK app icons generated", hex_bg)
print("launcher", (res / "mipmap-xxhdpi" / "ic_launcher.png").stat().st_size)
print("web", (ROOT / "public" / "app-icon.png").stat().st_size)
