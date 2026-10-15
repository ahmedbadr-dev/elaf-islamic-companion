import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_AZKAR_NOTIFY_SETTINGS,
  loadAzkarNotifySettings,
  saveAzkarNotifySettings,
  type AzkarNotifyMode,
  type AzkarNotifySettings,
} from '../data/azkarNotify'
import {
  checkForegroundAzkarNotify,
  ensureAzkarNotifyPermissions,
  scheduleAzkarNotifications,
  setupAzkarNotifyListeners,
  triggerAzkarNotifyAlert,
} from '../services/AzkarNotifyService'
import { AzkarVoice } from '../services/AzkarVoiceService'

export function useAzkarNotifyScheduler() {
  const [settings, setSettingsState] = useState<AzkarNotifySettings>(() => loadAzkarNotifySettings())
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const setSettings = useCallback((patch: Partial<AzkarNotifySettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch }
      saveAzkarNotifySettings(next)
      return next
    })
  }, [])

  const setMode = useCallback(
    (mode: AzkarNotifyMode) => setSettings({ mode }),
    [setSettings]
  )

  const setEnabled = useCallback(
    (enabled: boolean) => setSettings({ enabled }),
    [setSettings]
  )

  const setTimesPerDay = useCallback(
    (timesPerDay: number) => setSettings({ timesPerDay }),
    [setSettings]
  )

  useEffect(() => {
    void ensureAzkarNotifyPermissions()
    void setupAzkarNotifyListeners(() => settingsRef.current)
    return () => AzkarVoice.stop()
  }, [])

  useEffect(() => {
    void scheduleAzkarNotifications(settings)
  }, [settings])

  useEffect(() => {
    const id = window.setInterval(() => {
      checkForegroundAzkarNotify(settingsRef.current)
    }, 4000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void scheduleAzkarNotifications(settingsRef.current)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    let handle: { remove: () => void } | undefined
    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) void scheduleAzkarNotifications(settingsRef.current)
      }).then((h) => {
        handle = h
      })
    })

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      handle?.remove()
    }
  }, [])

  const preview = useCallback(async () => {
    await triggerAzkarNotifyAlert('morning-1', settingsRef.current, { force: true })
  }, [])

  return {
    settings,
    setSettings,
    setMode,
    setEnabled,
    setTimesPerDay,
    preview,
    stop: () => AzkarVoice.stop(),
    resetSettings: () => {
      saveAzkarNotifySettings(DEFAULT_AZKAR_NOTIFY_SETTINGS)
      setSettingsState({ ...DEFAULT_AZKAR_NOTIFY_SETTINGS })
    },
  }
}
