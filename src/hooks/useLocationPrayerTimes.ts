import { useCallback, useEffect, useRef, useState } from 'react'
import { LocationService, type GeoCoords, type LocationPermissionStatus } from '../services/LocationService'
import {
  fetchPrayerTimesByCity,
  fetchPrayerTimesByCoords,
  getNextPrayerIndex,
  parseCityCountryLabel,
} from '../services/PrayerTimesService'
import type { PrayerItem } from '../types/simulator'

const STORAGE_KEY = 'elaf-location-prayer'

export interface LocationPrayerState {
  permission: LocationPermissionStatus
  loading: boolean
  error: string | null
  coords: GeoCoords | null
  cityLabel: string | null
  prayers: PrayerItem[] | null
  qiblaBearing: number | null
  nextIndex: number
  lastUpdated: number | null
}

type CachePayload = {
  coords: GeoCoords
  cityLabel: string
  prayers: PrayerItem[]
  qiblaBearing: number
  lastUpdated: number
  dateKey: string
}

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function loadCache(): CachePayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CachePayload>
    if (!parsed?.prayers?.length || !parsed.coords) return null
    // Drop yesterday's times so home never shows stale salah clocks
    if (parsed.dateKey && parsed.dateKey !== todayKey()) return null
    return {
      coords: parsed.coords,
      cityLabel: parsed.cityLabel || '',
      prayers: parsed.prayers,
      qiblaBearing: parsed.qiblaBearing ?? 0,
      lastUpdated: parsed.lastUpdated ?? Date.now(),
      dateKey: parsed.dateKey || todayKey(),
    }
  } catch {
    return null
  }
}

function saveCache(data: {
  coords: GeoCoords
  cityLabel: string
  prayers: PrayerItem[]
  qiblaBearing: number
}) {
  try {
    const payload: CachePayload = {
      ...data,
      lastUpdated: Date.now(),
      dateKey: todayKey(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export function useLocationPrayerTimes(methodName: string) {
  const cache = loadCache()
  const [permission, setPermission] = useState<LocationPermissionStatus>('prompt')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<GeoCoords | null>(cache?.coords ?? null)
  const [cityLabel, setCityLabel] = useState<string | null>(cache?.cityLabel ?? null)
  const [prayers, setPrayers] = useState<PrayerItem[] | null>(cache?.prayers ?? null)
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(
    cache?.qiblaBearing ?? null
  )
  const [lastUpdated, setLastUpdated] = useState<number | null>(
    cache?.lastUpdated ?? null
  )
  const methodRef = useRef(methodName)
  methodRef.current = methodName
  const mountedRef = useRef(true)
  const cityLabelRef = useRef(cityLabel)
  cityLabelRef.current = cityLabel

  const nextIndex = prayers ? getNextPrayerIndex(prayers) : 0

  useEffect(() => {
    mountedRef.current = true
    LocationService.checkPermission().then((p) => {
      if (mountedRef.current) setPermission(p)
    })
    return () => {
      mountedRef.current = false
    }
  }, [])

  const applyTimes = useCallback(
    (nextPrayers: PrayerItem[], position: GeoCoords, place: string, bearing: number) => {
      setPrayers(nextPrayers)
      setCityLabel(place)
      setCoords(position)
      setQiblaBearing(bearing)
      setLastUpdated(Date.now())
      saveCache({
        coords: position,
        cityLabel: place,
        prayers: nextPrayers,
        qiblaBearing: bearing,
      })
    },
    []
  )

  const refresh = useCallback(async (opts?: { forcePermission?: boolean; forceFresh?: boolean }) => {
    if (!mountedRef.current) return
    setLoading(true)
    setError(null)
    const forceFresh = opts?.forceFresh !== false

    try {
      if (opts?.forcePermission) {
        try {
          const p = await LocationService.requestPermission()
          if (mountedRef.current) setPermission(p)
        } catch {
          if (mountedRef.current) setPermission('prompt')
        }
      }

      const position = await LocationService.getCurrentPosition({
        enableHighAccuracy: true,
        maximumAge: forceFresh ? 0 : 120_000,
        timeout: 20_000,
      })
      if (!mountedRef.current) return

      setCoords(position)
      setPermission('granted')

      const bearing = LocationService.qiblaBearing(position)
      setQiblaBearing(bearing)

      const placePromise = LocationService.reverseGeocode(position)

      let times
      try {
        times = await fetchPrayerTimesByCoords({
          latitude: position.latitude,
          longitude: position.longitude,
          methodName: methodRef.current,
        })
      } catch (coordErr) {
        // Fallback: Aladhan timingsByCity (The-Prayer-Project style)
        const placeHint = await placePromise
        const parsed = parseCityCountryLabel(placeHint || cityLabelRef.current)
        if (!parsed) throw coordErr
        times = await fetchPrayerTimesByCity({
          city: parsed.city,
          country: parsed.country,
          methodName: methodRef.current,
        })
      }

      const place = await placePromise
      if (!mountedRef.current) return

      applyTimes(times.prayers, position, place, bearing)
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.message || 'تعذر تحديث الموقع والمواقيت')
        const p = await LocationService.checkPermission()
        setPermission(p)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [applyTimes])

  // Re-fetch times when calculation method changes (keep same coords)
  useEffect(() => {
    if (!coords) return
    let cancelled = false
    ;(async () => {
      try {
        const times = await fetchPrayerTimesByCoords({
          latitude: coords.latitude,
          longitude: coords.longitude,
          methodName,
        })
        if (cancelled) return
        setPrayers(times.prayers)
        if (cityLabel && coords) {
          saveCache({
            coords,
            cityLabel,
            prayers: times.prayers,
            qiblaBearing: qiblaBearing ?? LocationService.qiblaBearing(coords),
          })
          setLastUpdated(Date.now())
        }
      } catch {
        /* keep previous times */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [methodName]) // eslint-disable-line react-hooks/exhaustive-deps

  // Midnight / day rollover — refresh times for the new date
  useEffect(() => {
    const tick = () => {
      if (!coords) return
      const cached = loadCache()
      if (cached && cached.dateKey === todayKey()) return
      void refresh({ forceFresh: false })
    }
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [coords, refresh])

  return {
    permission,
    loading,
    error,
    coords,
    cityLabel,
    prayers,
    qiblaBearing,
    nextIndex,
    lastUpdated,
    refresh,
    clearError: () => setError(null),
  } satisfies LocationPrayerState & {
    refresh: (opts?: { forcePermission?: boolean; forceFresh?: boolean }) => Promise<void>
    clearError: () => void
  }
}
