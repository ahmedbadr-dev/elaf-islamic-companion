/** Adhan MP3 catalog from https://github.com/Kiwifu/adhan-mp3 */

export type AdhanMode = 'sound' | 'vibrate' | 'silent'

export interface AdhanTrack {
  id: string
  /** Short Arabic label */
  nameAr: string
  /** English / region label */
  nameEn: string
  /** Path under public/ (and Capacitor web assets) */
  src: string
  /** Android res/raw name without extension (a-z0-9_) */
  rawName: string
}

export const ADHAN_TRACKS: AdhanTrack[] = [
  {
    id: 'madinah',
    nameAr: 'الحرم المدني',
    nameEn: 'Al-Madinah',
    src: '/audio/adhan/madinah.mp3',
    rawName: 'madinah',
  },
  {
    id: 'aqsa',
    nameAr: 'المسجد الأقصى',
    nameEn: 'Al-Aqsa',
    src: '/audio/adhan/aqsa.mp3',
    rawName: 'aqsa',
  },
  {
    id: 'mishary',
    nameAr: 'مشاري العفاسي',
    nameEn: 'Mishary Alafasy',
    src: '/audio/adhan/mishary.mp3',
    rawName: 'mishary',
  },
  {
    id: 'qatami',
    nameAr: 'ناصر القطامي',
    nameEn: 'Nasser Al-Qatami',
    src: '/audio/adhan/qatami.mp3',
    rawName: 'qatami',
  },
  {
    id: 'dosari',
    nameAr: 'ياسر الدوسري',
    nameEn: 'Yasser Al-Dosari',
    src: '/audio/adhan/dosari.mp3',
    rawName: 'dosari',
  },
]

export const ADHAN_SETTINGS_KEY = 'elaf-adhan-settings'
export const ADHAN_CHANNEL_ID = 'elaf_adhan'
export const ADHAN_FIRED_KEY = 'elaf-adhan-fired'

export interface AdhanSettings {
  mode: AdhanMode
  trackId: string
  enabled: boolean
}

export const DEFAULT_ADHAN_SETTINGS: AdhanSettings = {
  mode: 'sound',
  trackId: 'madinah',
  enabled: true,
}

export function loadAdhanSettings(): AdhanSettings {
  try {
    const raw = localStorage.getItem(ADHAN_SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_ADHAN_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AdhanSettings>
    return {
      mode: parsed.mode === 'vibrate' || parsed.mode === 'silent' ? parsed.mode : 'sound',
      trackId: ADHAN_TRACKS.some((t) => t.id === parsed.trackId)
        ? (parsed.trackId as string)
        : DEFAULT_ADHAN_SETTINGS.trackId,
      enabled: parsed.enabled !== false,
    }
  } catch {
    return { ...DEFAULT_ADHAN_SETTINGS }
  }
}

export function saveAdhanSettings(settings: AdhanSettings) {
  localStorage.setItem(ADHAN_SETTINGS_KEY, JSON.stringify(settings))
}

export function getAdhanTrack(trackId: string): AdhanTrack {
  return ADHAN_TRACKS.find((t) => t.id === trackId) || ADHAN_TRACKS[0]
}

/** Prayer ids that get an adhan (skip sunrise) */
export function isAdhanPrayer(id: string): boolean {
  return ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(id)
}
