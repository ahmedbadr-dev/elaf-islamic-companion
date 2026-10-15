import React, { useState, useEffect, useRef, type ReactNode } from 'react'
import { useSimulator } from '../../context/SimulatorContext'
import { NotificationBanner } from './NotificationBanner'
import { IconMosque } from '../icons/IslamicIcons'

interface DeviceFrameProps {
  children: ReactNode
}

export function DeviceFrame({ children }: DeviceFrameProps) {
  const { state, triggerNotification, playSound } = useSimulator()
  const [currentTime, setCurrentTime] = useState('09:41')
  const [islandExpanded, setIslandExpanded] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })
  const [isPressing, setIsPressing] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)

  // Update clock every minute
  useEffect(() => {
    const updateTime = () => {
      const d = new Date()
      const hours = d.getHours().toString().padStart(2, '0')
      const mins = d.getMinutes().toString().padStart(2, '0')
      setCurrentTime(`${hours}:${mins}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [])

  // Touch pointer tracking within the phone screen
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!screenRef.current || !state.touchCursor) return
    const rect = screenRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCursorPos({ x, y, active: true })
  }

  const handleMouseLeave = () => {
    setCursorPos((prev) => ({ ...prev, active: false }))
    setIsPressing(false)
  }

  const handleMouseDown = () => {
    if (state.touchCursor) {
      setIsPressing(true)
    }
  }

  const handleMouseUp = () => {
    if (state.touchCursor) {
      setIsPressing(false)
    }
  }

  // Device dimensions based on model and orientation
  const isLandscape = state.orientation === 'landscape'
  const model = state.deviceModel

  let width = 393
  let height = 852
  let borderRadius = 54
  let bezelSize = 12

  if (model === 'galaxyS24') {
    width = 384
    height = 832
    borderRadius = 44
    bezelSize = 10
  } else if (model === 'iphoneSE') {
    width = 375
    height = 667
    borderRadius = 38
    bezelSize = 16
  } else if (model === 'ipadMini') {
    width = 744
    height = 980
    borderRadius = 36
    bezelSize = 16
  }

  if (isLandscape) {
    const temp = width
    width = height
    height = temp
  }

  // Bezel & Finish colors
  const finish = state.deviceFinish
  let outerBezelColor = '#3e3b38'
  let innerBezelColor = '#1f1e1d'
  let edgeGleam = 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.4) 100%)'

  if (finish === 'space-black') {
    outerBezelColor = '#1e1e20'
    innerBezelColor = '#0c0c0d'
    edgeGleam = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.6) 100%)'
  } else if (finish === 'desert-gold') {
    outerBezelColor = '#b59e83'
    innerBezelColor = '#4a3d31'
    edgeGleam = 'linear-gradient(135deg, rgba(255,245,230,0.4) 0%, rgba(255,235,200,0.1) 50%, rgba(0,0,0,0.4) 100%)'
  } else if (finish === 'silver') {
    outerBezelColor = '#dcdde1'
    innerBezelColor = '#2f3542'
    edgeGleam = 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 50%, rgba(0,0,0,0.3) 100%)'
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-300 ${
        state.isShaking ? 'phone-shake' : ''
      }`}
      style={{
        transform: `scale(${state.zoomScale})`,
        transformOrigin: 'top center',
      }}
    >
      {/* Device Physical Buttons (iPhone / Android) */}
      {!isLandscape && model !== 'ipadMini' && (
        <>
          {/* Left Buttons: Action, Volume Up, Volume Down */}
          <div
            className="absolute -left-[15px] top-[115px] w-[5px] h-[30px] rounded-l-md transition-colors"
            style={{ background: outerBezelColor }}
          />
          <div
            className="absolute -left-[15px] top-[160px] w-[5px] h-[55px] rounded-l-md transition-colors"
            style={{ background: outerBezelColor }}
          />
          <div
            className="absolute -left-[15px] top-[225px] w-[5px] h-[55px] rounded-l-md transition-colors"
            style={{ background: outerBezelColor }}
          />
          {/* Right Button: Power */}
          <div
            className="absolute -right-[15px] top-[170px] w-[5px] h-[80px] rounded-r-md transition-colors"
            style={{ background: outerBezelColor }}
          />
        </>
      )}

      {/* Main Outer Chassis */}
      <div
        className="relative shadow-[0_25px_70px_rgba(0,0,0,0.45),0_10px_20px_rgba(0,0,0,0.25)] transition-all duration-300"
        style={{
          width: width + bezelSize * 2,
          height: height + bezelSize * 2,
          borderRadius: borderRadius + bezelSize,
          padding: bezelSize,
          background: outerBezelColor,
          boxShadow: `0 0 0 2px ${outerBezelColor}, 0 20px 60px -10px rgba(0,0,0,0.7), inset 0 0 4px rgba(255,255,255,0.2)`,
        }}
      >
        {/* Subtle metallic bezel rim gleam */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: borderRadius + bezelSize,
            background: edgeGleam,
            opacity: 0.7,
          }}
        />

        {/* Inner Bezel Border */}
        <div
          className="relative w-full h-full overflow-hidden flex flex-col transition-all duration-300"
          style={{
            borderRadius: borderRadius,
            background: innerBezelColor,
            boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.1), inset 0 0 8px rgba(0,0,0,0.9)',
          }}
        >
          {/* Screen Wrapper */}
          <div
            ref={screenRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            className={`relative w-full h-full flex flex-col overflow-hidden ${
              state.theme.colorMode === 'dark' ? 'dark-mode' : ''
            }`}
            style={{
              borderRadius: borderRadius - 2,
              background: state.theme.colorMode === 'dark' ? '#0A1B20' : '#F8FCFD',
              direction: 'rtl',
              cursor: state.touchCursor ? 'none' : 'default',
            }}
          >
            {/* Simulated Push Notification Banner */}
            <NotificationBanner />

            {/* Dynamic Island / Camera Notch */}
            {model === 'iphone16pro' && !isLandscape && (
              <div
                onClick={() => {
                  playSound('click')
                  setIslandExpanded(!islandExpanded)
                }}
                className={`absolute top-2.5 left-1/2 -translate-x-1/2 z-50 bg-black text-white flex items-center justify-between px-3 cursor-pointer shadow-lg transition-all duration-300 ${
                  islandExpanded
                    ? 'w-[320px] h-[72px] rounded-3xl p-3'
                    : 'w-[124px] h-[34px] rounded-full hover:scale-105'
                }`}
                style={{ direction: 'ltr' }}
                title="اضغط لتوسيع Dynamic Island"
              >
                {!islandExpanded ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#24ACB5] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#5ce6ee]">إيلاف</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/70">المغرب</span>
                      <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                        <IconMosque size={10} color="#5ce6ee" />
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#24ACB5] to-[#133840] flex items-center justify-center text-lg">
                        <IconMosque size={20} color="#FFFFFF" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-white">الصلاة القادمة: المغرب</p>
                        <p className="text-[10px] text-white/60">متبقي: ٢ ساعة و١٧ دقيقة</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        triggerNotification({
                          title: 'حان الآن وقت أذان المغرب',
                          body: 'الله أكبر، الله أكبر',
                        })
                      }}
                      className="text-[10px] px-2.5 py-1 bg-[#24ACB5] text-white font-bold rounded-full hover:brightness-110 active:scale-95"
                    >
                      أذان
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Samsung S24 Punch Hole Camera */}
            {model === 'galaxyS24' && !isLandscape && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-3.5 h-3.5 rounded-full bg-black border border-white/10 shadow-inner flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0a1520]/80" />
              </div>
            )}

            {/* Status Bar */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-6 pt-3 pb-1 text-[12px] font-bold z-40 select-none"
              style={{
                direction: 'ltr',
                color: state.theme.colorMode === 'dark' ? '#F1F9FB' : '#133840',
              }}
            >
              {/* Left: Time */}
              <span className="font-semibold tracking-tight">{currentTime}</span>

              {/* Center brand logo (when not on iphone16pro dynamic island) */}
              {(model !== 'iphone16pro' || isLandscape) && (
                <div className="flex items-center gap-1">
                  <span className="font-black text-[13px]" style={{ color: state.theme.primaryColor }}>
                    {state.appName}
                  </span>
                  <span className="text-[8px]" style={{ color: state.theme.accentColor }}>
                    ✦
                  </span>
                  <span className="font-bold text-[11px]" style={{ color: state.theme.primaryColor }}>
                    {state.appTagline}
                  </span>
                </div>
              )}

              {/* Right: Signal, 5G, Battery */}
              <div className="flex items-center gap-1.5">
                {/* 5G / Signal icon */}
                <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
                  <rect x="0" y="7" width="2.5" height="4" rx="0.5" />
                  <rect x="3.5" y="5" width="2.5" height="6" rx="0.5" />
                  <rect x="7" y="3" width="2.5" height="8" rx="0.5" />
                  <rect x="10.5" y="0.5" width="2.5" height="10.5" rx="0.5" />
                </svg>
                {/* Wi-Fi */}
                <svg width="13" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.8 0 7.27 1.48 9.87 3.91L12 18.25 2.13 11.41C4.73 8.98 8.2 7.5 12 7.5z" />
                </svg>
                {/* Battery */}
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-semibold tabular-nums">98%</span>
                  <div className="w-5 h-2.5 rounded-[3px] border border-current p-[1px] flex items-center">
                    <div className="h-full w-[90%] bg-emerald-500 rounded-[1.5px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Inner Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">{children}</div>

            {/* Bottom Home Indicator Pill */}
            {!isLandscape && (
              <div className="flex-shrink-0 flex items-center justify-center py-2 z-40">
                <div
                  className="w-32 h-1 rounded-full transition-colors"
                  style={{
                    background: state.theme.colorMode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                  }}
                />
              </div>
            )}

            {/* Realistic Touch Pointer Ripple Cursor */}
            {state.touchCursor && cursorPos.active && (
              <div
                className="absolute pointer-events-none z-[999] transition-transform duration-75"
                style={{
                  left: cursorPos.x,
                  top: cursorPos.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Main touch circle */}
                <div
                  className={`w-7 h-7 rounded-full border border-white/60 shadow-lg backdrop-blur-xs flex items-center justify-center transition-all duration-150 ${
                    isPressing
                      ? 'scale-75 bg-[#24ACB5]/60 ring-4 ring-[#24ACB5]/40'
                      : 'scale-100 bg-white/40 ring-2 ring-black/10'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-white/90" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
