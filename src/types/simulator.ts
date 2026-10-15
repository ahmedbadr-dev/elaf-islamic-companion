export type DeviceModel = 'iphone16pro' | 'iphoneSE' | 'galaxyS24' | 'ipadMini'
export type DeviceFinish = 'titanium-natural' | 'space-black' | 'desert-gold' | 'silver'
export type DeviceOrientation = 'portrait' | 'landscape'

export interface PrayerItem {
  id: string
  name: string
  time: string
  icon: string
}

export interface DailyVerse {
  arabic: string
  transliteration: string
  translation: string
  surah: string
}

export interface DhikrOption {
  id: string
  text: string
  total: number
}

export interface ThemeConfig {
  primaryColor: string
  primaryGradientEnd: string
  accentColor: string
  fontScale: number
  borderRadius: number
  colorMode: 'light' | 'dark'
  backgroundStyle: 'clean' | 'sand' | 'emerald' | 'obsidian'
}

export interface SimulatorNotification {
  id: string
  title: string
  body: string
  time: string
  icon?: string
}

export interface SimulatorState {
  deviceModel: DeviceModel
  deviceFinish: DeviceFinish
  orientation: DeviceOrientation
  zoomScale: number
  touchCursor: boolean
  soundEffects: boolean
  isShaking: boolean
  activeTab: 'home' | 'live' | 'misbaha' | 'prayer' | 'quran' | 'athkar'
  isPro: boolean
  showProModal: boolean
  appName: string
  appTagline: string
  cityName: string
  calculationMethod: string
  dailyVerse: DailyVerse
  prayers: PrayerItem[]
  dhikrOptions: DhikrOption[]
  theme: ThemeConfig
  notifications: SimulatorNotification[]
  isLiveEditorOpen: boolean
}
