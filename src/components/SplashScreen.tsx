import { useEffect, useState } from 'react'

const SPLASH_MS = 3000
const BRAND = '#24ACB5'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / SPLASH_MS)
      setProgress(p)
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setLeaving(true)
        window.setTimeout(onDone, 320)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone])

  return (
    <div
      className="absolute inset-0 z-[200] flex flex-col items-center justify-center px-8"
      style={{
        background: '#FFFFFF',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
      aria-label="شاشة البداية"
    >
      {/* Logo */}
      <div className="flex flex-col items-center flex-1 justify-center w-full">
        <img
          src="/elaf-logo.png"
          alt="إيلاف"
          className="w-[200px] h-[200px] object-contain"
        />

        {/* Divider + quote */}
        <div className="mt-10 w-full max-w-[260px] flex flex-col items-center gap-4">
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: BRAND, opacity: 0.35 }} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill={BRAND} aria-hidden>
              <path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2z" />
            </svg>
            <div className="flex-1 h-px" style={{ background: BRAND, opacity: 0.35 }} />
          </div>
          <p
            className="text-[14px] font-semibold text-center leading-relaxed"
            style={{ color: BRAND }}
          >
            تقنية تُقرب وقيم تُلهم
          </p>
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-full max-w-[200px] mb-14">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(36,172,181,0.15)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress * 100}%`,
              background: BRAND,
              transition: 'width 50ms linear',
            }}
          />
        </div>
      </div>
    </div>
  )
}
