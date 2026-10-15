import React from 'react'
import { useSimulator } from '../../context/SimulatorContext'
import type { DeviceModel, DeviceFinish } from '../../types/simulator'
import {
  IconMosque,
  IconSmartphone,
  IconTablet,
  IconRotateOrientation,
  IconSunToggle,
  IconMoonToggle,
  IconTouchPointer,
  IconSpeakerSound,
  IconSpeakerMute,
  IconPhoneShake,
  IconAdhanBell,
  IconPaletteStudio,
} from '../icons/IslamicIcons'

export function SimulatorBar() {
  const {
    state,
    setDeviceModel,
    setDeviceFinish,
    setOrientation,
    setZoomScale,
    toggleTouchCursor,
    toggleSoundEffects,
    triggerShake,
    triggerNotification,
    updateTheme,
    setIsPro,
    toggleLiveEditor,
    playSound,
  } = useSimulator()

  const devices: { id: DeviceModel; label: string; IconComp: React.ComponentType<{ size?: number }> }[] = [
    { id: 'iphone16pro', label: 'iPhone 16 Pro', IconComp: IconSmartphone },
    { id: 'galaxyS24', label: 'Galaxy S24', IconComp: IconSmartphone },
    { id: 'iphoneSE', label: 'iPhone SE', IconComp: IconSmartphone },
    { id: 'ipadMini', label: 'iPad Mini', IconComp: IconTablet },
  ]

  const finishes: { id: DeviceFinish; label: string; color: string }[] = [
    { id: 'titanium-natural', label: 'تيتانيوم طبيعي', color: '#7C7A77' },
    { id: 'space-black', label: 'أسود فضائي', color: '#1E1E20' },
    { id: 'desert-gold', label: 'ذهبي صحراوي', color: '#B59E83' },
    { id: 'silver', label: 'فضي لامع', color: '#E3E3E5' },
  ]

  const scales = [
    { label: '75%', val: 0.75 },
    { label: '85%', val: 0.85 },
    { label: '100%', val: 1.0 },
    { label: '110%', val: 1.1 },
  ]

  return (
    <header className="w-full bg-[#0D2227]/90 backdrop-blur-md border-b border-[#1E434D] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none text-white z-50">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#24ACB5]/20 to-[#133840] flex items-center justify-center shadow-md border border-[#24ACB5]/40 text-[#24ACB5]">
          <IconMosque size={20} color="#24ACB5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-[15px] tracking-wide text-white">محاكي تطبيق إيلاف الذكي</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#24ACB5]/20 text-[#24ACB5] font-semibold border border-[#24ACB5]/30">
              Live Simulator
            </span>
          </div>
          <p className="text-[11px] text-white/50">معاينة حية ومحرر مباشر لعناصر التطبيق</p>
        </div>
      </div>

      {/* Middle Controls: Device, Finish, Orientation, Scale */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Device selector */}
        <div className="flex items-center bg-[#133840]/70 p-1 rounded-xl border border-[#1E434D]">
          {devices.map(({ id, label, IconComp }) => (
            <button
              key={id}
              onClick={() => {
                playSound('click')
                setDeviceModel(id)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                state.deviceModel === id
                  ? 'bg-[#24ACB5] text-white shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconComp size={13} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Device Finish color dots */}
        <div className="flex items-center gap-1.5 bg-[#133840]/70 px-2.5 py-1.5 rounded-xl border border-[#1E434D]">
          <span className="text-[10px] text-white/50 ml-1">الهيكل:</span>
          {finishes.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                playSound('click')
                setDeviceFinish(f.id)
              }}
              title={f.label}
              className={`w-4 h-4 rounded-full border transition-all ${
                state.deviceFinish === f.id
                  ? 'ring-2 ring-[#24ACB5] scale-110 border-white'
                  : 'border-white/30 hover:scale-105'
              }`}
              style={{ background: f.color }}
            />
          ))}
        </div>

        {/* Orientation toggle */}
        <button
          onClick={() => {
            playSound('click')
            setOrientation(state.orientation === 'portrait' ? 'landscape' : 'portrait')
          }}
          title="تدوير الشاشة أفقي / رأسي"
          className="flex items-center gap-1.5 bg-[#133840]/70 hover:bg-[#133840] px-3 py-1.5 rounded-xl border border-[#1E434D] text-[11px] font-semibold text-white/80 hover:text-white transition-all"
        >
          <IconRotateOrientation size={13} />
          <span>{state.orientation === 'portrait' ? 'رأسي' : 'أفقي'}</span>
        </button>

        {/* Zoom scale */}
        <div className="flex items-center bg-[#133840]/70 p-1 rounded-xl border border-[#1E434D]">
          {scales.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                playSound('click')
                setZoomScale(s.val)
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                state.zoomScale === s.val
                  ? 'bg-[#24ACB5] text-white shadow-xs'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: Quick Toggles & Open Editor Button */}
      <div className="flex items-center gap-2">
        {/* Dark/Light mode inside phone */}
        <button
          onClick={() => {
            playSound('click')
            updateTheme({
              colorMode: state.theme.colorMode === 'dark' ? 'light' : 'dark',
            })
          }}
          title="تبديل الوضع الداكن والفاتح"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#133840]/70 hover:bg-[#133840] border border-[#1E434D] text-white text-xs transition-all"
        >
          {state.theme.colorMode === 'dark' ? (
            <>
              <IconMoonToggle size={13} />
              <span>داكن</span>
            </>
          ) : (
            <>
              <IconSunToggle size={13} />
              <span>فاتح</span>
            </>
          )}
        </button>

        {/* Touch cursor toggle */}
        <button
          onClick={() => {
            playSound('click')
            toggleTouchCursor()
          }}
          title="مؤشر اللمس الذكي"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
            state.touchCursor ? 'bg-[#24ACB5]/30 text-[#24ACB5] border-[#24ACB5]/50' : 'bg-[#133840]/70 text-white/50 border-[#1E434D]'
          }`}
        >
          <IconTouchPointer size={13} />
          <span>لمس</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            playSound('click')
            toggleSoundEffects()
          }}
          title="المؤثرات الصوتية والنقر"
          className={`p-2 rounded-xl border text-xs transition-all ${
            state.soundEffects ? 'bg-[#24ACB5]/30 text-[#24ACB5] border-[#24ACB5]/50' : 'bg-[#133840]/70 text-white/50 border-[#1E434D]'
          }`}
        >
          {state.soundEffects ? <IconSpeakerSound size={14} /> : <IconSpeakerMute size={14} />}
        </button>

        {/* Shake button */}
        <button
          onClick={triggerShake}
          title="محاكاة هز الهاتف"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#133840]/70 hover:bg-[#133840] border border-[#1E434D] text-xs font-semibold text-white/80 hover:text-white transition-all active:scale-95"
        >
          <IconPhoneShake size={13} />
          <span>هز الجهاز</span>
        </button>

        {/* Adhan alert trigger */}
        <button
          onClick={() => {
            triggerNotification({
              title: 'حان الآن وقت أذان المغرب',
              body: 'حي على الصلاة، حي على الفلاح',
            })
          }}
          title="محاكاة إشعار الأذان"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#133840]/70 hover:bg-[#133840] border border-[#1E434D] text-xs font-semibold text-white/80 hover:text-white transition-all active:scale-95"
        >
          <IconAdhanBell size={13} />
          <span>إشعار أذان</span>
        </button>

        {/* Pro toggle switch */}
        <button
          onClick={() => setIsPro(!state.isPro)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            state.isPro
              ? 'bg-gradient-to-r from-[#FEF9E7] to-[#FFF3C4] text-[#997300] border-[#D4AF37] shadow-sm'
              : 'bg-[#133840]/70 text-white/70 border-[#1E434D] hover:text-white'
          }`}
        >
          <span className="text-[#D4AF37]">✦</span>
          <span>{state.isPro ? 'PRO مفعّل' : 'PRO مجاني'}</span>
        </button>

        {/* Live Studio Editor Drawer Toggle */}
        <button
          onClick={toggleLiveEditor}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all ${
            state.isLiveEditorOpen
              ? 'bg-[#24ACB5] text-white shadow-[#24ACB5]/30 ring-2 ring-white/20'
              : 'bg-white text-[#133840] hover:bg-slate-100'
          }`}
        >
          <IconPaletteStudio size={14} />
          <span>{state.isLiveEditorOpen ? 'إغلاق المحرر' : 'محرر التعديلات'}</span>
        </button>
      </div>
    </header>
  )
}
