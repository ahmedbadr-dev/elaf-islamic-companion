/**
 * One-time consent: share approximate location for future nearby mosques.
 */
import { setLocationShareConsent } from '../../services/UserLocationService'

export function MosqueLocationConsentBanner({
  onAccepted,
  onDismiss,
}: {
  onAccepted: () => void
  onDismiss: () => void
}) {
  return (
    <div
      className="fixed inset-x-3 bottom-20 z-[60] rounded-2xl p-4 shadow-lg"
      style={{
        background: '#fff',
        border: '1px solid #CDEEF5',
        boxShadow: '0 12px 40px -12px rgba(19,56,64,0.35)',
      }}
      role="dialog"
      aria-label="مشاركة الموقع للمساجد القريبة"
    >
      <p className="text-[13px] font-black" style={{ color: '#133840' }}>
        المساجد القريبة قريباً
      </p>
      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: '#5A7A80' }}>
        نحتاج موقعك التقريبي فقط لإظهار المساجد القريبة لاحقاً. يمكنك الإلغاء في أي وقت من الإعدادات.
        لن نشارك موقعك مع أطراف أخرى.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-full py-2.5 text-[12px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #24ACB5, #1F969E)' }}
          onClick={() => {
            setLocationShareConsent(true)
            onAccepted()
          }}
        >
          موافق — مشاركة الموقع
        </button>
        <button
          type="button"
          className="rounded-full px-4 py-2.5 text-[12px] font-bold"
          style={{ background: '#F0F5F6', color: '#5A7A80' }}
          onClick={onDismiss}
        >
          لاحقاً
        </button>
      </div>
    </div>
  )
}
