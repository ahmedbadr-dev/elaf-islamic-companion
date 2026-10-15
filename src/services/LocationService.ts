/**
 * Location service — Capacitor Geolocation with web fallback.
 * Requests "when in use" / recent location permission, then returns coords.
 */

import { Capacitor } from '@capacitor/core'

export interface GeoCoords {
  latitude: number
  longitude: number
  accuracy?: number
}

export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unavailable'

function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`))
    }, ms)
    promise.then(
      (v) => {
        window.clearTimeout(t)
        resolve(v)
      },
      (e) => {
        window.clearTimeout(t)
        reject(e)
      }
    )
  })
}

class LocationServiceImpl {
  async checkPermission(): Promise<LocationPermissionStatus> {
    try {
      if (isNative()) {
        const { Geolocation } = await import('@capacitor/geolocation')
        const status = await Geolocation.checkPermissions()
        return this.mapCapPermission(status.location)
      }

      if (!('geolocation' in navigator)) return 'unavailable'
      if (!navigator.permissions?.query) return 'prompt'

      const result = await navigator.permissions.query({ name: 'geolocation' })
      if (result.state === 'granted') return 'granted'
      if (result.state === 'denied') return 'denied'
      return 'prompt'
    } catch {
      return 'unavailable'
    }
  }

  /**
   * Request location permission (Capacitor prompt / browser prompt).
   * Note: On Android this THROWS if device location services are disabled.
   */
  async requestPermission(): Promise<LocationPermissionStatus> {
    if (isNative()) {
      const { Geolocation } = await import('@capacitor/geolocation')
      const status = await withTimeout(
        Geolocation.requestPermissions(),
        25_000,
        'requestPermissions'
      )
      return this.mapCapPermission(status.location)
    }
    return 'prompt'
  }

  /**
   * Request permission if needed, then return current / recent position.
   */
  async getCurrentPosition(options?: {
    enableHighAccuracy?: boolean
    timeout?: number
    maximumAge?: number
  }): Promise<GeoCoords> {
    const enableHighAccuracy = options?.enableHighAccuracy ?? true
    const timeout = options?.timeout ?? 15000
    const maximumAge = options?.maximumAge ?? 120_000

    if (isNative()) {
      const { Geolocation } = await import('@capacitor/geolocation')

      let permission = await this.checkPermission()
      if (permission !== 'granted') {
        try {
          permission = await this.requestPermission()
        } catch (err) {
          // Location services off → surface as clear error for caller to open settings
          throw new Error(
            `LOCATION_SERVICES_OFF:${err instanceof Error ? err.message : String(err)}`
          )
        }
      }
      if (permission === 'denied') {
        throw new Error('LOCATION_PERMISSION_DENIED')
      }
      if (permission !== 'granted') {
        throw new Error('LOCATION_PERMISSION_DENIED')
      }

      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy,
          timeout,
          maximumAge,
        })
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (/GLOC-0007|GLOC-0009|GLOC-0016|GLOC-0017|not enabled|Location services/i.test(msg)) {
          throw new Error(`LOCATION_SERVICES_OFF:${msg}`)
        }
        if (/GLOC-0003|denied|permission/i.test(msg)) {
          throw new Error('LOCATION_PERMISSION_DENIED')
        }
        throw err instanceof Error ? err : new Error(msg)
      }
    }

    if (!('geolocation' in navigator)) {
      throw new Error('المتصفح لا يدعم تحديد الموقع.')
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          })
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error('LOCATION_PERMISSION_DENIED'))
          } else if (err.code === err.TIMEOUT) {
            reject(new Error('انتهت مهلة تحديد الموقع. حاول مرة أخرى.'))
          } else {
            reject(new Error('تعذر الحصول على الموقع حالياً.'))
          }
        },
        { enableHighAccuracy, timeout, maximumAge }
      )
    })
  }

  /**
   * Show Google Play in-app "Turn on Location Accuracy" dialog (Android).
   * Returns true if location services are / were enabled.
   */
  async promptLocationAccuracy(): Promise<boolean> {
    if (!isNative() || Capacitor.getPlatform() !== 'android') {
      return true
    }
    try {
      const { LocationAccuracy } = await import('../plugins/LocationAccuracy')
      const { enabled } = await LocationAccuracy.promptEnable()
      return enabled
    } catch (err) {
      console.warn('[Location] promptLocationAccuracy failed', err)
      return false
    }
  }

  /**
   * Full connect flow: in-app location dialog → permission → position.
   * Does not leave the app for the system Location settings page.
   * Returns true when a position was obtained.
   */
  async connectLocation(): Promise<boolean> {
    try {
      // Turn on device location / accuracy via Play Services popup (stays in-app)
      const servicesOn = await this.promptLocationAccuracy()
      if (!servicesOn) {
        return false
      }

      await this.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Only app permission needs Application Details; never jump to Location settings
      if (msg.startsWith('LOCATION_PERMISSION_DENIED') || /denied/i.test(msg)) {
        await this.openSettings('app')
      } else if (msg.startsWith('LOCATION_SERVICES_OFF')) {
        // Retry Play Services dialog once more if GPS still off
        const servicesOn = await this.promptLocationAccuracy()
        if (servicesOn) {
          try {
            await this.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 12_000,
              maximumAge: 0,
            })
            return true
          } catch {
            /* fall through */
          }
        }
      }
      return false
    }
  }

  async reverseGeocode(coords: GeoCoords): Promise<string> {
    try {
      const url =
        `https://api.bigdatacloud.net/data/reverse-geocode-client` +
        `?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=ar`
      const res = await fetch(url)
      if (!res.ok) throw new Error('geocode failed')
      const data = await res.json()
      const city =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        data.countryName
      const country = data.countryName
      if (city && country && city !== country) return `${city}، ${country}`
      if (city) return String(city)
      if (country) return String(country)
      return `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`
    } catch {
      return `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`
    }
  }

  qiblaBearing(coords: GeoCoords): number {
    const kaabaLat = 21.4225
    const kaabaLng = 39.8262
    const φ1 = (coords.latitude * Math.PI) / 180
    const φ2 = (kaabaLat * Math.PI) / 180
    const Δλ = ((kaabaLng - coords.longitude) * Math.PI) / 180
    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

  /**
   * Open system screens so the user can enable location / app permission.
   */
  async openSettings(target: 'location' | 'app' = 'location'): Promise<void> {
    try {
      if (isNative()) {
        try {
          const { NativeSettings, AndroidSettings, IOSSettings } = await import(
            'capacitor-native-settings'
          )
          await NativeSettings.open({
            optionAndroid:
              target === 'app'
                ? AndroidSettings.ApplicationDetails
                : AndroidSettings.Location,
            optionIOS: IOSSettings.App,
          })
          return
        } catch (pluginErr) {
          console.warn('[Location] native-settings failed, trying App.openUrl', pluginErr)
        }

        const { App } = await import('@capacitor/app')
        const platform = Capacitor.getPlatform()
        if (platform === 'android') {
          // Fallback intents
          const url =
            target === 'app'
              ? `intent://settings/#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${'com.elaf.islamiccompanion'};end`
              : 'intent://settings/#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end'
          await App.openUrl({ url })
          return
        }
        if (platform === 'ios') {
          await App.openUrl({ url: 'app-settings:' })
          return
        }
      }
      window.alert('فعّل إذن الموقع من إعدادات المتصفح أو الجهاز.')
    } catch (err) {
      console.warn('[Location] openSettings failed', err)
      window.alert('افتح إعدادات الجهاز وفعّل الموقع لهذا التطبيق.')
    }
  }

  private mapCapPermission(
    value: string | undefined
  ): LocationPermissionStatus {
    if (value === 'granted' || value === 'limited') return 'granted'
    if (value === 'denied') return 'denied'
    if (value === 'prompt' || value === 'prompt-with-rationale') return 'prompt'
    return 'unavailable'
  }
}

export const LocationService = new LocationServiceImpl()
