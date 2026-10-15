import { useEffect, useState, type FormEvent } from 'react'
import { MISBAHA_SHOP } from '../../data/misbahaShop'
import type { UserProfile } from '../../services/AuthService'
import { addOrder } from '../../services/OrderHistoryService'

const DRAFT_KEY = 'elaf-misbaha-order-draft'

type Draft = {
  name: string
  phone: string
  address: string
  city: string
  notes: string
}

function loadDraft(user?: UserProfile | null): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return JSON.parse(raw) as Draft
  } catch {
    /* ignore */
  }
  return {
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: user?.city || '',
    notes: '',
  }
}

export function MisbahaOrderScreen({
  user,
  onBack,
  onOrdered,
}: {
  user: UserProfile | null
  onBack: () => void
  onOrdered: (productName: string) => void
}) {
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [name, setName] = useState(() => loadDraft(user).name)
  const [phone, setPhone] = useState(() => loadDraft(user).phone)
  const [address, setAddress] = useState(() => loadDraft(user).address)
  const [city, setCity] = useState(() => loadDraft(user).city)
  const [notes, setNotes] = useState(() => loadDraft(user).notes)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!user) return
    if (!name && user.name) setName(user.name)
    if (!phone && user.phone) setPhone(user.phone)
    if (!city && user.city) setCity(user.city)
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, phone, address, city, notes }))
    } catch {
      /* ignore */
    }
  }, [name, phone, address, city, notes])

  const gallery = MISBAHA_SHOP.gallery
  const active = gallery[galleryIdx] || gallery[0]

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const n = name.trim()
    const p = phone.trim()
    const a = address.trim()
    const c = city.trim()
    if (n.length < 2) {
      setError('أدخل الاسم الكامل')
      return
    }
    if (p.replace(/\D/g, '').length < 9) {
      setError('أدخل رقم جوال صحيح')
      return
    }
    if (a.length < 5) {
      setError('أدخل عنوان التوصيل بوضوح')
      return
    }
    if (c.length < 2) {
      setError('أدخل المدينة')
      return
    }

    setBusy(true)
    const ownerId = user?.id || `guest_${p.replace(/\D/g, '')}`
    addOrder(ownerId, {
      productId: MISBAHA_SHOP.id,
      productName: MISBAHA_SHOP.name,
      price: MISBAHA_SHOP.price,
      customer: {
        name: n,
        phone: p,
        address: a,
        city: c,
        notes: notes.trim() || undefined,
      },
    })
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    setBusy(false)
    setDone(true)
    window.setTimeout(() => onOrdered(MISBAHA_SHOP.name), 1200)
  }

  const fieldStyle = {
    background: '#F7F8F9',
    border: '1px solid #E8ECEE',
    color: '#133840',
    fontFamily: 'Cairo, sans-serif',
  } as const

  if (done) {
    return (
      <div
        className="absolute inset-0 z-[70] flex flex-col items-center justify-center px-6"
        style={{ background: '#F8FCFD', direction: 'rtl' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: '#E8F8EF' }}
        >
          <span className="text-2xl" style={{ color: '#2BB673' }}>
            ✓
          </span>
        </div>
        <p className="text-lg font-black mb-1" style={{ color: '#133840' }}>
          تم استلام طلبك
        </p>
        <p className="text-[13px] text-center" style={{ color: '#7E9DA3' }}>
          سنتواصل معك قريباً لتأكيد التوصيل
        </p>
      </div>
    )
  }

  return (
    <div
      className="absolute inset-0 z-[70] flex flex-col"
      style={{ background: '#F8FCFD', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #E2EEF0', background: '#fff' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#F0F4F5', color: '#133840' }}
          aria-label="رجوع"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black truncate" style={{ color: '#133840' }}>
            اطلب سبحة إيلاف
          </h1>
          <p className="text-[11px]" style={{ color: '#7E9DA3' }}>
            معرض · السعر · بيانات التوصيل
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        {/* Gallery */}
        <div className="relative" style={{ background: '#0F262C' }}>
          <img
            src={active.src}
            alt={active.alt}
            className="w-full object-contain"
            style={{ height: 260, background: 'linear-gradient(180deg,#133840,#0F262C)' }}
          />
          <span
            className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full"
            style={{ background: '#D4AF37', color: '#133840' }}
          >
            {MISBAHA_SHOP.badge}
          </span>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryIdx(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === galleryIdx ? 18 : 7,
                  height: 7,
                  background: i === galleryIdx ? '#24ACB5' : 'rgba(255,255,255,0.45)',
                }}
                aria-label={`صورة ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {gallery.map((g, i) => (
            <button
              key={g.src + i}
              type="button"
              onClick={() => setGalleryIdx(i)}
              className="flex-shrink-0 rounded-xl overflow-hidden"
              style={{
                width: 64,
                height: 64,
                border: `2px solid ${i === galleryIdx ? '#24ACB5' : '#E2EEF0'}`,
              }}
            >
              <img src={g.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Product info */}
        <div className="px-4 pb-4">
          <h2 className="text-xl font-black mb-1" style={{ color: '#133840' }}>
            {MISBAHA_SHOP.name}
          </h2>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-2xl font-black" style={{ color: '#24ACB5' }}>
              {MISBAHA_SHOP.price}
            </p>
            <p className="text-[11px]" style={{ color: '#7E9DA3' }}>
              {MISBAHA_SHOP.priceNote}
            </p>
          </div>
          <p className="text-[13px] leading-relaxed mb-3" style={{ color: '#3A5C64' }}>
            {MISBAHA_SHOP.description}
          </p>
          <div className="space-y-2 mb-5">
            {MISBAHA_SHOP.features.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{ background: '#24ACB5' }}
                >
                  ✓
                </span>
                <p className="text-[12px] font-semibold" style={{ color: '#133840' }}>
                  {f}
                </p>
              </div>
            ))}
          </div>

          {/* Order form */}
          <div
            className="rounded-3xl p-4"
            style={{ background: '#fff', border: '1px solid #E2EEF0' }}
          >
            <p className="font-black text-[14px] mb-1" style={{ color: '#133840' }}>
              بيانات الطلب
            </p>
            <p className="text-[11px] mb-4" style={{ color: '#7E9DA3' }}>
              أدخل بياناتك لإتمام الطلب بسهولة
            </p>

            <form onSubmit={submit} className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
                  الاسم الكامل
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full px-4 py-3 rounded-2xl text-[13px] outline-none"
                  style={fieldStyle}
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
                  رقم الجوال
                </span>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  inputMode="tel"
                  className="w-full px-4 py-3 rounded-2xl text-[13px] outline-none"
                  style={{ ...fieldStyle, direction: 'ltr', textAlign: 'right' }}
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
                  المدينة
                </span>
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="الرياض"
                  className="w-full px-4 py-3 rounded-2xl text-[13px] outline-none"
                  style={fieldStyle}
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
                  عنوان التوصيل
                </span>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="الحي، الشارع، رقم المبنى / أقرب معلم"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl text-[13px] outline-none resize-none"
                  style={fieldStyle}
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
                  ملاحظات (اختياري)
                </span>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="وقت التوصيل المفضل…"
                  className="w-full px-4 py-3 rounded-2xl text-[13px] outline-none"
                  style={fieldStyle}
                />
              </label>

              {error && (
                <div
                  className="px-3 py-2.5 rounded-xl text-[11px] font-semibold text-center"
                  style={{ background: '#FEE2E2', color: '#991B1B' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #24ACB5, #1F969E)',
                  boxShadow: '0 10px 24px rgba(36,172,181,0.35)',
                }}
              >
                {busy ? 'جارٍ إرسال الطلب…' : `تأكيد الطلب · ${MISBAHA_SHOP.price}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
