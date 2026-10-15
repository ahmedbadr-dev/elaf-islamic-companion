import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import type { PrayerItem } from '../types/simulator'
import {
  ADHAN_CHANNEL_ID,
  ADHAN_FIRED_KEY,
  getAdhanTrack,
  isAdhanPrayer,
  type AdhanMode,
  type AdhanSettings,
} from '../data/adhanAudio'

const NOTIF_ID_BASE = 7100

let audioEl: HTMLAudioElement | null = null
let vibrateTimer: number | null = null
let listenersReady = false

function todayKey(prayerId: string, time: string): string {
  const d = new Date()
  const day = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  return `${day}|${prayerId}|${time}`
}

function readFired(): Set<string> {
  try {
    const raw = localStorage.getItem(ADHAN_FIRED_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function markFired(key: string) {
  const set = readFired()
  set.add(key)
  // Keep last ~40 entries
  const arr = [...set].slice(-40)
  localStorage.setItem(ADHAN_FIRED_KEY, JSON.stringify(arr))
}

export function hasAdhanFired(prayerId: string, time: string): boolean {
  return readFired().has(todayKey(prayerId, time))
}

export function stopAdhanPlayback() {
  if (audioEl) {
    audioEl.pause()
    audioEl.currentTime = 0
    audioEl = null
  }
  if (vibrateTimer != null) {
    window.clearInterval(vibrateTimer)
    vibrateTimer = null
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(0)
  }
}

export async function playAdhanMp3(trackId: string): Promise<void> {
  stopAdhanPlayback()
  const track = getAdhanTrack(trackId)
  const audio = new Audio(track.src)
  audio.preload = 'auto'
  audio.setAttribute('playsinline', 'true')
  audioEl = audio
  try {
    await audio.play()
  } catch (err) {
    console.warn('[Adhan] playback failed', err)
  }
}

async function vibrateAdhanPattern() {
  stopAdhanPlayback()
  const pulse = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy })
      } else if (navigator.vibrate) {
        navigator.vibrate([400, 200, 400, 200, 600])
      }
    } catch {
      /* ignore */
    }
  }
  await pulse()
  vibrateTimer = window.setInterval(() => {
    void pulse()
  }, 1800)
  // Stop pattern after ~45s
  window.setTimeout(() => stopAdhanPlayback(), 45000)
}

export async function triggerAdhanAlert(
  prayer: PrayerItem,
  settings: AdhanSettings,
  opts?: { force?: boolean }
) {
  if (!settings.enabled && !opts?.force) return
  if (!isAdhanPrayer(prayer.id)) return

  const key = todayKey(prayer.id, prayer.time)
  if (!opts?.force && hasAdhanFired(prayer.id, prayer.time)) return
  markFired(key)

  if (settings.mode === 'silent') return

  if (settings.mode === 'vibrate') {
    await vibrateAdhanPattern()
    return
  }

  await playAdhanMp3(settings.trackId)
}

function parsePrayerDate(time: string, dayOffset = 0): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setSeconds(0, 0)
  d.setHours(h || 0, m || 0, 0, 0)
  if (dayOffset) d.setDate(d.getDate() + dayOffset)
  return d
}

/** Build schedule for today + tomorrow (skip past times today) */
export function buildAdhanSchedule(prayers: PrayerItem[]): { prayer: PrayerItem; at: Date; id: number }[] {
  const items: { prayer: PrayerItem; at: Date; id: number }[] = []
  let idx = 0
  for (const dayOffset of [0, 1]) {
    for (const prayer of prayers) {
      if (!isAdhanPrayer(prayer.id)) continue
      const at = parsePrayerDate(prayer.time, dayOffset)
      if (dayOffset === 0 && at.getTime() <= Date.now() + 15_000) continue
      items.push({
        prayer,
        at,
        id: NOTIF_ID_BASE + idx,
      })
      idx += 1
    }
  }
  return items
}

export async function ensureAdhanPermissions(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.requestPermissions()
    return perm.display === 'granted'
  } catch (err) {
    console.warn('[Adhan] permission error', err)
    return false
  }
}

async function ensureAdhanChannel(mode: AdhanMode, rawName: string) {
  if (!Capacitor.isNativePlatform()) return
  const channelId = mode === 'sound' ? `${ADHAN_CHANNEL_ID}_${rawName}` : `${ADHAN_CHANNEL_ID}_${mode}`
  try {
    await LocalNotifications.createChannel({
      id: channelId,
      name:
        mode === 'silent'
          ? 'مواقيت الصلاة (صامت)'
          : mode === 'vibrate'
            ? 'مواقيت الصلاة (اهتزاز)'
            : 'أذان الصلاة',
      description:
        mode === 'silent'
          ? 'تنبيه صامت بدون صوت أو اهتزاز عند دخول وقت الصلاة'
          : 'تنبيهات مواقيت الصلاة والأذان',
      // silent = low importance, no heads-up sound
      importance: mode === 'silent' ? 2 : 5,
      visibility: 1,
      sound: mode === 'sound' ? rawName : undefined,
      vibration: mode === 'vibrate',
    })
  } catch (err) {
    console.warn('[Adhan] channel error', err)
  }
  return channelId
}

export async function cancelScheduledAdhans() {
  try {
    const pending = await LocalNotifications.getPending()
    const ids = pending.notifications
      .filter((n) => n.id >= NOTIF_ID_BASE && n.id < NOTIF_ID_BASE + 50)
      .map((n) => ({ id: n.id }))
    if (ids.length) await LocalNotifications.cancel({ notifications: ids })
  } catch (err) {
    console.warn('[Adhan] cancel error', err)
  }
}

/**
 * Schedule OS local notifications so adhan can fire when the app is closed.
 * Custom MP3 must live in android/app/src/main/res/raw/{rawName}.mp3
 */
export async function scheduleAdhanNotifications(
  prayers: PrayerItem[],
  settings: AdhanSettings
): Promise<void> {
  if (!settings.enabled) {
    await cancelScheduledAdhans()
    return
  }

  const granted = await ensureAdhanPermissions()
  if (!granted && Capacitor.isNativePlatform()) {
    console.warn('[Adhan] notifications not granted')
  }

  await cancelScheduledAdhans()

  const track = getAdhanTrack(settings.trackId)
  const channelId =
    (await ensureAdhanChannel(settings.mode, track.rawName)) || ADHAN_CHANNEL_ID
  const schedule = buildAdhanSchedule(prayers)

  if (!schedule.length) return

  try {
    await LocalNotifications.schedule({
      notifications: schedule.map(({ prayer, at, id }) => ({
        id,
        title: `حان وقت صلاة ${prayer.name}`,
        body:
          settings.mode === 'silent'
            ? `${prayer.time} — إيلاف`
            : `الله أكبر — ${track.nameAr}`,
        schedule: {
          at,
          allowWhileIdle: true,
        },
        channelId,
        sound: settings.mode === 'sound' ? track.rawName : undefined,
        smallIcon: 'ic_stat_elaf',
        largeIcon: 'ic_elaf_large',
        iconColor: '#00A7B8',
        actionTypeId: 'ADHAN',
        extra: {
          prayerId: prayer.id,
          prayerName: prayer.name,
          time: prayer.time,
          trackId: settings.trackId,
          mode: settings.mode,
        },
      })),
    })
    console.info(`[Adhan] scheduled ${schedule.length} notifications`)
  } catch (err) {
    console.warn('[Adhan] schedule error', err)
  }
}

export async function setupAdhanNotificationListeners(
  getSettings: () => AdhanSettings,
  onFired?: (prayerName: string) => void
) {
  if (listenersReady) return
  listenersReady = true

  await LocalNotifications.addListener('localNotificationReceived', (notification) => {
    const extra = (notification.extra || {}) as {
      kind?: string
      prayerId?: string
      prayerName?: string
      time?: string
      trackId?: string
      mode?: AdhanMode
    }
    // Azkar reminders are handled by AzkarNotifyService
    if (
      extra.kind === 'azkar' ||
      extra.kind === 'prayer_widget' ||
      extra.kind === 'evening_azkar' ||
      extra.kind === 'morning_azkar' ||
      notification.actionTypeId === 'AZKAR' ||
      notification.actionTypeId === 'EVENING_AZKAR' ||
      notification.actionTypeId === 'MORNING_AZKAR'
    )
      return
    const settings = getSettings()
    const mode = extra.mode || settings.mode
    const prayer: PrayerItem = {
      id: extra.prayerId || 'dhuhr',
      name: extra.prayerName || notification.title || 'الصلاة',
      time: extra.time || '',
      icon: extra.prayerId || 'dhuhr',
    }
    // Silent prayer time: show notification only — no sound / vibrate / MP3
    if (mode === 'silent') {
      onFired?.(prayer.name)
      return
    }
    void triggerAdhanAlert(prayer, {
      ...settings,
      mode,
      trackId: extra.trackId || settings.trackId,
    })
    onFired?.(prayer.name)
  })

  await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const extra = (event.notification.extra || {}) as {
      kind?: string
      prayerId?: string
      prayerName?: string
      time?: string
      trackId?: string
      mode?: AdhanMode
    }
    if (
      extra.kind === 'azkar' ||
      extra.kind === 'prayer_widget' ||
      extra.kind === 'evening_azkar' ||
      extra.kind === 'morning_azkar' ||
      event.notification.actionTypeId === 'AZKAR' ||
      event.notification.actionTypeId === 'EVENING_AZKAR' ||
      event.notification.actionTypeId === 'MORNING_AZKAR'
    )
      return
    const settings = getSettings()
    const mode = extra.mode || settings.mode
    if (mode === 'sound') {
      void playAdhanMp3(extra.trackId || settings.trackId)
    } else if (mode === 'vibrate') {
      void vibrateAdhanPattern()
    }
    // silent: open app only, no alert
    onFired?.(extra.prayerName || 'الصلاة')
  })
}

/**
 * Foreground fallback: poll every few seconds and fire when HH:MM matches.
 * Works in browser preview and when the WebView is still running.
 */
export function checkForegroundAdhan(prayers: PrayerItem[], settings: AdhanSettings) {
  if (!settings.enabled || settings.mode === 'silent') return

  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const stamp = `${hh}:${mm}`

  for (const prayer of prayers) {
    if (!isAdhanPrayer(prayer.id)) continue
    if (prayer.time !== stamp) continue
    void triggerAdhanAlert(prayer, settings)
  }
}
