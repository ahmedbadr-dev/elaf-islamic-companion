import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { PrayerItem } from '../types/simulator'
import {
  MORNING_AZKAR_AUDIO,
  MORNING_AZKAR_CHANNEL_ID,
  MORNING_AZKAR_FIRED_KEY,
  MORNING_AZKAR_NOTIF_ID,
  MORNING_AZKAR_OPEN_EVENT,
} from '../data/morningAzkar'

function todayStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function firedKey(day: string): string {
  return `${day}|morning_sabah`
}

function hasFired(day: string): boolean {
  try {
    const raw = localStorage.getItem(MORNING_AZKAR_FIRED_KEY)
    if (!raw) return false
    return (JSON.parse(raw) as string[]).includes(firedKey(day))
  } catch {
    return false
  }
}

function markFired(day: string) {
  try {
    const raw = localStorage.getItem(MORNING_AZKAR_FIRED_KEY)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    list.push(firedKey(day))
    localStorage.setItem(MORNING_AZKAR_FIRED_KEY, JSON.stringify(list.slice(-14)))
  } catch {
    /* ignore */
  }
}

function parseHmToday(time: string, dayOffset = 0): Date | null {
  const latin = (time || '')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
  const [h, m] = (latin.split(' ')[0] || '').split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMilliseconds(0)
  d.setHours(h, m, 0, 0)
  if (dayOffset) d.setDate(d.getDate() + dayOffset)
  return d
}

function fajrAt(prayers: PrayerItem[], dayOffset = 0): Date | null {
  const fajr = prayers.find((p) => p.id === 'fajr')
  if (!fajr?.time) return null
  return parseHmToday(fajr.time, dayOffset)
}

export function buildMorningAzkarTimes(prayers: PrayerItem[]): Date[] {
  const out: Date[] = []
  const mins = MORNING_AZKAR_AUDIO.minutesAfterFajr
  for (const offset of [0, 1]) {
    const fajr = fajrAt(prayers, offset)
    if (!fajr) continue
    const at = new Date(fajr.getTime() + mins * 60_000)
    if (offset === 0 && at.getTime() <= Date.now() + 15_000) continue
    out.push(at)
  }
  return out
}

async function ensureChannel(): Promise<string> {
  const id = MORNING_AZKAR_CHANNEL_ID
  if (!Capacitor.isNativePlatform()) return id
  try {
    await LocalNotifications.createChannel({
      id,
      name: 'أذكار الصباح',
      description: 'تذكير بأذكار الصباح بعد أذان الفجر',
      importance: 4,
      visibility: 1,
      vibration: true,
      sound: undefined,
    })
  } catch (err) {
    console.warn('[MorningAzkar] channel error', err)
  }
  return id
}

export async function cancelMorningAzkarNotifications() {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: MORNING_AZKAR_NOTIF_ID }, { id: MORNING_AZKAR_NOTIF_ID + 1 }],
    })
  } catch (err) {
    console.warn('[MorningAzkar] cancel error', err)
  }
}

export async function scheduleMorningAzkarNotifications(prayers: PrayerItem[]): Promise<void> {
  if (!prayers?.length) return

  try {
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return
  } catch {
    return
  }

  await cancelMorningAzkarNotifications()
  const channelId = await ensureChannel()
  const times = buildMorningAzkarTimes(prayers)
  if (!times.length) return

  try {
    await LocalNotifications.schedule({
      notifications: times.map((at, i) => ({
        id: MORNING_AZKAR_NOTIF_ID + i,
        title: `✦ ${MORNING_AZKAR_AUDIO.title}`,
        body: `${MORNING_AZKAR_AUDIO.subtitle}\n${MORNING_AZKAR_AUDIO.body}`,
        schedule: {
          at,
          allowWhileIdle: true,
        },
        channelId,
        smallIcon: 'ic_stat_elaf',
        largeIcon: 'ic_elaf_large',
        iconColor: '#24ACB5',
        actionTypeId: 'MORNING_AZKAR',
        extra: {
          kind: 'morning_azkar',
          audioId: MORNING_AZKAR_AUDIO.id,
          title: MORNING_AZKAR_AUDIO.title,
          openMedia: true,
        },
      })),
    })
    console.info(
      `[MorningAzkar] scheduled ${times.length} →`,
      times.map((t) => t.toLocaleTimeString())
    )
  } catch (err) {
    console.warn('[MorningAzkar] schedule error', err)
  }
}

/** Open media player UI and start playback */
export function openMorningAzkarMedia(opts?: { autoplay?: boolean }) {
  try {
    window.dispatchEvent(
      new CustomEvent(MORNING_AZKAR_OPEN_EVENT, {
        detail: { autoplay: opts?.autoplay !== false },
      })
    )
  } catch {
    /* ignore */
  }
}

export async function triggerMorningAzkarAlert(opts?: { force?: boolean }) {
  const day = todayStamp()
  if (!opts?.force && hasFired(day)) return
  markFired(day)
  openMorningAzkarMedia({ autoplay: true })
}

let listenersReady = false

export async function setupMorningAzkarListeners() {
  if (listenersReady) return
  listenersReady = true

  await LocalNotifications.addListener('localNotificationReceived', (notification) => {
    const extra = (notification.extra || {}) as { kind?: string }
    if (extra.kind !== 'morning_azkar') return
    void triggerMorningAzkarAlert()
  })

  await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const extra = (event.notification.extra || {}) as { kind?: string }
    if (extra.kind !== 'morning_azkar') return
    void triggerMorningAzkarAlert({ force: true })
  })
}

/** Foreground fallback near Fajr + 60m */
export function checkForegroundMorningAzkar(prayers: PrayerItem[]) {
  const fajr = fajrAt(prayers, 0)
  if (!fajr) return
  const at = new Date(fajr.getTime() + MORNING_AZKAR_AUDIO.minutesAfterFajr * 60_000)
  const now = new Date()
  if (
    at.getFullYear() === now.getFullYear() &&
    at.getMonth() === now.getMonth() &&
    at.getDate() === now.getDate() &&
    at.getHours() === now.getHours() &&
    at.getMinutes() === now.getMinutes()
  ) {
    void triggerMorningAzkarAlert()
  }
}
