/**
 * Prayer times via Aladhan API (same source as The-Prayer-Project).
 * Prefer device coordinates; fall back to city/country when needed.
 * @see https://github.com/Abdo-Nsila/The-Prayer-Project
 * @see https://aladhan.com/prayer-times-api
 */

import type { PrayerItem } from '../types/simulator'

export type CalculationMethodName =
  | 'أم القرى'
  | 'رابطة العالم الإسلامي'
  | 'الهيئة المصرية'
  | 'الاتحاد الإسلامي'

const METHOD_IDS: Record<CalculationMethodName, number> = {
  'أم القرى': 4,
  'رابطة العالم الإسلامي': 3,
  'الهيئة المصرية': 5,
  'الاتحاد الإسلامي': 2,
}

const PRAYER_META: { key: string; id: string; name: string; icon: string }[] = [
  { key: 'Fajr', id: 'fajr', name: 'الفجر', icon: 'fajr' },
  { key: 'Sunrise', id: 'sunrise', name: 'الشروق', icon: 'sunrise' },
  { key: 'Dhuhr', id: 'dhuhr', name: 'الظهر', icon: 'dhuhr' },
  { key: 'Asr', id: 'asr', name: 'العصر', icon: 'asr' },
  { key: 'Maghrib', id: 'maghrib', name: 'المغرب', icon: 'maghrib' },
  { key: 'Isha', id: 'isha', name: 'العشاء', icon: 'isha' },
]

const ALADHAN_BASE = 'https://api.aladhan.com/v1'

/** Normalize "05:12 (EET)" → "05:12" and force Latin digits */
function cleanTime(raw: string): string {
  const latin = (raw || '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  return latin.split(' ')[0]?.trim() || '--:--'
}

function formatDateParam(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

function mapTimings(timings: Record<string, string>): PrayerItem[] {
  return PRAYER_META.map((p) => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    time: cleanTime(timings[p.key]),
  }))
}

async function fetchAladhanJson(url: string): Promise<any> {
  const bust = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`
  const res = await fetch(bust, { cache: 'no-store' })
  if (!res.ok) throw new Error('تعذر جلب أوقات الصلاة')
  const json = await res.json()
  if (json?.code !== 200 || !json?.data?.timings) {
    throw new Error('استجابة غير صالحة من خدمة المواقيت')
  }
  return json
}

export function methodIdFromName(name: string): number {
  return METHOD_IDS[name as CalculationMethodName] ?? 4
}

export async function fetchPrayerTimesByCoords(options: {
  latitude: number
  longitude: number
  methodName?: string
  date?: Date
}): Promise<{ prayers: PrayerItem[]; timezone?: string; dateReadable?: string }> {
  const method = methodIdFromName(options.methodName || 'أم القرى')
  const dateStr = formatDateParam(options.date || new Date())

  const url =
    `${ALADHAN_BASE}/timings/${dateStr}` +
    `?latitude=${options.latitude}` +
    `&longitude=${options.longitude}` +
    `&method=${method}` +
    `&school=0`

  const json = await fetchAladhanJson(url)
  return {
    prayers: mapTimings(json.data.timings as Record<string, string>),
    timezone: json.data.meta?.timezone,
    dateReadable: json.data.date?.readable,
  }
}

/** City/country fallback — same endpoint style as The-Prayer-Project */
export async function fetchPrayerTimesByCity(options: {
  city: string
  country: string
  methodName?: string
  date?: Date
}): Promise<{ prayers: PrayerItem[]; timezone?: string; dateReadable?: string }> {
  const method = methodIdFromName(options.methodName || 'أم القرى')
  const dateStr = formatDateParam(options.date || new Date())
  const url =
    `${ALADHAN_BASE}/timingsByCity/${dateStr}` +
    `?city=${encodeURIComponent(options.city)}` +
    `&country=${encodeURIComponent(options.country)}` +
    `&method=${method}` +
    `&school=0`

  const json = await fetchAladhanJson(url)
  return {
    prayers: mapTimings(json.data.timings as Record<string, string>),
    timezone: json.data.meta?.timezone,
    dateReadable: json.data.date?.readable,
  }
}

/** Parse "الرياض، المملكة العربية السعودية" → city + country for Aladhan */
export function parseCityCountryLabel(label: string | null | undefined): {
  city: string
  country: string
} | null {
  if (!label) return null
  const parts = label
    .split(/[،,]/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] }
  if (parts.length === 1) return { city: parts[0], country: 'Saudi Arabia' }
  return null
}

/** Index of next upcoming prayer — skips sunrise (not a salah) */
export function getNextPrayerIndex(prayers: PrayerItem[], now = new Date()): number {
  const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  for (let i = 0; i < prayers.length; i++) {
    if (prayers[i].id === 'sunrise') continue
    const [h, m] = (prayers[i].time || '00:00').split(':').map(Number)
    if ((h || 0) * 60 + (m || 0) > mins + 0.01) return i
  }
  // All passed → tomorrow's first salah
  const first = prayers.findIndex((p) => p.id !== 'sunrise')
  return first >= 0 ? first : 0
}
