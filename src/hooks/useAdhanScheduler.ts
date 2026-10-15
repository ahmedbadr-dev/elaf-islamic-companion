import { useCallback, useEffect, useRef, useState } from 'react'
import type { PrayerItem } from '../types/simulator'
import {
  DEFAULT_ADHAN_SETTINGS,
  loadAdhanSettings,
  saveAdhanSettings,
  type AdhanSettings,
  type AdhanMode,
} from '../data/adhanAudio'
import {
  checkForegroundAdhan,
  ensureAdhanPermissions,
  scheduleAdhanNotifications,
  setupAdhanNotificationListeners,
  stopAdhanPlayback,
  playAdhanMp3,
  triggerAdhanAlert,
} from '../services/AdhanService'

export function useAdhanScheduler(prayers: PrayerItem[]) {
  const [settings, setSettingsState] = useState<AdhanSettings>(() => loadAdhanSettings())
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const setSettings = useCallback((patch: Partial<AdhanSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch }
      saveAdhanSettings(next)
      return next
    })
  }, [])

  const setMode = useCallback(
    (mode: AdhanMode) => {
      // Stop any playing adhan / vibrate pattern immediately
      stopAdhanPlayback()
      setSettings({ mode })
      // Light haptic so the mode change feels applied on device
      if (mode === 'vibrate' || mode === 'silent') {
        void import('@capacitor/haptics')
          .then(({ Haptics, ImpactStyle }) =>
            Haptics.impact({ style: mode === 'silent' ? ImpactStyle.Light : ImpactStyle.Medium })
          )
          .catch(() => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate(mode === 'silent' ? 30 : [40, 40, 40])
            }
          })
      }
    },
    [setSettings]
  )

  const setTrackId = useCallback(
    (trackId: string) => setSettings({ trackId }),
    [setSettings]
  )

  // Permissions + OS notification listeners (background / closed app)
  useEffect(() => {
    void ensureAdhanPermissions()
    void setupAdhanNotificationListeners(() => settingsRef.current)
    return () => stopAdhanPlayback()
  }, [])

  // Reschedule whenever prayers or settings change
  useEffect(() => {
    if (!prayers?.length) return
    void scheduleAdhanNotifications(prayers, settings)
  }, [prayers, settings])

  // Foreground / preview fallback timer
  useEffect(() => {
    const id = window.setInterval(() => {
      checkForegroundAdhan(prayers, settingsRef.current)
    }, 4000)
    return () => window.clearInterval(id)
  }, [prayers])

  // Reschedule when tab becomes visible again (times may have refreshed)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && prayers?.length) {
        void scheduleAdhanNotifications(prayers, settingsRef.current)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    let handle: { remove: () => void } | undefined
    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && prayers?.length) {
          void scheduleAdhanNotifications(prayers, settingsRef.current)
        }
      }).then((h) => {
        handle = h
      })
    })

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      handle?.remove()
    }
  }, [prayers])

  const previewAdhan = useCallback(async () => {
    const s = settingsRef.current
    await triggerAdhanAlert(
      { id: 'dhuhr', name: 'تجربة الأذان', time: '00:00', icon: 'dhuhr' },
      s,
      { force: true }
    )
  }, [])

  const previewTrack = useCallback(async (trackId: string) => {
    await playAdhanMp3(trackId)
  }, [])

  return {
    settings,
    setMode,
    setTrackId,
    setSettings,
    previewAdhan,
    previewTrack,
    stopAdhan: stopAdhanPlayback,
    resetSettings: () => {
      saveAdhanSettings(DEFAULT_ADHAN_SETTINGS)
      setSettingsState({ ...DEFAULT_ADHAN_SETTINGS })
    },
  }
}
