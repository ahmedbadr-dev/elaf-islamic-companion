import { useEffect, useState } from 'react'

export type HeadingState = {
  heading: number | null
  supported: boolean
  permission: 'unknown' | 'granted' | 'denied' | 'prompt'
  error: string | null
}

/**
 * Device compass heading in degrees (0 = true/magnetic north, clockwise).
 * Prefers absolute orientation when available.
 */
export function useDeviceHeading(enabled = true) {
  const [state, setState] = useState<HeadingState>({
    heading: null,
    supported: typeof window !== 'undefined',
    permission: 'unknown',
    error: null,
  })

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let active = true
    let usingAbsolute = false

    const apply = (heading: number) => {
      if (!active) return
      const h = ((heading % 360) + 360) % 360
      setState((prev) => ({
        ...prev,
        heading: h,
        permission: 'granted',
        error: null,
        supported: true,
      }))
    }

    const onAbs = (e: DeviceOrientationEvent) => {
      const abs = e as DeviceOrientationEvent & { absolute?: boolean; webkitCompassHeading?: number }
      if (typeof abs.webkitCompassHeading === 'number' && !Number.isNaN(abs.webkitCompassHeading)) {
        usingAbsolute = true
        apply(abs.webkitCompassHeading)
        return
      }
      if (abs.absolute && typeof abs.alpha === 'number' && !Number.isNaN(abs.alpha)) {
        usingAbsolute = true
        // alpha: 0 when device points north (in absolute mode), increases as you turn left in some browsers —
        // convert to compass heading: heading = 360 - alpha
        apply(360 - abs.alpha)
      }
    }

    const onRel = (e: DeviceOrientationEvent) => {
      if (usingAbsolute) return
      const rel = e as DeviceOrientationEvent & { webkitCompassHeading?: number }
      if (typeof rel.webkitCompassHeading === 'number' && !Number.isNaN(rel.webkitCompassHeading)) {
        apply(rel.webkitCompassHeading)
        return
      }
      if (typeof rel.alpha === 'number' && !Number.isNaN(rel.alpha)) {
        apply(360 - rel.alpha)
      }
    }

    const start = () => {
      window.addEventListener('deviceorientationabsolute', onAbs as EventListener, true)
      window.addEventListener('deviceorientation', onRel as EventListener, true)
    }

    const request = async () => {
      try {
        const DOE = DeviceOrientationEvent as unknown as {
          requestPermission?: () => Promise<'granted' | 'denied'>
        }
        if (typeof DOE.requestPermission === 'function') {
          setState((p) => ({ ...p, permission: 'prompt' }))
          const result = await DOE.requestPermission()
          if (!active) return
          if (result !== 'granted') {
            setState((p) => ({
              ...p,
              permission: 'denied',
              error: 'يلزم السماح بالبوصلة لاتجاه القبلة',
            }))
            return
          }
        }
        setState((p) => ({ ...p, permission: 'granted' }))
        start()
      } catch {
        if (!active) return
        setState((p) => ({
          ...p,
          permission: 'denied',
          error: 'تعذر تفعيل مستشعر الاتجاه',
        }))
        start()
      }
    }

    void request()

    return () => {
      active = false
      window.removeEventListener('deviceorientationabsolute', onAbs as EventListener, true)
      window.removeEventListener('deviceorientation', onRel as EventListener, true)
    }
  }, [enabled])

  return state
}
