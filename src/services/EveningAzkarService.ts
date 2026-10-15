import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { PrayerItem } from '../types/simulator'
import {
  EVENING_AZKAR_AUDIO,
  EVENING_AZKAR_CHANNEL_ID,
  EVENING_AZKAR_FIRED_KEY,
  EVENING_AZKAR_NOTIF_ID,
  EVENING_AZKAR_OPEN_EVENT,
} from '../data/eveningAzkar'

function todayStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function firedKey(day: string): string {
  return `${day}|evening_massa`
}

function hasFired(day: string): boolean {
  try {
    const raw = localStorage.getItem(EVENING_AZKAR_FIRED_KEY)
    if (!raw) return false
    return (JSON.parse(raw) as string[]).includes(firedKey(day))
  } catch {
    return false
  }
}

function markFired(day: string) {
  try {
    const raw = localStorage.getItem(EVENING_AZKAR_FIRED_KEY)
    const list = raw ? (JSON.parse(raw) as string[]) : []
    list.push(firedKey(day))
    localStorage.setItem(EVENING_AZKAR_FIRED_KEY, JSON.stringify(list.slice(-14)))
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

function maghribAt(prayers: PrayerItem[], dayOffset = 0): Date | null {
  const maghrib = prayers.find((p) => p.id === 'maghrib')
  if (!maghrib?.time) return null
  return parseHmToday(maghrib.time, dayOffset)
}

export function buildEveningAzkarTimes(prayers: PrayerItem[]): Date[] {
  const out: Date[] = []
  const mins = EVENING_AZKAR_AUDIO.minutesBeforeMaghrib
  for (const offset of [0, 1]) {
    const maghrib = maghribAt(prayers, offset)
    if (!maghrib) continue
    const at = new Date(maghrib.getTime() - mins * 60_000)
    if (offset === 0 && at.getTime() <= Date.now() + 15_000) continue
    out.push(at)
  }
  return out
}

async function ensureChannel(): Promise<string> {
  const id = EVENING_AZKAR_CHANNEL_ID
  if (!Capacitor.isNativePlatform()) return id
  try {
    await LocalNotifications.createChannel({
      id,
      name: 'أذكار المساء',
      description: 'تذكير بأذكار المساء قبل أذان المغرب',
      importance: 4,
      visibility: 1,
      vibration: true,
      sound: undefined,
    })
  } catch (err) {
    console.warn('[EveningAzkar] channel error', err)
  }
  return id
}

export async function cancelEveningAzkarNotifications() {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: EVENING_AZKAR_NOTIF_ID }, { id: EVENING_AZKAR_NOTIF_ID + 1 }] })
  } catch (err) {
    console.warn('[EveningAzkar] cancel error', err)
  }
}

export async function scheduleEveningAzkarNotifications(prayers: PrayerItem[]): Promise<void> {
  if (!prayers?.length) return

  try {
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return
  } catch {
    return
  }

  await cancelEveningAzkarNotifications()
  const channelId = await ensureChannel()
  const times = buildEveningAzkarTimes(prayers)
  if (!times.length) return

  try {
    await LocalNotifications.schedule({
      notifications: times.map((at, i) => ({
        id: EVENING_AZKAR_NOTIF_ID + i,
        title: `✦ ${EVENING_AZKAR_AUDIO.title}`,
        body: `${EVENING_AZKAR_AUDIO.subtitle}\n${EVENING_AZKAR_AUDIO.body}`,
        schedule: {
          at,
          allowWhileIdle: true,
        },
        channelId,
        smallIcon: 'ic_stat_elaf',
        largeIcon: 'ic_elaf_large',
        iconColor: '#24ACB5',
        actionTypeId: 'EVENING_AZKAR',
        extra: {
          kind: 'evening_azkar',
          audioId: EVENING_AZKAR_AUDIO.id,
          title: EVENING_AZKAR_AUDIO.title,
          openMedia: true,
        },
      })),
    })
    console.info(
      `[EveningAzkar] scheduled ${times.length} →`,
      times.map((t) => t.toLocaleTimeString())
    )
  } catch (err) {
    console.warn('[EveningAzkar] schedule error', err)
  }
}

/** Open media player UI and start playback */
export function openEveningAzkarMedia(opts?: { autoplay?: boolean }) {
  try {
    window.dispatchEvent(
      new CustomEvent(EVENING_AZKAR_OPEN_EVENT, {
        detail: { autoplay: opts?.autoplay !== false },
      })
    )
  } catch {
    /* ignore */
  }
}

export async function triggerEveningAzkarAlert(opts?: { force?: boolean }) {
  const day = todayStamp()
  if (!opts?.force && hasFired(day)) return
  markFired(day)
  openEveningAzkarMedia({ autoplay: true })
}

let listenersReady = false

export async function setupEveningAzkarListeners() {
  if (listenersReady) return
  listenersReady = true

  await LocalNotifications.addListener('localNotificationReceived', (notification) => {
    const extra = (notification.extra || {}) as { kind?: string }
    if (extra.kind !== 'evening_azkar') return
    void triggerEveningAzkarAlert()
  })

  await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const extra = (event.notification.extra || {}) as { kind?: string }
    if (extra.kind !== 'evening_azkar') return
    void triggerEveningAzkarAlert({ force: true })
  })
}

/** Foreground fallback near Maghrib − 15m (does not use schedule filter) */
export function checkForegroundEveningAzkar(prayers: PrayerItem[]) {
  const maghrib = maghribAt(prayers, 0)
  if (!maghrib) return
  const at = new Date(maghrib.getTime() - EVENING_AZKAR_AUDIO.minutesBeforeMaghrib * 60_000)
  const now = new Date()
  if (
    at.getFullYear() === now.getFullYear() &&
    at.getMonth() === now.getMonth() &&
    at.getDate() === now.getDate() &&
    at.getHours() === now.getHours() &&
    at.getMinutes() === now.getMinutes()
  ) {
    void triggerEveningAzkarAlert()
  }
}
