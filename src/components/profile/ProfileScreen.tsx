import { useEffect, useState, type CSSProperties } from 'react'
import type { UserProfile } from '../../services/AuthService'
import { ADHAN_TRACKS } from '../../data/adhanAudio'
import type { useAdhanScheduler } from '../../hooks/useAdhanScheduler'
import type { useAzkarNotifyScheduler } from '../../hooks/useAzkarNotifyScheduler'
import type { usePrayerWidget } from '../../hooks/usePrayerWidget'
import { getOrdersForUser, type OrderRecord } from '../../services/OrderHistoryService'
import { loadMushafTheme, saveMushafTheme, type MushafPaperTheme } from '../../services/UserPrefsService'
import { useSimulator } from '../../context/SimulatorContext'
import { IconAdhanBell, IconSpeakerMute, IconSpeakerSound, IconPhoneShake, IconQuranBook, IconMisbaha, IconKaaba } from '../icons/IslamicIcons'

const MUSHAF_THEMES: { id: MushafPaperTheme; label: string; color: string }[] = [
  { id: 'white', label: 'أبيض', color: '#FFFFFF' },
  { id: 'cream', label: 'كريمي', color: '#FAF6EB' },
  { id: 'emerald', label: 'زمردي', color: '#E6F3EC' },
  { id: 'dark', label: 'ليلي', color: '#1A2B2E' },
]

const STATUS_AR: Record<OrderRecord['status'], string> = {
  pending: 'قيد المراجعة',
  confirmed: 'مؤكد',
  cancelled: 'ملغى',
}

function widgetReasonAr(reason?: string): string {
  switch (reason) {
    case 'notifications_disabled':
      return 'الإشعارات موقوفة لهذا التطبيق — فعّلها من إعدادات النظام'
    case 'channel_blocked':
      return 'قناة «ويدجت الصلاة» موقوفة — فعّلها من إعدادات الإشعارات'
    case 'permission_denied':
      return 'لم يتم منح إذن الإشعارات'
    case 'no_prayers':
    case 'no_next_prayer':
      return 'لا توجد مواقيت صلاة بعد — افتح الصفحة الرئيسية أولاً'
    case 'not_native':
      return 'الويدجت يعمل على تطبيق الجوال فقط'
    case 'timeout':
      return 'انتهت المهلة — تحقق من تفعيل قناة «ويدجت الصلاة» في الإعدادات'
    case 'notify_failed':
    case 'native_not_ok':
    case 'exception':
      return 'تعذّر إظهار الويدجت — أعد المحاولة'
    default:
      return 'تعذّر إظهار الويدجت'
  }
}

export function ProfileScreen({
  user,
  adhan,
  azkarNotify,
  prayerWidget,
  onBack,
  onSave,
  onLogout,
  error,
  onClearError,
}: {
  user: UserProfile
  adhan: ReturnType<typeof useAdhanScheduler>
  azkarNotify: ReturnType<typeof useAzkarNotifyScheduler>
  prayerWidget: ReturnType<typeof usePrayerWidget>
  onBack: () => void
  onSave: (patch: Partial<Pick<UserProfile, 'name' | 'phone' | 'city' | 'bio' | 'email'>>) => Promise<boolean> | boolean
  onLogout: () => void | Promise<void>
  error: string | null
  onClearError: () => void
}) {
  const { state, updateDhikrOption } = useSimulator()
  const [widgetStatus, setWidgetStatus] = useState<string | null>(null)
  const [widgetBusy, setWidgetBusy] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [city, setCity] = useState(user.city)
  const [bio, setBio] = useState(user.bio)
  const [saved, setSaved] = useState(false)
  const [orders, setOrders] = useState<OrderRecord[]>(() => getOrdersForUser(user.id))
  const [mushafTheme, setMushafTheme] = useState<MushafPaperTheme>(() => loadMushafTheme())

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
    setPhone(user.phone)
    setCity(user.city)
    setBio(user.bio)
    setOrders(getOrdersForUser(user.id))
  }, [user])

  const inputStyle: CSSProperties = {
    background: '#F8FCFD',
    border: '1px solid #CDEEF5',
    color: '#133840',
    fontFamily: 'Cairo, sans-serif',
  }

  const save = () => {
    onClearError()
    void (async () => {
      const ok = await onSave({ name, email, phone, city, bio })
      if (ok) {
        setSaved(true)
        window.setTimeout(() => setSaved(false), 2000)
      }
    })()
  }

  const setTheme = (theme: MushafPaperTheme) => {
    setMushafTheme(theme)
    saveMushafTheme(theme)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F8FCFD', direction: 'rtl' }}>
      <div
        className="flex-shrink-0 px-4 pt-8 pb-5"
        style={{
          background: 'linear-gradient(145deg, #0A242C 0%, #133840 55%, #0F4A52 100%)',
          borderBottom: '1px solid rgba(212,175,55,0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="رجوع"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#F8FCFD">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </button>
          <h1 className="font-black text-[16px] text-white">الملف الشخصي</h1>
          <div className="w-9" />
        </div>

        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white overflow-hidden"
            style={{
              background: user.photoURL ? '#fff' : 'linear-gradient(135deg, #24ACB5, #D4AF37)',
              border: '2px solid rgba(255,255,255,0.25)',
            }}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              user.avatarInitials
            )}
          </div>
          <div className="min-w-0">
            <p className="font-black text-[18px] text-white truncate">{user.name}</p>
            <p className="text-[11px] truncate" style={{ color: '#A8C5CB' }}>
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-4">
        {/* Orders history */}
        <section className="elaf-card p-4 space-y-3">
          <h2 className="font-black text-[14px]" style={{ color: '#133840' }}>
            سجل الطلبات
          </h2>
          {orders.length === 0 ? (
            <p className="text-[12px] text-center py-3" style={{ color: '#7E9DA3' }}>
              لا توجد طلبات بعد — اطلب من منتجات إيلاف في الرئيسية
            </p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: '#F8FCFD', border: '1px solid #CDEEF5' }}
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: '#133840' }}>
                      {o.productName}
                    </p>
                    <p className="text-[10px]" style={{ color: '#7E9DA3' }}>
                      {new Date(o.createdAt).toLocaleString('ar-SA', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                      {o.price ? ` · ${o.price}` : ''}
                      {o.customer?.city ? ` · ${o.customer.city}` : ''}
                    </p>
                    {o.customer?.phone && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#7E9DA3' }} dir="ltr">
                        {o.customer.phone}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: '#EAF9FC', color: '#24ACB5' }}
                  >
                    {STATUS_AR[o.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Profile edit */}
        <section className="elaf-card p-4 space-y-3">
          <h2 className="font-black text-[14px]" style={{ color: '#133840' }}>
            تعديل البيانات
          </h2>

          {(
            [
              { label: 'الاسم', value: name, set: setName, type: 'text' },
              { label: 'البريد', value: email, set: setEmail, type: 'email', ltr: true },
              { label: 'الجوال', value: phone, set: setPhone, type: 'tel', ltr: true },
              { label: 'المدينة', value: city, set: setCity, type: 'text' },
            ] as const
          ).map((field) => (
            <label key={field.label} className="block">
              <span className="text-[11px] font-bold mb-1 block" style={{ color: '#7E9DA3' }}>
                {field.label}
              </span>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                style={{
                  ...inputStyle,
                  ...('ltr' in field && field.ltr ? { direction: 'ltr', textAlign: 'right' } : {}),
                }}
              />
            </label>
          ))}

          <label className="block">
            <span className="text-[11px] font-bold mb-1 block" style={{ color: '#7E9DA3' }}>
              نبذة عنك
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="أحب المحافظة على الأوراد..."
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
              style={inputStyle}
            />
          </label>

          {error && (
            <div className="px-3 py-2 rounded-xl text-[11px] font-semibold text-center" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}
          {saved && !error && (
            <div className="px-3 py-2 rounded-xl text-[11px] font-semibold text-center" style={{ background: '#DCFCE7', color: '#166534' }}>
              تم حفظ التعديلات
            </div>
          )}

          <button
            onClick={save}
            className="w-full py-3 rounded-2xl text-[13px] font-black text-white"
            style={{ background: 'linear-gradient(135deg, #24ACB5, #1F969E)' }}
          >
            حفظ التعديلات
          </button>
        </section>

        {/* Mushaf color */}
        <section className="elaf-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <IconQuranBook size={18} color="#24ACB5" />
            <div>
              <p className="font-bold text-[13px]" style={{ color: '#133840' }}>
                لون المصحف
              </p>
              <p className="text-[10px]" style={{ color: '#7E9DA3' }}>
                خلفية صفحات القرآن
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MUSHAF_THEMES.map((t) => {
              const selected = mushafTheme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl"
                  style={{
                    background: selected ? '#EAF9FC' : '#F8FCFD',
                    border: `1.5px solid ${selected ? '#24ACB5' : '#CDEEF5'}`,
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-full border"
                    style={{ background: t.color, borderColor: t.id === 'white' ? '#D0D0D0' : t.color }}
                  />
                  <span className="text-[10px] font-bold" style={{ color: selected ? '#24ACB5' : '#3A5C64' }}>
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Fixed prayer widget (Wemu-style) */}
        <section className="elaf-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconKaaba size={18} color="#24ACB5" />
              <div className="min-w-0">
                <p className="font-bold text-[13px]" style={{ color: '#133840' }}>
                  ويدجت الصلاة الثابت
                </p>
                <p className="text-[10px]" style={{ color: '#7E9DA3' }}>
                  إشعار دائم: الصلاة القادمة + العدّ التنازلي وشعار إيلاف
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => prayerWidget.setEnabled(!prayerWidget.settings.enabled)}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full flex-shrink-0"
              style={{
                background: prayerWidget.settings.enabled ? '#24ACB5' : '#F0F4F6',
                color: prayerWidget.settings.enabled ? '#fff' : '#7E9DA3',
              }}
            >
              {prayerWidget.settings.enabled ? 'مفعّل' : 'متوقف'}
            </button>
          </div>
          {prayerWidget.settings.enabled && (
            <>
              <button
                type="button"
                disabled={widgetBusy}
                onClick={async () => {
                  setWidgetBusy(true)
                  setWidgetStatus('جاري الإظهار…')
                  try {
                    const timeout = new Promise<{ ok: boolean; reason?: string }>((resolve) =>
                      setTimeout(() => resolve({ ok: false, reason: 'timeout' }), 8000)
                    )
                    const res = await Promise.race([prayerWidget.refresh(), timeout])
                    if (res?.ok) {
                      setWidgetStatus('تم — اسحب شريط الإشعارات لرؤية الويدجت')
                    } else {
                      setWidgetStatus(widgetReasonAr(res?.reason))
                    }
                  } catch {
                    setWidgetStatus('تعذّر إظهار الويدجت')
                  } finally {
                    setWidgetBusy(false)
                  }
                }}
                className="w-full text-[11px] font-bold py-2.5 rounded-2xl active:opacity-70"
                style={{
                  background: '#EAF9FC',
                  color: '#24ACB5',
                  border: '1px solid #CDEEF5',
                  opacity: widgetBusy ? 0.6 : 1,
                }}
              >
                {widgetBusy ? 'جاري الإظهار…' : 'إظهار الويدجت الآن'}
              </button>
              {widgetStatus && (
                <p className="text-[10px] leading-relaxed text-center" style={{ color: '#7E9DA3' }}>
                  {widgetStatus}
                </p>
              )}
            </>
          )}
          <div
            className="rounded-2xl p-3 flex items-center gap-3"
            style={{ background: '#0F262C', border: '1px solid #1A3339', direction: 'ltr' }}
          >
            <div
              className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: '#24ACB5' }}
            >
              <img src="/elaf-logo.png" alt="" className="w-7 h-7 object-contain" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2" style={{ direction: 'ltr' }}>
              <p className="flex-1 text-[12px] font-bold text-white text-right truncate" style={{ direction: 'rtl' }}>
                الصلاة القادمة · العشاء
              </p>
              <div className="shrink-0 text-right">
                <p className="text-[10px] truncate" style={{ color: '#9BB8BE', direction: 'rtl' }}>
                  ٦ ربيع الآخر ١٤٤٨
                </p>
                <p className="text-[15px] font-black text-white tabular-nums leading-tight">
                  20:15{' '}
                  <span style={{ color: '#2BB673', fontWeight: 800 }}>−0:26:47</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Adhan voice */}
        <section className="elaf-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconAdhanBell size={18} color="#24ACB5" />
              <div>
                <p className="font-bold text-[13px]" style={{ color: '#133840' }}>
                  صوت الأذان
                </p>
                <p className="text-[10px]" style={{ color: '#7E9DA3' }}>
                  المؤذن ووضع التنبيه
                </p>
              </div>
            </div>
            <button
              onClick={() => void adhan.previewAdhan()}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full"
              style={{ background: '#EAF9FC', color: '#24ACB5', border: '1px solid #CDEEF5' }}
            >
              تجربة
            </button>
          </div>

          <div className="flex gap-1.5">
            {(
              [
                { id: 'sound' as const, label: 'صوت', Icon: IconSpeakerSound },
                { id: 'vibrate' as const, label: 'اهتزاز', Icon: IconPhoneShake },
                { id: 'silent' as const, label: 'صامت', Icon: IconSpeakerMute },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => adhan.setMode(m.id)}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1"
                style={{
                  background: adhan.settings.mode === m.id ? '#24ACB5' : '#F8FCFD',
                  color: adhan.settings.mode === m.id ? '#fff' : '#3A5C64',
                  border: `1px solid ${adhan.settings.mode === m.id ? '#24ACB5' : '#CDEEF5'}`,
                }}
              >
                <m.Icon size={12} color={adhan.settings.mode === m.id ? '#fff' : '#3A5C64'} />
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {ADHAN_TRACKS.map((track) => {
              const selected = adhan.settings.trackId === track.id
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    adhan.setTrackId(track.id)
                    if (adhan.settings.mode === 'sound') void adhan.previewTrack(track.id)
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-right"
                  style={{
                    background: selected ? '#EAF9FC' : '#F8FCFD',
                    border: `1px solid ${selected ? '#24ACB5' : '#CDEEF5'}`,
                  }}
                >
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: '#133840' }}>
                      {track.nameAr}
                    </p>
                    <p className="text-[10px]" style={{ color: '#7E9DA3' }}>
                      {track.nameEn}
                    </p>
                  </div>
                  {selected && (
                    <span className="text-[11px] font-bold" style={{ color: '#24ACB5' }}>
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        {/* Azkar random notifications */}
        <section className="elaf-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconMisbaha size={18} color="#24ACB5" />
              <div>
                <p className="font-bold text-[13px]" style={{ color: '#133840' }}>
                  تنبيهات الأذكار
                </p>
                <p className="text-[10px]" style={{ color: '#7E9DA3' }}>
                  تذكير صوتي عشوائي خلال اليوم مثل الأذان
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => azkarNotify.setEnabled(!azkarNotify.settings.enabled)}
              className="text-[10px] font-bold px-3 py-1.5 rounded-full"
              style={{
                background: azkarNotify.settings.enabled ? '#24ACB5' : '#F0F4F6',
                color: azkarNotify.settings.enabled ? '#fff' : '#7E9DA3',
              }}
            >
              {azkarNotify.settings.enabled ? 'مفعّل' : 'متوقف'}
            </button>
          </div>

          <div className="flex gap-1.5">
            {(
              [
                { id: 'sound' as const, label: 'صوت', Icon: IconSpeakerSound },
                { id: 'vibrate' as const, label: 'اهتزاز', Icon: IconPhoneShake },
                { id: 'silent' as const, label: 'صامت', Icon: IconSpeakerMute },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => azkarNotify.setMode(m.id)}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1"
                style={{
                  background: azkarNotify.settings.mode === m.id ? '#24ACB5' : '#F8FCFD',
                  color: azkarNotify.settings.mode === m.id ? '#fff' : '#3A5C64',
                  border: `1px solid ${azkarNotify.settings.mode === m.id ? '#24ACB5' : '#CDEEF5'}`,
                }}
              >
                <m.Icon size={12} color={azkarNotify.settings.mode === m.id ? '#fff' : '#3A5C64'} />
                {m.label}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-bold" style={{ color: '#3A5C64' }}>
                عدد التذكيرات يومياً
              </p>
              <span className="text-[12px] font-black" style={{ color: '#24ACB5' }}>
                {azkarNotify.settings.timesPerDay}
              </span>
            </div>
            <input
              type="range"
              min={3}
              max={8}
              step={1}
              value={azkarNotify.settings.timesPerDay}
              onChange={(e) => azkarNotify.setTimesPerDay(Number(e.target.value))}
              className="w-full accent-[#24ACB5]"
            />
            <p className="text-[10px] mt-1" style={{ color: '#7E9DA3' }}>
              أوقات عشوائية بين ٧ صباحاً و١٠ مساءً
            </p>
          </div>

          <button
            type="button"
            onClick={() => void azkarNotify.preview()}
            className="w-full py-2.5 rounded-xl text-[12px] font-bold"
            style={{ background: '#EAF9FC', color: '#24ACB5', border: '1px solid #CDEEF5' }}
          >
            تجربة تنبيه ذكر الآن
          </button>
        </section>

        {/* Dhikr / zikr edit */}
        <section className="elaf-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <IconMisbaha size={18} color="#24ACB5" />
            <div>
              <p className="font-bold text-[13px]" style={{ color: '#133840' }}>
                تحديث الأذكار
              </p>
              <p className="text-[10px]" style={{ color: '#7E9DA3' }}>
                عدّل نص الذكر والعدد المستهدف
              </p>
            </div>
          </div>

          {state.dhikrOptions.map((d, i) => (
            <div
              key={d.id}
              className="p-3 rounded-xl space-y-2"
              style={{ background: '#F8FCFD', border: '1px solid #CDEEF5' }}
            >
              <label className="block">
                <span className="text-[10px] font-bold mb-1 block" style={{ color: '#7E9DA3' }}>
                  نص الذكر
                </span>
                <input
                  value={d.text}
                  onChange={(e) => updateDhikrOption(i, { text: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-[13px] outline-none font-bold"
                  style={inputStyle}
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold mb-1 block" style={{ color: '#7E9DA3' }}>
                  العدد المستهدف
                </span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={d.total}
                  onChange={(e) => {
                    const n = Math.max(1, Number(e.target.value) || 1)
                    updateDhikrOption(i, { total: n })
                  }}
                  className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                  style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                />
              </label>
            </div>
          ))}
        </section>

        <button
          onClick={onLogout}
          className="w-full py-3 rounded-2xl text-[13px] font-bold"
          style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  )
}
