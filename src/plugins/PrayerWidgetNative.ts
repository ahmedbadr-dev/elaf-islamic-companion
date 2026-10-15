import { registerPlugin } from '@capacitor/core'

export interface PrayerWidgetNativePlugin {
  show(options: {
    title: string
    /** Prayer clock time e.g. 12:50 */
    prayerTime: string
    /** Formatted countdown e.g. 4:29:10 */
    countdown: string
    /** Seconds remaining — preferred (reliable on Capacitor bridge) */
    remainingSec: number
    /** Epoch ms of next prayer (fallback) */
    targetAt: number
    /** Epoch ms as string (fallback for large numbers) */
    targetAtStr?: string
    /** Hijri date shown beside إيلاف */
    hijriDate?: string
  }): Promise<{ ok?: boolean; reason?: string; leftSec?: number } | void>
  hide(): Promise<void>
}

export const PrayerWidgetNative = registerPlugin<PrayerWidgetNativePlugin>('PrayerWidgetNative', {
  web: {
    async show() {
      return { ok: false, reason: 'web' }
    },
    async hide() {},
  },
})
