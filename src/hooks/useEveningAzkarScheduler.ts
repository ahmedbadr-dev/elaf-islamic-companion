import { useEffect, useRef } from 'react'
import type { PrayerItem } from '../types/simulator'
import {
  checkForegroundEveningAzkar,
  scheduleEveningAzkarNotifications,
  setupEveningAzkarListeners,
} from '../services/EveningAzkarService'

export function useEveningAzkarScheduler(prayers: PrayerItem[]) {
  const prayersRef = useRef(prayers)
  prayersRef.current = prayers

  useEffect(() => {
    void setupEveningAzkarListeners()
  }, [])

  useEffect(() => {
    if (!prayers?.length) return
    void scheduleEveningAzkarNotifications(prayers)
  }, [prayers])

  useEffect(() => {
    const id = window.setInterval(() => {
      checkForegroundEveningAzkar(prayersRef.current)
    }, 4000)
    return () => window.clearInterval(id)
  }, [prayers])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && prayersRef.current.length) {
        void scheduleEveningAzkarNotifications(prayersRef.current)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    let handle: { remove: () => void } | undefined
    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && prayersRef.current.length) {
          void scheduleEveningAzkarNotifications(prayersRef.current)
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
}
