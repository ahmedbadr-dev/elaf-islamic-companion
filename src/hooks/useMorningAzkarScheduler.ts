import { useEffect, useRef } from 'react'
import type { PrayerItem } from '../types/simulator'
import {
  checkForegroundMorningAzkar,
  scheduleMorningAzkarNotifications,
  setupMorningAzkarListeners,
} from '../services/MorningAzkarService'

export function useMorningAzkarScheduler(prayers: PrayerItem[]) {
  const prayersRef = useRef(prayers)
  prayersRef.current = prayers

  useEffect(() => {
    void setupMorningAzkarListeners()
  }, [])

  useEffect(() => {
    if (!prayers?.length) return
    void scheduleMorningAzkarNotifications(prayers)
  }, [prayers])

  useEffect(() => {
    const id = window.setInterval(() => {
      checkForegroundMorningAzkar(prayersRef.current)
    }, 4000)
    return () => window.clearInterval(id)
  }, [prayers])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && prayersRef.current.length) {
        void scheduleMorningAzkarNotifications(prayersRef.current)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    let handle: { remove: () => void } | undefined
    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && prayersRef.current.length) {
          void scheduleMorningAzkarNotifications(prayersRef.current)
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
