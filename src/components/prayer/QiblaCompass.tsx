import { IconKaaba } from '../icons/IslamicIcons'
import { useDeviceHeading } from '../../hooks/useDeviceHeading'

const CARDINALS = [
  { label: 'ش', angle: 0 },
  { label: 'ق', angle: 90 },
  { label: 'ج', angle: 180 },
  { label: 'غ', angle: 270 },
] as const

type Props = {
  qiblaBearing: number
  cityLabel?: string
  enabled?: boolean
  compact?: boolean
}

export function QiblaCompass({
  qiblaBearing,
  cityLabel,
  enabled = true,
  compact = false,
}: Props) {
  const headingState = useDeviceHeading(enabled)
  const heading = headingState.heading
  const size = compact ? 220 : 280
  const dialRotation = heading == null ? 0 : -heading
  const relativeQibla =
    heading == null ? qiblaBearing : ((qiblaBearing - heading) + 360) % 360
  const aligned = heading != null && (relativeQibla < 8 || relativeQibla > 352)

  return (
    <div className="w-full flex flex-col items-center">
      {cityLabel && (
        <p className="text-[11px] font-bold mb-3" style={{ color: '#7E9DA3' }}>
          من {cityLabel.split('،')[0] || cityLabel}
        </p>
      )}

      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #EAF9FC, #F8FCFD)',
            border: `2px solid ${aligned ? '#2BB673' : '#CDEEF5'}`,
            boxShadow: aligned
              ? '0 0 0 6px rgba(43,182,115,0.15), 0 16px 40px rgba(36,172,181,0.18)'
              : '0 16px 40px rgba(36,172,181,0.12)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        />

        {/* Fixed "facing" notch at top */}
        <div
          className="absolute top-1 left-1/2 -translate-x-1/2 z-20 w-0 h-0"
          style={{
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderBottom: `12px solid ${aligned ? '#2BB673' : '#24ACB5'}`,
          }}
        />

        {/* Rotating dial (cardinals + ticks + qibla mark) */}
        <div
          className="absolute inset-3 rounded-full"
          style={{
            transform: `rotate(${dialRotation}deg)`,
            transition: heading == null ? 'none' : 'transform 0.12s linear',
            background: '#fff',
            border: '1px solid #E8F0F2',
          }}
        >
          {/* ticks */}
          {Array.from({ length: 72 }).map((_, i) => {
            const a = i * 5
            const major = a % 30 === 0
            return (
              <div
                key={a}
                className="absolute left-1/2 top-0 origin-[50%_100%]"
                style={{
                  width: 2,
                  height: size / 2 - 12,
                  transform: `translateX(-50%) rotate(${a}deg)`,
                }}
              >
                <span
                  className="block mx-auto rounded-full"
                  style={{
                    width: major ? 2.5 : 1.5,
                    height: major ? 12 : 6,
                    background: major ? '#24ACB5' : '#CDEEF5',
                  }}
                />
              </div>
            )
          })}

          {/* Cardinal labels */}
          {CARDINALS.map((c) => (
            <div
              key={c.label}
              className="absolute left-1/2 top-0 origin-[50%_100%]"
              style={{
                width: 28,
                height: size / 2 - 12,
                transform: `translateX(-50%) rotate(${c.angle}deg)`,
              }}
            >
              <span
                className="flex items-center justify-center text-[13px] font-black mt-3"
                style={{
                  color: c.angle === 0 ? '#24ACB5' : '#3A5C64',
                  transform: `rotate(${-(c.angle + dialRotation)}deg)`,
                }}
              >
                {c.label}
              </span>
            </div>
          ))}

          {/* Qibla marker on dial at absolute bearing */}
          <div
            className="absolute left-1/2 top-0 origin-[50%_100%]"
            style={{
              width: 36,
              height: size / 2 - 12,
              transform: `translateX(-50%) rotate(${qiblaBearing}deg)`,
            }}
          >
            <div
              className="mx-auto mt-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: aligned ? '#2BB673' : '#24ACB5',
                boxShadow: '0 4px 12px rgba(36,172,181,0.4)',
                transform: `rotate(${-(qiblaBearing + dialRotation)}deg)`,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l3 8h8l-6.5 5 2.5 8L12 18l-7 5 2.5-8L1 10h8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Kaaba — fixed center */}
        <div
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{
            width: compact ? 84 : 100,
            height: compact ? 84 : 100,
            background: 'linear-gradient(160deg, #EAF9FC 0%, #D8F3F8 100%)',
            border: '2px solid #24ACB5',
            boxShadow: '0 8px 24px rgba(36,172,181,0.28), inset 0 0 0 3px rgba(36,172,181,0.12)',
          }}
        >
          <IconKaaba size={compact ? 40 : 48} color="#24ACB5" />
        </div>
      </div>

      <div className="mt-5 text-center">
        <p className="font-black text-[22px] tabular-nums" style={{ color: '#133840', direction: 'ltr' }}>
          {Math.round(qiblaBearing)}°
        </p>
        <p className="text-[12px] font-bold mt-1" style={{ color: aligned ? '#2BB673' : '#7E9DA3' }}>
          {heading == null
            ? 'اتجاه القبلة من موقعك (فعّل البوصلة للدقة)'
            : aligned
              ? '✓ أنت باتجاه القبلة'
              : `أدر الجهاز حتى تتوافق العلامة مع السهم`}
        </p>
        {heading != null && (
          <p className="text-[10px] mt-1 tabular-nums" style={{ color: '#A8C5CB', direction: 'ltr' }}>
            البوصلة: {Math.round(heading)}° · الانحراف: {Math.round(relativeQibla)}°
          </p>
        )}
        {headingState.error && (
          <p className="text-[11px] font-semibold mt-2" style={{ color: '#B45309' }}>
            {headingState.error}
          </p>
        )}
        {headingState.permission === 'prompt' || headingState.permission === 'denied' ? (
          <p className="text-[10px] mt-2 px-4" style={{ color: '#7E9DA3' }}>
            على بعض الأجهزة يلزم السماح بالوصول إلى مستشعر الحركة / البوصلة
          </p>
        ) : null}
      </div>
    </div>
  )
}
