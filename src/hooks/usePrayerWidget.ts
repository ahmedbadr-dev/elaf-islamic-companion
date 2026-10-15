import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PrayerItem } from '../types/simulator'
import {
  DEFAULT_PRAYER_WIDGET_SETTINGS,
  loadPrayerWidgetSettings,
  savePrayerWidgetSettings,
  type PrayerWidgetSettings,
} from '../data/prayerWidget'
import {
  ensurePrayerWidgetPermissions,
  hidePrayerWidget,
  refreshPrayerWidget,
} from '../services/PrayerWidgetService'

/** Stable key so array identity churn doesn't restart the ticker */
function prayersKey(prayers: PrayerItem[]): string {
  return prayers.map((p) => `${p.id}:${p.time}`).join('|')
}

export function usePrayerWidget(prayers: PrayerItem[]) {
  const [settings, setSettingsState] = useState<PrayerWidgetSettings>(() => loadPrayerWidgetSettings())
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const prayersRef = useRef(prayers)
  prayersRef.current = prayers

  const timesKey = useMemo(() => prayersKey(prayers), [prayers])

  const setSettings = useCallback((patch: Partial<PrayerWidgetSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch }
      savePrayerWidgetSettings(next)
      return next
    })
  }, [])

  const setEnabled = useCallback((enabled: boolean) => {
    setSettings({ enabled })
    if (enabled) {
      // Ask permission + force re-post when user turns widget on
      void (async () => {
        await ensurePrayerWidgetPermissions(true)
        await refreshPrayerWidget(prayersRef.current, { ...settingsRef.current, enabled: true }, new Date(), {
          force: true,
        })
      })()
    } else {
      void hidePrayerWidget()
    }
  }, [setSettings])

  useEffect(() => {
    if (!settings.enabled) return
    void ensurePrayerWidgetPermissions()
  }, [settings.enabled])

  // Keep native ticker bound when prayers change; countdown ticks natively every 1s
  useEffect(() => {
    if (!settings.enabled) {
      void hidePrayerWidget()
      return
    }

    let cancelled = false
    const tick = () => {
      if (cancelled) return
      void refreshPrayerWidget(prayersRef.current, settingsRef.current)
    }
    tick()
    // Re-sync target every minute (native Handler updates seconds live)
    const id = window.setInterval(tick, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [settings.enabled, timesKey])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && settingsRef.current.enabled) {
        void refreshPrayerWidget(prayersRef.current, settingsRef.current, new Date(), { force: true })
      }
    }
    document.addEventListener('visibilitychange', onVis)

    let handle: { remove: () => void } | undefined
    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && settingsRef.current.enabled) {
          void refreshPrayerWidget(prayersRef.current, settingsRef.current, new Date(), { force: true })
        }
      }).then((h) => {
        handle = h
      })
    })

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      handle?.remove()
    }
  }, [])

  return {
    settings,
    setEnabled,
    setSettings,
    refresh: () => refreshPrayerWidget(prayersRef.current, settingsRef.current, new Date(), { force: true }),
    hide: hidePrayerWidget,
    resetSettings: () => {
      savePrayerWidgetSettings(DEFAULT_PRAYER_WIDGET_SETTINGS)
      setSettingsState({ ...DEFAULT_PRAYER_WIDGET_SETTINGS })
    },
  }
}
