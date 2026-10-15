import { Capacitor } from '@capacitor/core'
import type { PrayerItem } from '../types/simulator'
import {
  formatCountdown,
  formatWidgetTitle,
  getNextPrayerTarget,
  type PrayerWidgetSettings,
} from '../data/prayerWidget'
import { getWidgetHijriDate } from '../utils/islamicDate'
import { PrayerWidgetNative } from '../plugins/PrayerWidgetNative'

let lastPayload = ''
let postedOnce = false
let refreshInFlight: Promise<PrayerWidgetResult> | null = null

export interface PrayerWidgetResult {
  ok: boolean
  reason?: string
}

export async function ensurePrayerWidgetPermissions(forceAsk = false): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const current = await LocalNotifications.checkPermissions()
    if (current.display === 'granted') return true
    if (!forceAsk && current.display === 'denied') return false
    const perm = await LocalNotifications.requestPermissions()
    return perm.display === 'granted'
  } catch (err) {
    console.warn('[PrayerWidget] permission error', err)
    return false
  }
}

export async function hidePrayerWidget() {
  lastPayload = ''
  postedOnce = false
  if (!Capacitor.isNativePlatform()) return
  try {
    await PrayerWidgetNative.hide()
  } catch (err) {
    console.warn('[PrayerWidget] hide error', err)
  }
}

/**
 * Post / refresh the persistent prayer widget via native custom notification.
 * Native Handler ticks the countdown every 1s (bold green).
 */
export async function refreshPrayerWidget(
  prayers: PrayerItem[],
  settings: PrayerWidgetSettings,
  now = new Date(),
  opts?: { force?: boolean }
): Promise<PrayerWidgetResult> {
  if (refreshInFlight && !opts?.force) return refreshInFlight

  const run = async (): Promise<PrayerWidgetResult> => {
    try {
      if (!settings.enabled) {
        await hidePrayerWidget()
        return { ok: false, reason: 'disabled' }
      }
      if (!Capacitor.isNativePlatform()) return { ok: false, reason: 'not_native' }
      if (!prayers?.length) return { ok: false, reason: 'no_prayers' }

      const next = getNextPrayerTarget(prayers, now)
      if (!next) {
        await hidePrayerWidget()
        return { ok: false, reason: 'no_next_prayer' }
      }

      const ok = await ensurePrayerWidgetPermissions(Boolean(opts?.force))
      if (!ok) {
        postedOnce = false
        return { ok: false, reason: 'permission_denied' }
      }

      const totalSec = Math.max(0, Math.floor((next.at.getTime() - now.getTime()) / 1000))
      const countdown = formatCountdown(totalSec)
      const title = formatWidgetTitle(next.prayer.name)
      const prayerTime = next.prayer.time
      const targetAt = next.at.getTime()
      const hijriDate = getWidgetHijriDate(now)

      // Re-bind when prayer / remaining window / hijri day changes
      const payload = `${title}|${prayerTime}|${hijriDate}|${Math.floor(targetAt / 60000)}`
      if (!opts?.force && payload === lastPayload && postedOnce) return { ok: true, reason: 'unchanged' }

      const result = await PrayerWidgetNative.show({
        title,
        prayerTime,
        countdown,
        remainingSec: totalSec,
        targetAt,
        targetAtStr: String(targetAt),
        hijriDate,
      })

      const nativeOk = result == null || result.ok !== false
      if (!nativeOk) {
        postedOnce = false
        return { ok: false, reason: result?.reason || 'notify_failed' }
      }

      lastPayload = payload
      postedOnce = true
      return { ok: true }
    } catch (err) {
      console.warn('[PrayerWidget] refresh error', err)
      postedOnce = false
      return { ok: false, reason: 'exception' }
    }
  }

  if (opts?.force) {
    return run()
  }

  refreshInFlight = run().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}
