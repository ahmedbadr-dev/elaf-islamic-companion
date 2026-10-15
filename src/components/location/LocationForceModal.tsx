/** Force-enable location dialog (Google Location Accuracy style) */

type Props = {
  open: boolean
  busy?: boolean
  onTurnOn: () => void
  onDismiss: () => void
  onManageSettings: () => void
}

export function LocationForceModal({
  open,
  busy = false,
  onTurnOn,
  onDismiss,
  onManageSettings,
}: Props) {
  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-[95] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loc-force-title"
    >
      <div
        className="w-full max-w-[360px] rounded-[28px] px-5 pt-6 pb-5 shadow-2xl"
        style={{ background: '#2A2A2A', color: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="loc-force-title"
          className="text-[18px] font-bold leading-snug mb-3"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          لتجربة أفضل، يحتاج جهازك إلى استخدام دقة الموقع
        </h2>

        <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.72)' }}>
          يجب تفعيل الإعدادات التالية:
        </p>

        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
                  fill="#5EC8C8"
                />
              </svg>
            </span>
            <p className="text-[14px] font-semibold leading-snug">موقع الجهاز</p>
          </div>

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="#5EC8C8" strokeWidth="2" />
                <path
                  d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"
                  stroke="#5EC8C8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
              <span className="font-semibold text-white">دقة الموقع</span>
              {' '}
              يستخدم موقع جهازك ومستشعراته وإشارات Wi‑Fi والشبكة لتحسين دقة المواقيت واتجاه القبلة. يمكنك تغيير ذلك في أي وقت من إعدادات الموقع.
            </p>
          </div>
        </div>

        <p className="text-[12px] mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
          يمكنك تغيير هذا في أي وقت من إعدادات الموقع.{' '}
          <button
            type="button"
            onClick={onManageSettings}
            className="underline font-semibold"
            style={{ color: '#8AB4F8' }}
          >
            إدارة الإعدادات
          </button>
        </p>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onDismiss}
            disabled={busy}
            className="flex-1 py-2.5 rounded-full text-[14px] font-bold transition-opacity disabled:opacity-50"
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            لا شكراً
          </button>
          <button
            type="button"
            onClick={onTurnOn}
            disabled={busy}
            className="flex-1 py-2.5 rounded-full text-[14px] font-bold transition-opacity disabled:opacity-60"
            style={{
              background: '#7ED4D4',
              color: '#1A1A1A',
              border: 'none',
            }}
          >
            {busy ? 'جاري التفعيل…' : 'تفعيل'}
          </button>
        </div>
      </div>
    </div>
  )
}
