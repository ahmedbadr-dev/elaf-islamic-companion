import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { AzkarVoice } from './AzkarVoiceService'
import {
  AZKAR_NOTIFY_CHANNEL_ID,
  AZKAR_NOTIFY_FIRED_KEY,
  AZKAR_NOTIFY_POOL,
  AZKAR_NOTIFY_SCHEDULE_KEY,
  getAzkarNotifyItem,
  type AzkarNotifyMode,
  type AzkarNotifySettings,
} from '../data/azkarNotify'

const NOTIF_ID_BASE = 7200
const NOTIF_ID_MAX = 7299

let listenersReady = false
let vibrateTimer: number | null = null

export type AzkarScheduleItem = {
  id: number
  at: Date
  key: string
  title: string
  body: string
  timeLabel: string
}

function seededRandom(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function daySeed(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function formatHm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function firedKey(day: string, timeLabel: string, audioKey: string): string {
  return `${day}|${timeLabel}|${audioKey}`
}

function readFired(): Set<string> {
  try {
    const raw = localStorage.getItem(AZKAR_NOTIFY_FIRED_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function markFired(key: string) {
  const set = readFired()
  set.add(key)
  localStorage.setItem(AZKAR_NOTIFY_FIRED_KEY, JSON.stringify([...set].slice(-60)))
}

function hasFired(day: string, timeLabel: string, audioKey: string): boolean {
  return readFired().has(firedKey(day, timeLabel, audioKey))
}

function todayStamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** Persist today's planned slots so foreground poll matches OS schedule */
function saveDayPlan(day: string, items: { timeLabel: string; key: string }[]) {
  try {
    localStorage.setItem(AZKAR_NOTIFY_SCHEDULE_KEY, JSON.stringify({ day, items }))
  } catch {
    /* ignore */
  }
}

function loadDayPlan(): { day: string; items: { timeLabel: string; key: string }[] } | null {
  try {
    const raw = localStorage.getItem(AZKAR_NOTIFY_SCHEDULE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function pickSlots(rand: () => number, count: number, startMin: number, endMin: number): number[] {
  const span = Math.max(1, endMin - startMin)
  const raw: number[] = []
  for (let i = 0; i < count * 3 && raw.length < count; i++) {
    const m = startMin + Math.floor(rand() * span)
    if (raw.every((x) => Math.abs(x - m) >= 40)) raw.push(m)
  }
  while (raw.length < count) {
    raw.push(startMin + Math.floor(((raw.length + 1) / (count + 1)) * span))
  }
  return raw.sort((a, b) => a - b)
}

/**
 * Build random azkar reminders for today + tomorrow (stable per calendar day).
 * Window: 07:00 – 22:00 local time.
 */
export function buildAzkarNotifySchedule(settings: AzkarNotifySettings): AzkarScheduleItem[] {
  const pool = AZKAR_NOTIFY_POOL
  if (!pool.length) return []

  const count = settings.timesPerDay
  const startMin = 7 * 60
  const endMin = 22 * 60
  const items: AzkarScheduleItem[] = []
  let id = 0

  for (const dayOffset of [0, 1]) {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() + dayOffset)
    const rand = seededRandom(daySeed(day) * 97 + 13)
    const slots = pickSlots(rand, count, startMin, endMin)

    for (const minutes of slots) {
      const at = new Date(day)
      at.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
      if (dayOffset === 0 && at.getTime() <= Date.now() + 20_000) continue

      const item = pool[Math.floor(rand() * pool.length)]
      items.push({
        id: NOTIF_ID_BASE + id,
        at,
        key: item.key,
        title: item.title,
        body: item.body,
        timeLabel: formatHm(at),
      })
      id += 1
    }
  }

  return items
}

export async function ensureAzkarNotifyPermissions(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.requestPermissions()
    return perm.display === 'granted'
  } catch (err) {
    console.warn('[AzkarNotify] permission error', err)
    return false
  }
}

async function ensureAzkarChannel(mode: AzkarNotifyMode) {
  if (!Capacitor.isNativePlatform()) return AZKAR_NOTIFY_CHANNEL_ID
  const channelId = `${AZKAR_NOTIFY_CHANNEL_ID}_${mode}`
  try {
    await LocalNotifications.createChannel({
      id: channelId,
      name:
        mode === 'silent'
          ? 'تذكير الأذكار (صامت)'
          : mode === 'vibrate'
            ? 'تذكير الأذكار (اهتزاز)'
            : 'تذكير الأذكار',
      description: 'تنبيهات عشوائية خلال اليوم لتذكيرك بالذكر',
      importance: mode === 'silent' ? 2 : 4,
      visibility: 1,
      vibration: mode === 'vibrate',
    })
  } catch (err) {
    console.warn('[AzkarNotify] channel error', err)
  }
  return channelId
}

export async function cancelScheduledAzkarNotifications() {
  try {
    const pending = await LocalNotifications.getPending()
    const ids = pending.notifications
      .filter((n) => n.id >= NOTIF_ID_BASE && n.id <= NOTIF_ID_MAX)
      .map((n) => ({ id: n.id }))
    if (ids.length) await LocalNotifications.cancel({ notifications: ids })
  } catch (err) {
    console.warn('[AzkarNotify] cancel error', err)
  }
}

export async function scheduleAzkarNotifications(settings: AzkarNotifySettings): Promise<void> {
  if (!settings.enabled) {
    await cancelScheduledAzkarNotifications()
    return
  }

  await ensureAzkarNotifyPermissions()
  await cancelScheduledAzkarNotifications()

  const channelId = (await ensureAzkarChannel(settings.mode)) || AZKAR_NOTIFY_CHANNEL_ID
  const schedule = buildAzkarNotifySchedule(settings)
  if (!schedule.length) return

  // Persist today's remaining slots for foreground voice playback
  const today = todayStamp()
  const todayItems = schedule
    .filter((s) => {
      const d = s.at
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` === today
    })
    .map((s) => ({ timeLabel: s.timeLabel, key: s.key }))
  saveDayPlan(today, todayItems)

  try {
    await LocalNotifications.schedule({
      notifications: schedule.map((item) => ({
        id: item.id,
        title: `✦ ${item.title}`,
        body:
          settings.mode === 'silent'
            ? `${item.body} — إيلاف`
            : `${item.body}\nوقت للتذكّر بالله`,
        schedule: {
          at: item.at,
          allowWhileIdle: true,
        },
        channelId,
        smallIcon: 'ic_stat_elaf',
        largeIcon: 'ic_elaf_large',
        iconColor: '#00A7B8',
        actionTypeId: 'AZKAR',
        extra: {
          kind: 'azkar',
          audioKey: item.key,
          title: item.title,
          body: item.body,
          timeLabel: item.timeLabel,
          mode: settings.mode,
        },
      })),
    })
    console.info(`[AzkarNotify] scheduled ${schedule.length} notifications`)
  } catch (err) {
    console.warn('[AzkarNotify] schedule error', err)
  }
}

async function vibrateAzkarPattern() {
  if (vibrateTimer != null) {
    window.clearInterval(vibrateTimer)
    vibrateTimer = null
  }
  const pulse = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium })
      } else if (navigator.vibrate) {
        navigator.vibrate([250, 120, 250])
      }
    } catch {
      /* ignore */
    }
  }
  await pulse()
  vibrateTimer = window.setInterval(() => {
    void pulse()
  }, 1600)
  window.setTimeout(() => {
    if (vibrateTimer != null) {
      window.clearInterval(vibrateTimer)
      vibrateTimer = null
    }
    if (navigator.vibrate) navigator.vibrate(0)
  }, 12000)
}

export async function triggerAzkarNotifyAlert(
  audioKey: string,
  settings: AzkarNotifySettings,
  meta?: { timeLabel?: string; force?: boolean }
) {
  if (!settings.enabled && !meta?.force) return

  const timeLabel = meta?.timeLabel || formatHm(new Date())
  const day = todayStamp()
  if (!meta?.force && hasFired(day, timeLabel, audioKey)) return
  markFired(day, timeLabel, audioKey)

  if (settings.mode === 'silent') return

  if (settings.mode === 'vibrate') {
    await vibrateAzkarPattern()
    return
  }

  await AzkarVoice.play(audioKey, { interrupt: true })
}

export async function setupAzkarNotifyListeners(getSettings: () => AzkarNotifySettings) {
  if (listenersReady) return
  listenersReady = true

  await LocalNotifications.addListener('localNotificationReceived', (notification) => {
    const extra = (notification.extra || {}) as {
      kind?: string
      audioKey?: string
      timeLabel?: string
      mode?: AzkarNotifyMode
    }
    if (extra.kind !== 'azkar') return
    const settings = getSettings()
    const mode = extra.mode || settings.mode
    if (!extra.audioKey) return
    void triggerAzkarNotifyAlert(extra.audioKey, { ...settings, mode }, {
      timeLabel: extra.timeLabel,
    })
  })

  await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const extra = (event.notification.extra || {}) as {
      kind?: string
      audioKey?: string
      timeLabel?: string
      mode?: AzkarNotifyMode
    }
    if (extra.kind !== 'azkar') return
    const settings = getSettings()
    const mode = extra.mode || settings.mode
    if (!extra.audioKey) return
    void triggerAzkarNotifyAlert(extra.audioKey, { ...settings, mode }, {
      timeLabel: extra.timeLabel,
      force: true,
    })
  })
}

/** Foreground fallback: play azkar voice when HH:MM matches a planned slot */
export function checkForegroundAzkarNotify(settings: AzkarNotifySettings) {
  if (!settings.enabled || settings.mode === 'silent') return

  const plan = loadDayPlan()
  const day = todayStamp()
  if (!plan || plan.day !== day) return

  const now = new Date()
  const stamp = formatHm(now)
  for (const item of plan.items) {
    if (item.timeLabel !== stamp) continue
    void triggerAzkarNotifyAlert(item.key, settings, { timeLabel: item.timeLabel })
  }
}

export function peekAzkarNotifyItem(key: string) {
  return getAzkarNotifyItem(key)
}
