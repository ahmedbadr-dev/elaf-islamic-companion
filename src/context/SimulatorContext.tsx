import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type {
  SimulatorState,
  DeviceModel,
  DeviceFinish,
  DeviceOrientation,
  DailyVerse,
  PrayerItem,
  DhikrOption,
  ThemeConfig,
  SimulatorNotification,
} from '../types/simulator'

/** Fallback until GPS + Aladhan load (Umm al-Qura / Riyadh sample) */
const DEFAULT_PRAYERS: PrayerItem[] = [
  { id: 'fajr', name: 'الفجر', time: '04:22', icon: 'fajr' },
  { id: 'sunrise', name: 'الشروق', time: '05:40', icon: 'sunrise' },
  { id: 'dhuhr', name: 'الظهر', time: '11:47', icon: 'dhuhr' },
  { id: 'asr', name: 'العصر', time: '15:15', icon: 'asr' },
  { id: 'maghrib', name: 'المغرب', time: '17:54', icon: 'maghrib' },
  { id: 'isha', name: 'العشاء', time: '19:24', icon: 'isha' },
]

/** Older bundled defaults — auto-replaced with DEFAULT_PRAYERS on load */
const LEGACY_DEFAULT_TIMES_SETS = [
  ['04:47', '06:14', '12:28', '15:51', '18:43', '20:12'],
  ['05:11', '06:39', '12:51', '16:21', '19:02', '20:20'],
  ['05:12', '06:40', '12:49', '16:18', '18:58', '20:15'],
]

function resolvePrayers(saved: PrayerItem[] | undefined): PrayerItem[] {
  if (!saved?.length) return DEFAULT_PRAYERS
  const times = saved.map((p) => p.time)
  const isLegacyDefault = LEGACY_DEFAULT_TIMES_SETS.some((legacy) =>
    legacy.every((t, i) => times[i] === t)
  )
  return isLegacyDefault ? DEFAULT_PRAYERS : saved
}

const DEFAULT_VERSE: DailyVerse = {
  arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  transliteration: 'Alā bidhikri llāhi taṭmaʾinnu l-qulūb',
  translation: 'Verily, in the remembrance of Allah do hearts find rest.',
  surah: 'سورة الرعد — ٢٨',
}

const DEFAULT_DHIKR: DhikrOption[] = [
  { id: 'subhanallah', text: 'سُبْحَانَ اللَّهِ', total: 33 },
  { id: 'alhamdulillah', text: 'الْحَمْدُ لِلَّهِ', total: 33 },
  { id: 'allahuakbar', text: 'اللَّهُ أَكْبَرُ', total: 33 },
  { id: 'lailaha', text: 'لَا إِلَهَ إِلَّا اللَّهُ', total: 100 },
  { id: 'salawat', text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', total: 100 },
]

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#24ACB5',
  primaryGradientEnd: '#133840',
  accentColor: '#D4AF37',
  fontScale: 1,
  borderRadius: 16,
  colorMode: 'light',
  backgroundStyle: 'clean',
}

interface SimulatorContextType {
  state: SimulatorState
  updateVerse: (verse: Partial<DailyVerse>) => void
  updatePrayers: (prayers: PrayerItem[]) => void
  updatePrayerTime: (index: number, time: string) => void
  updateBrand: (data: { appName?: string; appTagline?: string; cityName?: string; calculationMethod?: string }) => void
  updateTheme: (theme: Partial<ThemeConfig>) => void
  updateDhikrOption: (index: number, patch: Partial<DhikrOption>) => void
  setDeviceModel: (model: DeviceModel) => void
  setDeviceFinish: (finish: DeviceFinish) => void
  setOrientation: (orientation: DeviceOrientation) => void
  setZoomScale: (scale: number) => void
  toggleTouchCursor: () => void
  toggleSoundEffects: () => void
  triggerShake: () => void
  triggerNotification: (notif?: Partial<SimulatorNotification>) => void
  dismissNotification: (id: string) => void
  setActiveTab: (tab: SimulatorState['activeTab']) => void
  setIsPro: (isPro: boolean) => void
  setShowProModal: (show: boolean) => void
  toggleLiveEditor: () => void
  playSound: (type?: 'click' | 'dhikr' | 'adhan' | 'celebrate') => void
  resetToDefaults: () => void
  exportConfigJson: () => string
  importConfigJson: (json: string) => boolean
}

const STORAGE_KEY = 'elaf_simulator_config_v1'

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined)

// Audio synthesizer for realistic mobile haptic click and chime feedback
function playSyntheticSound(type: 'click' | 'dhikr' | 'adhan' | 'celebrate' = 'click') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    if (type === 'click') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    } else if (type === 'dhikr') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(540, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } else if (type === 'celebrate') {
      const freqs = [523.25, 659.25, 783.99, 1046.5]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const start = ctx.currentTime + idx * 0.08
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.35)
      })
    } else if (type === 'adhan') {
      // Gentle spiritual chord chime
      const chord = [392, 493.88, 587.33, 783.99]
      chord.forEach((freq) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 1.2)
      })
    }
  } catch {
    // Ignore audio permission or context restrictions
  }
}

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimulatorState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return {
          deviceModel: parsed.deviceModel || 'iphone16pro',
          deviceFinish: parsed.deviceFinish || 'titanium-natural',
          orientation: parsed.orientation || 'portrait',
          zoomScale: parsed.zoomScale || 1,
          touchCursor: parsed.touchCursor !== undefined ? parsed.touchCursor : true,
          soundEffects: parsed.soundEffects !== undefined ? parsed.soundEffects : true,
          isShaking: false,
          activeTab: parsed.activeTab || 'home',
          isPro: parsed.isPro || false,
          showProModal: false,
          appName: parsed.appName || 'إيلاف',
          appTagline: parsed.appTagline || 'ELAF',
          cityName: parsed.cityName || 'الرياض، المملكة العربية السعودية',
          calculationMethod: parsed.calculationMethod || 'أم القرى',
          dailyVerse: parsed.dailyVerse || DEFAULT_VERSE,
          prayers: resolvePrayers(parsed.prayers),
          dhikrOptions: parsed.dhikrOptions || DEFAULT_DHIKR,
          theme: parsed.theme || DEFAULT_THEME,
          notifications: [],
          isLiveEditorOpen: parsed.isLiveEditorOpen !== undefined ? parsed.isLiveEditorOpen : true,
        }
      } catch {
        // Fall back to default
      }
    }
    return {
      deviceModel: 'iphone16pro',
      deviceFinish: 'titanium-natural',
      orientation: 'portrait',
      zoomScale: 1,
      touchCursor: true,
      soundEffects: true,
      isShaking: false,
      activeTab: 'home',
      isPro: false,
      showProModal: false,
      appName: 'إيلاف',
      appTagline: 'ELAF',
      cityName: 'الرياض، المملكة العربية السعودية',
      calculationMethod: 'أم القرى',
      dailyVerse: DEFAULT_VERSE,
      prayers: DEFAULT_PRAYERS,
      dhikrOptions: DEFAULT_DHIKR,
      theme: DEFAULT_THEME,
      notifications: [],
      isLiveEditorOpen: true,
    }
  })

  // Save changes to localStorage
  useEffect(() => {
    const toSave = {
      deviceModel: state.deviceModel,
      deviceFinish: state.deviceFinish,
      orientation: state.orientation,
      zoomScale: state.zoomScale,
      touchCursor: state.touchCursor,
      soundEffects: state.soundEffects,
      activeTab: state.activeTab,
      isPro: state.isPro,
      appName: state.appName,
      appTagline: state.appTagline,
      cityName: state.cityName,
      calculationMethod: state.calculationMethod,
      dailyVerse: state.dailyVerse,
      prayers: state.prayers,
      dhikrOptions: state.dhikrOptions,
      theme: state.theme,
      isLiveEditorOpen: state.isLiveEditorOpen,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch {
      // ignore
    }
  }, [state])

  const playSound = useCallback(
    (type: 'click' | 'dhikr' | 'adhan' | 'celebrate' = 'click') => {
      if (state.soundEffects) {
        playSyntheticSound(type)
      }
    },
    [state.soundEffects]
  )

  const updateVerse = (verse: Partial<DailyVerse>) => {
    setState((prev) => ({ ...prev, dailyVerse: { ...prev.dailyVerse, ...verse } }))
  }

  const updatePrayers = (prayers: PrayerItem[]) => {
    setState((prev) => ({ ...prev, prayers }))
  }

  const updatePrayerTime = (index: number, time: string) => {
    setState((prev) => {
      const nextPrayers = [...prev.prayers]
      if (nextPrayers[index]) {
        nextPrayers[index] = { ...nextPrayers[index], time }
      }
      return { ...prev, prayers: nextPrayers }
    })
  }

  const updateBrand = (data: { appName?: string; appTagline?: string; cityName?: string; calculationMethod?: string }) => {
    setState((prev) => ({ ...prev, ...data }))
  }

  const updateTheme = (theme: Partial<ThemeConfig>) => {
    setState((prev) => ({ ...prev, theme: { ...prev.theme, ...theme } }))
  }

  const updateDhikrOption = (index: number, patch: Partial<DhikrOption>) => {
    setState((prev) => {
      const next = [...prev.dhikrOptions]
      if (!next[index]) return prev
      next[index] = { ...next[index], ...patch }
      return { ...prev, dhikrOptions: next }
    })
  }

  const setDeviceModel = (model: DeviceModel) => {
    setState((prev) => ({ ...prev, deviceModel: model }))
  }

  const setDeviceFinish = (finish: DeviceFinish) => {
    setState((prev) => ({ ...prev, deviceFinish: finish }))
  }

  const setOrientation = (orientation: DeviceOrientation) => {
    setState((prev) => ({ ...prev, orientation }))
  }

  const setZoomScale = (scale: number) => {
    setState((prev) => ({ ...prev, zoomScale: scale }))
  }

  const toggleTouchCursor = () => {
    setState((prev) => ({ ...prev, touchCursor: !prev.touchCursor }))
  }

  const toggleSoundEffects = () => {
    setState((prev) => ({ ...prev, soundEffects: !prev.soundEffects }))
  }

  const triggerShake = () => {
    playSound('click')
    setState((prev) => ({ ...prev, isShaking: true }))
    setTimeout(() => {
      setState((prev) => ({ ...prev, isShaking: false }))
    }, 800)
  }

  const triggerNotification = (notif?: Partial<SimulatorNotification>) => {
    const newNotif: SimulatorNotification = {
      id: Date.now().toString(),
      title: notif?.title || 'حان الآن وقت أذان المغرب',
      body: notif?.body || 'الله أكبر، الله أكبر. لا إله إلا الله',
      time: notif?.time || 'الآن',
      icon: notif?.icon || 'mosque',
    }
    playSound('adhan')
    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications].slice(0, 3),
    }))

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissNotification(newNotif.id)
    }, 5000)
  }

  const dismissNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }))
  }

  const setActiveTab = (tab: SimulatorState['activeTab']) => {
    playSound('click')
    setState((prev) => ({ ...prev, activeTab: tab }))
  }

  const setIsPro = (isPro: boolean) => {
    playSound('celebrate')
    setState((prev) => ({ ...prev, isPro }))
  }

  const setShowProModal = (show: boolean) => {
    playSound('click')
    setState((prev) => ({ ...prev, showProModal: show }))
  }

  const toggleLiveEditor = () => {
    setState((prev) => ({ ...prev, isLiveEditorOpen: !prev.isLiveEditorOpen }))
  }

  const resetToDefaults = () => {
    playSound('click')
    localStorage.removeItem(STORAGE_KEY)
    setState({
      deviceModel: 'iphone16pro',
      deviceFinish: 'titanium-natural',
      orientation: 'portrait',
      zoomScale: 1,
      touchCursor: true,
      soundEffects: true,
      isShaking: false,
      activeTab: 'home',
      isPro: false,
      showProModal: false,
      appName: 'إيلاف',
      appTagline: 'ELAF',
      cityName: 'الرياض، المملكة العربية السعودية',
      calculationMethod: 'أم القرى',
      dailyVerse: DEFAULT_VERSE,
      prayers: DEFAULT_PRAYERS,
      dhikrOptions: DEFAULT_DHIKR,
      theme: DEFAULT_THEME,
      notifications: [],
      isLiveEditorOpen: true,
    })
  }

  const exportConfigJson = () => {
    return JSON.stringify(
      {
        appName: state.appName,
        appTagline: state.appTagline,
        cityName: state.cityName,
        calculationMethod: state.calculationMethod,
        dailyVerse: state.dailyVerse,
        prayers: state.prayers,
        dhikrOptions: state.dhikrOptions,
        theme: state.theme,
      },
      null,
      2
    )
  }

  const importConfigJson = (json: string): boolean => {
    try {
      const data = JSON.parse(json)
      setState((prev) => ({
        ...prev,
        appName: data.appName || prev.appName,
        appTagline: data.appTagline || prev.appTagline,
        cityName: data.cityName || prev.cityName,
        calculationMethod: data.calculationMethod || prev.calculationMethod,
        dailyVerse: data.dailyVerse || prev.dailyVerse,
        prayers: data.prayers || prev.prayers,
        dhikrOptions: data.dhikrOptions || prev.dhikrOptions,
        theme: data.theme || prev.theme,
      }))
      playSound('celebrate')
      return true
    } catch {
      return false
    }
  }

  return (
    <SimulatorContext.Provider
      value={{
        state,
        updateVerse,
        updatePrayers,
        updatePrayerTime,
        updateBrand,
        updateTheme,
        updateDhikrOption,
        setDeviceModel,
        setDeviceFinish,
        setOrientation,
        setZoomScale,
        toggleTouchCursor,
        toggleSoundEffects,
        triggerShake,
        triggerNotification,
        dismissNotification,
        setActiveTab,
        setIsPro,
        setShowProModal,
        toggleLiveEditor,
        playSound,
        resetToDefaults,
        exportConfigJson,
        importConfigJson,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  )
}

export function useSimulator() {
  const context = useContext(SimulatorContext)
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider')
  }
  return context
}
