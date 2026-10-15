import { QiblaCompass } from './QiblaCompass'
import { useLocationPrayerTimes } from '../../hooks/useLocationPrayerTimes'
import { useSimulator } from '../../context/SimulatorContext'

export function QiblaOverlay({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { state } = useSimulator()
  const location = useLocationPrayerTimes(state.calculationMethod)
  const bearing = location.qiblaBearing ?? 127
  const cityLabel = location.cityLabel ?? state.cityName

  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-[90] flex items-center justify-center px-5"
      style={{ background: 'rgba(13,34,39,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[340px] rounded-[28px] p-5 pt-4 slide-up"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FCFD 100%)',
          border: '1px solid #CDEEF5',
          boxShadow: '0 24px 60px -12px rgba(19,56,64,0.45)',
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="اتجاه القبلة"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-black leading-tight" style={{ color: '#133840' }}>
              اتجاه القبلة
            </h2>
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: '#7E9DA3' }}>
              وجّه الجهاز أفقياً حتى تتوافق العلامة مع السهم
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#EAF9FC', border: '1px solid #CDEEF5', color: '#7E9DA3' }}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {location.error && (
          <p className="text-[11px] font-semibold text-center mb-2" style={{ color: '#B45309' }}>
            {location.error}
          </p>
        )}

        <div
          className="rounded-[24px] px-2 py-4 flex items-center justify-center"
          style={{
            background: 'linear-gradient(160deg, #EAF9FC 0%, #F8FCFD 55%, #FFFFFF 100%)',
            border: '1px solid #CDEEF5',
          }}
        >
          <QiblaCompass
            qiblaBearing={bearing}
            cityLabel={cityLabel}
            enabled={open}
            compact
          />
        </div>

        <button
          type="button"
          onClick={() => void location.refresh({ forcePermission: true, forceFresh: true })}
          disabled={location.loading}
          className="mt-4 w-full py-2.5 rounded-full text-[12px] font-bold disabled:opacity-60"
          style={{ background: '#EAF9FC', color: '#24ACB5', border: '1px solid #CDEEF5' }}
        >
          {location.loading ? 'جاري التحديث…' : 'تحديث الموقع'}
        </button>
      </div>
    </div>
  )
}
