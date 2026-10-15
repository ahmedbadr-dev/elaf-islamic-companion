/**
 * NFC tag ↔ Firebase user pairing (Firestore).
 *
 * Collections:
 *   nfcTags/{tagUid}  → ownership of a physical NFC UID
 *   users/{userId}    → which tag unlocks PRO for this account
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { firebaseDb } from './firebase'
import type { SebhaData } from './NfcService'

export type NfcTagRecord = {
  tagUid: string
  userId: string
  userEmail: string
  userName: string
  isPro: boolean
  totalDhikr: number
  lastDhikrText: string
  lastSessionDate: string
  claimedAt?: string
  updatedAt?: string
}

export type UserSebhaProfile = {
  userId: string
  pairedTagUid: string | null
  isPro: boolean
  email: string
  name: string
  phone?: string
  city?: string
}

export type PairingResult =
  | { ok: true; tag: NfcTagRecord; sebha: SebhaData; restored?: boolean }
  | { ok: false; code: PairingErrorCode; message: string; tag?: NfcTagRecord }

export type PairingErrorCode =
  | 'not-authenticated'
  | 'invalid-tag'
  | 'owned-by-other'
  | 'network'
  | 'unknown'

function normalizeTagUid(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

function mapPairingError(err: unknown): PairingResult {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: string }).code)
      : ''
  const rawMsg = err instanceof Error ? err.message : String(err ?? '')

  if (code.includes('permission-denied')) {
    return {
      ok: false,
      code: 'network',
      message: 'تعذّر إكمال الربط — تحقق من الإنترنت وحاول مرة أخرى',
    }
  }
  if (code.includes('unauthenticated')) {
    return {
      ok: false,
      code: 'not-authenticated',
      message: 'انتهت الجلسة — سجّل الدخول ثم المسّ سبحة إيلاف مرة أخرى',
    }
  }
  if (code.includes('unavailable') || code.includes('network') || code.includes('deadline')) {
    return {
      ok: false,
      code: 'network',
      message: `تعذّر الاتصال — تحقق من الإنترنت وحاول مرة أخرى`,
    }
  }
  return {
    ok: false,
    code: 'unknown',
    message: rawMsg || 'تعذّر ربط السبحة، حاول مرة أخرى',
  }
}

function toSebha(tag: NfcTagRecord): SebhaData {
  return {
    serial: tag.tagUid,
    totalDhikr: tag.totalDhikr || 0,
    lastDhikrText: tag.lastDhikrText || '',
    lastSessionDate: tag.lastSessionDate || '',
    isPaired: true,
    userId: tag.userId,
    userEmail: tag.userEmail,
    userName: tag.userName,
  }
}

function tsToIso(value: unknown): string {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  const t = value as Timestamp
  if (typeof t?.toDate === 'function') return t.toDate().toISOString()
  return new Date().toISOString()
}

/** Look up who owns this physical NFC UID (if anyone). */
export async function lookupTag(tagUidRaw: string): Promise<NfcTagRecord | null> {
  const tagUid = normalizeTagUid(tagUidRaw)
  if (!tagUid || tagUid === 'UNKNOWN') return null
  try {
    const snap = await getDoc(doc(firebaseDb, 'nfcTags', tagUid))
    if (!snap.exists()) return null
    const d = snap.data()
    return {
      tagUid,
      userId: String(d.userId || ''),
      userEmail: String(d.userEmail || ''),
      userName: String(d.userName || ''),
      isPro: d.isPro !== false,
      totalDhikr: Number(d.totalDhikr) || 0,
      lastDhikrText: String(d.lastDhikrText || ''),
      lastSessionDate: String(d.lastSessionDate || ''),
      claimedAt: tsToIso(d.claimedAt),
      updatedAt: tsToIso(d.updatedAt),
    }
  } catch (err) {
    console.warn('[SebhaPairing] lookupTag failed', err)
    throw err
  }
}

/** Load PRO / paired tag for a Firebase user (after login). */
export async function getUserSebhaProfile(userId: string): Promise<UserSebhaProfile | null> {
  if (!userId) return null
  try {
    const snap = await getDoc(doc(firebaseDb, 'users', userId))
    if (!snap.exists()) return null
    const d = snap.data()
    return {
      userId,
      pairedTagUid: d.pairedTagUid ? String(d.pairedTagUid) : null,
      isPro: Boolean(d.isPro),
      email: String(d.email || ''),
      name: String(d.name || ''),
      phone: d.phone ? String(d.phone) : '',
      city: d.city ? String(d.city) : '',
    }
  } catch (err) {
    console.warn('[SebhaPairing] getUserSebhaProfile failed', err)
    return null
  }
}

/**
 * Claim an NFC tag for the logged-in user (first-time setup),
 * or restore PRO if the tag already belongs to them.
 */
export async function claimOrRestoreTag(input: {
  tagUid: string
  userId: string
  userEmail: string
  userName: string
  phone?: string
  city?: string
  totalDhikr?: number
  lastDhikrText?: string
}): Promise<PairingResult> {
  const tagUid = normalizeTagUid(input.tagUid)
  if (!input.userId) {
    return {
      ok: false,
      code: 'not-authenticated',
      message: 'سجّل الدخول أولاً لربط سبحة إيلاف بحسابك',
    }
  }
  if (!tagUid || tagUid === 'UNKNOWN') {
    return { ok: false, code: 'invalid-tag', message: 'تعذّر التعرف على سبحة إيلاف — المسّها مرة أخرى' }
  }

  try {
    const existing = await lookupTag(tagUid)

    if (existing && existing.userId && existing.userId !== input.userId) {
      return {
        ok: false,
        code: 'owned-by-other',
        message: `هذه السبحة مرتبطة بحساب آخر${existing.userEmail ? ` (${existing.userEmail})` : ''}`,
        tag: existing,
      }
    }

    // Ensure Auth token is attached before Firestore writes
    const { firebaseAuth } = await import('./firebase')
    if (!firebaseAuth.currentUser || firebaseAuth.currentUser.uid !== input.userId) {
      return {
        ok: false,
        code: 'not-authenticated',
        message: 'انتهت الجلسة — سجّل الدخول ثم المسّ سبحة إيلاف مرة أخرى',
      }
    }
    await firebaseAuth.currentUser.getIdToken(true)

    // User may already have another tag — reassign this one as primary
    const userRef = doc(firebaseDb, 'users', input.userId)
    const prevProfile = await getUserSebhaProfile(input.userId)

    const record: NfcTagRecord = {
      tagUid,
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      isPro: true,
      totalDhikr: input.totalDhikr ?? existing?.totalDhikr ?? 0,
      lastDhikrText: input.lastDhikrText ?? existing?.lastDhikrText ?? '',
      lastSessionDate: new Date().toISOString(),
      claimedAt: existing?.claimedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await setDoc(
      doc(firebaseDb, 'nfcTags', tagUid),
      {
        ...record,
        claimedAt: existing?.claimedAt ? existing.claimedAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    // If switching tags, free the old one only if it still points at this user
    if (
      prevProfile?.pairedTagUid &&
      prevProfile.pairedTagUid !== tagUid
    ) {
      try {
        const old = await lookupTag(prevProfile.pairedTagUid)
        if (old?.userId === input.userId) {
          await deleteDoc(doc(firebaseDb, 'nfcTags', prevProfile.pairedTagUid))
        }
      } catch {
        /* ignore old-tag cleanup */
      }
    }

    await setDoc(
      userRef,
      {
        userId: input.userId,
        pairedTagUid: tagUid,
        isPro: true,
        email: input.userEmail,
        name: input.userName,
        phone: (input.phone || '').trim(),
        city: (input.city || '').trim(),
        updatedAt: serverTimestamp(),
        ...(prevProfile
          ? {}
          : { createdAt: serverTimestamp(), welcomeShown: false }),
      },
      { merge: true }
    )

    return {
      ok: true,
      tag: record,
      sebha: toSebha(record),
      restored: Boolean(existing && existing.userId === input.userId),
    }
  } catch (err) {
    return mapPairingError(err)
  }
}

/** Sync dhikr counters back to Firestore for the paired tag. */
export async function syncTagStats(
  tagUidRaw: string,
  patch: { totalDhikr?: number; lastDhikrText?: string }
): Promise<boolean> {
  const tagUid = normalizeTagUid(tagUidRaw)
  if (!tagUid) return false
  try {
    await setDoc(
      doc(firebaseDb, 'nfcTags', tagUid),
      {
        ...patch,
        lastSessionDate: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
    return true
  } catch (err) {
    console.warn('[SebhaPairing] syncTagStats failed', err)
    return false
  }
}

/** Remove cloud pairing for this user (keeps Auth account). */
export async function unpairUserTag(userId: string): Promise<boolean> {
  try {
    const profile = await getUserSebhaProfile(userId)
    if (profile?.pairedTagUid) {
      const owned = await lookupTag(profile.pairedTagUid)
      if (owned?.userId === userId) {
        await deleteDoc(doc(firebaseDb, 'nfcTags', profile.pairedTagUid))
      }
    }
    await setDoc(
      doc(firebaseDb, 'users', userId),
      { pairedTagUid: null, isPro: false, updatedAt: serverTimestamp() },
      { merge: true }
    )
    return true
  } catch (err) {
    console.warn('[SebhaPairing] unpairUserTag failed', err)
    return false
  }
}

/** After login: restore local sebha + whether PRO should be on. */
export async function hydratePairingAfterLogin(userId: string): Promise<{
  isPro: boolean
  sebha: SebhaData | null
} | null> {
  const profile = await getUserSebhaProfile(userId)
  if (!profile?.isPro || !profile.pairedTagUid) {
    return { isPro: false, sebha: null }
  }
  const tag = await lookupTag(profile.pairedTagUid)
  if (!tag || tag.userId !== userId) {
    return { isPro: Boolean(profile.isPro), sebha: null }
  }
  return { isPro: true, sebha: toSebha(tag) }
}
