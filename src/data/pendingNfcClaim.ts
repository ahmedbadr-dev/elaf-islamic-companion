/** Session hold for NFC UID scanned before signup */

const PENDING_NFC_KEY = 'elaf-pending-nfc-claim'

export function normalizePendingTagUid(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

export function setPendingNfcClaim(tagUidRaw: string): string | null {
  const uid = normalizePendingTagUid(tagUidRaw)
  if (!uid || uid === 'UNKNOWN') return null
  try {
    sessionStorage.setItem(PENDING_NFC_KEY, uid)
  } catch {
    /* ignore */
  }
  return uid
}

export function getPendingNfcClaim(): string | null {
  try {
    const uid = sessionStorage.getItem(PENDING_NFC_KEY)
    if (!uid || uid === 'UNKNOWN') return null
    return uid
  } catch {
    return null
  }
}

export function clearPendingNfcClaim() {
  try {
    sessionStorage.removeItem(PENDING_NFC_KEY)
  } catch {
    /* ignore */
  }
}
