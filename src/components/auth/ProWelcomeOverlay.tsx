import { IconSparkle, IconMisbaha } from '../icons/IslamicIcons'

export function ProWelcomeOverlay({
  userName,
  onClose,
}: {
  userName?: string
  onClose: () => void
}) {
  const first = (userName || '').trim().split(/\s+/)[0] || 'بك'

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(10,27,32,0.55)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center slide-up"
        style={{ background: '#fff', border: '1px solid #CDEEF5', direction: 'rtl' }}
      >
        <div className="flex justify-center mb-3">
          <IconSparkle size={48} color="#D4AF37" />
        </div>
        <p className="text-xl font-black mb-1" style={{ color: '#133840', fontFamily: 'Cairo, sans-serif' }}>
          أهلاً {first} 🌿
        </p>
        <p className="font-bold mb-3" style={{ color: '#24ACB5' }}>
          مرحباً بك في عائلة إيلاف PRO
        </p>
        <p className="text-[13px] leading-relaxed mb-5" style={{ color: '#3A5C64' }}>
          تم ربط سبحتك بحسابك. يمكنك الآن الاستمتاع بكل المزايا: العدّ الذكي، التسميع، إيلاف AI، والمزيد.
        </p>

        <div className="space-y-2 mb-5 text-right">
          {[
            'عدّ الأذكار بلمس السبحة',
            'التسميع في المصحف',
            'مساعد إيلاف AI',
            'استعادة المزايا عند تسجيل الدخول',
          ].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <IconMisbaha size={14} color="#24ACB5" />
              <p className="text-[12px] font-semibold" style={{ color: '#133840' }}>
                {t}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl text-[14px] font-black text-white"
          style={{
            background: 'linear-gradient(135deg, #24ACB5, #1F969E)',
            boxShadow: '0 10px 24px rgba(36,172,181,0.35)',
          }}
        >
          ابدأ رحلتك
        </button>
      </div>
    </div>
  )
}
