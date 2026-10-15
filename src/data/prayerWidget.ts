import type { PrayerItem } from '../types/simulator'

export const PRAYER_WIDGET_SETTINGS_KEY = 'elaf-prayer-widget-settings'
export const PRAYER_WIDGET_CHANNEL_ID = 'elaf_prayer_widget'
export const PRAYER_WIDGET_NOTIF_ID = 7001

export interface PrayerWidgetSettings {
  enabled: boolean
}

export const DEFAULT_PRAYER_WIDGET_SETTINGS: PrayerWidgetSettings = {
  enabled: true,
}

export function loadPrayerWidgetSettings(): PrayerWidgetSettings {
  try {
    const raw = localStorage.getItem(PRAYER_WIDGET_SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_PRAYER_WIDGET_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<PrayerWidgetSettings>
    return { enabled: parsed.enabled !== false }
  } catch {
    return { ...DEFAULT_PRAYER_WIDGET_SETTINGS }
  }
}

export function savePrayerWidgetSettings(settings: PrayerWidgetSettings) {
  localStorage.setItem(PRAYER_WIDGET_SETTINGS_KEY, JSON.stringify(settings))
}

export function parsePrayerDateToday(time: string, now = new Date()): Date {
  const latin = (time || '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  const [h, m] = (latin.split(' ')[0] || '00:00').split(':').map(Number)
  const d = new Date(now)
  d.setSeconds(0, 0)
  d.setMilliseconds(0)
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

/** Next prayer target Date (rolls to tomorrow if all passed) */
export function getNextPrayerTarget(prayers: PrayerItem[], now = new Date()): {
  prayer: PrayerItem
  at: Date
} | null {
  if (!prayers?.length) return null
  const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  for (const prayer of prayers) {
    if (prayer.id === 'sunrise') continue
    const [h, m] = (prayer.time || '00:00').split(':').map(Number)
    const pMins = (h || 0) * 60 + (m || 0)
    if (pMins > mins + 0.01) {
      return { prayer, at: parsePrayerDateToday(prayer.time, now) }
    }
  }
  // After last prayer → tomorrow's first non-sunrise
  const first = prayers.find((p) => p.id !== 'sunrise') || prayers[0]
  const at = parsePrayerDateToday(first.time, now)
  at.setDate(at.getDate() + 1)
  return { prayer: first, at }
}

/** Always include seconds so the live ticker is visible (H:MM:SS). */
export function formatCountdown(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function formatWidgetTitle(prayerName: string): string {
  return `الصلاة القادمة · ${prayerName}`
}

export function formatWidgetBody(time: string, countdown: string): string {
  return `${time}   −${countdown}`
}
