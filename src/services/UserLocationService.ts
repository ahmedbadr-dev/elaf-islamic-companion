/**
 * User locations for future «المساجد القريبة».
 * Synced after consent + signed-in account.
 * Localhost dashboard also uses /api/user-locations (Vite hub) so rules delays don't block it.
 */

import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'
import { firebaseAuth, firebaseDb } from './firebase'

export const LOCATION_CONSENT_KEY = 'elaf-mosque-location-consent'
export const LOCATION_PURPOSE = 'nearby_mosques' as const

function roundCoord(n: number, places = 2): number {
  const f = 10 ** places
  return Math.round(n * f) / f
}

export function hasLocationShareConsent(): boolean {
  try {
    return localStorage.getItem(LOCATION_CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

export function setLocationShareConsent(accepted: boolean): void {
  try {
    if (accepted) localStorage.setItem(LOCATION_CONSENT_KEY, '1')
    else localStorage.removeItem(LOCATION_CONSENT_KEY)
  } catch {
    /* ignore */
  }
}

export interface UserLocationPin {
  userId: string
  email?: string
  name?: string
  latitude: number
  longitude: number
  cityLabel: string
  purpose: typeof LOCATION_PURPOSE
  updatedAt?: string
}

async function postToLocalHub(pin: UserLocationPin): Promise<void> {
  try {
    await fetch('/api/user-locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pin),
    })
  } catch {
    /* hub only available on vite dev */
  }
}

export async function syncUserLocationForMosques(input: {
  userId: string
  email?: string
  name?: string
  latitude: number
  longitude: number
  cityLabel: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasLocationShareConsent()) {
    return { ok: false, error: 'no-consent' }
  }
  if (!firebaseAuth.currentUser || firebaseAuth.currentUser.uid !== input.userId) {
    return { ok: false, error: 'not-authenticated' }
  }

  const lat = roundCoord(input.latitude)
  const lng = roundCoord(input.longitude)
  const pin: UserLocationPin = {
    userId: input.userId,
    email: (input.email || '').trim() || undefined,
    name: (input.name || '').trim() || undefined,
    latitude: lat,
    longitude: lng,
    cityLabel: (input.cityLabel || '').trim(),
    purpose: LOCATION_PURPOSE,
    updatedAt: new Date().toISOString(),
  }

  // Always mirror to localhost hub when available (dashboard)
  await postToLocalHub(pin)

  try {
    await firebaseAuth.currentUser.getIdToken(true)
    await setDoc(
      doc(firebaseDb, 'userLocations', input.userId),
      {
        userId: pin.userId,
        email: pin.email || '',
        name: pin.name || '',
        latitude: lat,
        longitude: lng,
        cityLabel: pin.cityLabel,
        purpose: LOCATION_PURPOSE,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[UserLocation] Firestore sync failed (local hub may still have it)', msg)
    // Local hub still received the pin — treat as soft success for dashboard
    return { ok: true }
  }
}

function tsToIso(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  const t = value as Timestamp
  if (typeof t?.toDate === 'function') return t.toDate().toISOString()
  return undefined
}

function mapFirestorePin(id: string, data: Record<string, unknown>): UserLocationPin {
  return {
    userId: String(data.userId || id),
    email: data.email ? String(data.email) : undefined,
    name: data.name ? String(data.name) : undefined,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    cityLabel: String(data.cityLabel || ''),
    purpose: LOCATION_PURPOSE,
    updatedAt: tsToIso(data.updatedAt),
  }
}

async function listFromLocalHub(): Promise<UserLocationPin[]> {
  const res = await fetch('/api/user-locations', { cache: 'no-store' })
  if (!res.ok) throw new Error(`hub ${res.status}`)
  const json = (await res.json()) as { pins?: UserLocationPin[] }
  return Array.isArray(json.pins) ? json.pins : []
}

async function listFromFirestore(): Promise<UserLocationPin[]> {
  const snap = await getDocs(collection(firebaseDb, 'userLocations'))
  const pins: UserLocationPin[] = []
  snap.forEach((d) => pins.push(mapFirestorePin(d.id, d.data() as Record<string, unknown>)))
  return pins
}

/** Dashboard: prefer local hub, merge Firestore when readable */
export async function listUserLocationsForAdmin(): Promise<UserLocationPin[]> {
  const byId = new Map<string, UserLocationPin>()

  try {
    for (const p of await listFromLocalHub()) {
      if (p?.userId) byId.set(p.userId, p)
    }
  } catch {
    /* hub offline */
  }

  try {
    for (const p of await listFromFirestore()) {
      if (!p?.userId) continue
      const prev = byId.get(p.userId)
      if (!prev || (p.updatedAt || '') >= (prev.updatedAt || '')) {
        byId.set(p.userId, p)
      }
    }
  } catch (err) {
    // If hub already has data, ignore Firestore permission errors
    if (byId.size === 0) throw err
    console.warn('[UserLocation] Firestore list skipped', err)
  }

  return [...byId.values()].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
}
