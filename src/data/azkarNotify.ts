import type { AdhanMode } from './adhanAudio'
import { ATHKAR_AUDIO, MISBAHA_AUDIO } from './azkarAudio'

export type AzkarNotifyMode = AdhanMode

export interface AzkarNotifyItem {
  key: string
  title: string
  body: string
}

/** Pool of athkar / dhikr used for random daily voice notifications */
export const AZKAR_NOTIFY_POOL: AzkarNotifyItem[] = [
  { key: 'morning-0', title: 'أذكار الصباح', body: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ' },
  { key: 'morning-1', title: 'أذكار الصباح', body: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ' },
  { key: 'morning-2', title: 'أذكار الصباح', body: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ' },
  { key: 'morning-3', title: 'أذكار الصباح', body: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ' },
  { key: 'morning-4', title: 'أذكار الصباح', body: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ' },
  { key: 'evening-0', title: 'أذكار المساء', body: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ' },
  { key: 'evening-1', title: 'أذكار المساء', body: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ' },
  { key: 'evening-2', title: 'أذكار المساء', body: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا' },
  { key: 'evening-3', title: 'أذكار المساء', body: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي' },
  { key: 'post-prayer-0', title: 'أذكار بعد الصلاة', body: 'سُبْحَانَ اللَّهِ' },
  { key: 'post-prayer-1', title: 'أذكار بعد الصلاة', body: 'الْحَمْدُ لِلَّهِ' },
  { key: 'post-prayer-2', title: 'أذكار بعد الصلاة', body: 'اللَّهُ أَكْبَرُ' },
  { key: 'post-prayer-3', title: 'أذكار بعد الصلاة', body: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ' },
  { key: 'sleep-0', title: 'أذكار النوم', body: 'بِسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا' },
  { key: 'sleep-1', title: 'أذكار النوم', body: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ' },
  { key: 'sleep-2', title: 'أذكار النوم', body: 'آيَةُ الْكُرْسِيِّ' },
  { key: 'subhanallah', title: 'ذكر', body: 'سُبْحَانَ اللَّهِ' },
  { key: 'alhamdulillah', title: 'ذكر', body: 'الْحَمْدُ لِلَّهِ' },
  { key: 'allahuakbar', title: 'ذكر', body: 'اللَّهُ أَكْبَرُ' },
  { key: 'salawat', title: 'الصلاة على النبي', body: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ' },
]

export const AZKAR_NOTIFY_SETTINGS_KEY = 'elaf-azkar-notify-settings'
export const AZKAR_NOTIFY_CHANNEL_ID = 'elaf_azkar'
export const AZKAR_NOTIFY_FIRED_KEY = 'elaf-azkar-notify-fired'
export const AZKAR_NOTIFY_SCHEDULE_KEY = 'elaf-azkar-notify-schedule'

export interface AzkarNotifySettings {
  enabled: boolean
  mode: AzkarNotifyMode
  /** How many random reminders per day (3–8) */
  timesPerDay: number
}

export const DEFAULT_AZKAR_NOTIFY_SETTINGS: AzkarNotifySettings = {
  enabled: true,
  mode: 'sound',
  timesPerDay: 5,
}

export function loadAzkarNotifySettings(): AzkarNotifySettings {
  try {
    const raw = localStorage.getItem(AZKAR_NOTIFY_SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_AZKAR_NOTIFY_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AzkarNotifySettings>
    const times = Number(parsed.timesPerDay)
    return {
      enabled: parsed.enabled !== false,
      mode: parsed.mode === 'vibrate' || parsed.mode === 'silent' ? parsed.mode : 'sound',
      timesPerDay: Number.isFinite(times) ? Math.min(8, Math.max(3, Math.round(times))) : 5,
    }
  } catch {
    return { ...DEFAULT_AZKAR_NOTIFY_SETTINGS }
  }
}

export function saveAzkarNotifySettings(settings: AzkarNotifySettings) {
  localStorage.setItem(AZKAR_NOTIFY_SETTINGS_KEY, JSON.stringify(settings))
}

export function getAzkarNotifyItem(key: string): AzkarNotifyItem | undefined {
  return AZKAR_NOTIFY_POOL.find((x) => x.key === key)
}

export function hasAzkarAudio(key: string): boolean {
  return !!(ATHKAR_AUDIO[key] || MISBAHA_AUDIO[key])
}
