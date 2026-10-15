import { useState, useEffect, useCallback, useRef } from 'react'
import { NfcService, type NfcTagData, type SebhaData } from '../services/NfcService'

export interface UseNfcState {
  isAvailable: boolean
  isEnabled: boolean
  isScanning: boolean
  lastTag: NfcTagData | null
  sebhaData: SebhaData | null
  error: string | null
  isNative: boolean
  /** Increments on every debounced NFC tap (including re-scans of same tag) */
  tapCount: number
  lastTapAt: number
}

export interface UseNfcActions {
  startScanning: (opts?: { forceRestart?: boolean }) => Promise<boolean>
  stopScanning: () => Promise<void>
  syncToSebha: (data: SebhaData) => Promise<boolean>
  applyCloudPairing: (data: SebhaData) => void
  clearLocalPairing: () => void
  clearError: () => void
  /** Simulate pairing / first tag (web) */
  simulateTag: () => void
  /** Simulate another NFC tap while already paired (web) */
  simulateTap: () => void
}

export interface UseNfcOptions {
  /** Start scanning as soon as NFC is available */
  autoStart?: boolean
  /** Min ms between count-worthy taps (avoids double-fire while tag is held) */
  tapDebounceMs?: number
  /** Called on every debounced tag detection */
  onTap?: (tag: NfcTagData, sebha: SebhaData) => void
}

const STORAGE_KEY = 'elaf-sebha-pairing'
export const SEBHA_PAIRING_EVENT = 'elaf-sebha-changed'

export function loadSebhaPairing(): SebhaData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as SebhaData) : null
  } catch {
    return null
  }
}

/** True when an Elaf misbaha has been paired via NFC */
export function isSebhaPaired(): boolean {
  return !!loadSebhaPairing()?.isPaired
}

export function persistSebha(data: SebhaData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(SEBHA_PAIRING_EVENT, { detail: data }))
  } catch {
    /* ignore */
  }
}

/** Clear local device pairing (call on logout). Cloud claim stays in Firebase. */
export function clearSebhaPairing() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(SEBHA_PAIRING_EVENT, { detail: null }))
  } catch {
    /* ignore */
  }
}

function buildMockTag(overrides?: Partial<SebhaData>): NfcTagData {
  const serial = overrides?.serial || 'ELAF-DEMO-001'
  const paired = overrides?.isPaired !== false
  return {
    id: serial,
    serialNumber: serial,
    technology: 'NfcA (simulated)',
    records: paired
      ? [
          {
            type: 'T',
            payload: JSON.stringify({
              app: 'elaf-misbaha',
              v: 1,
              serial,
              totalDhikr: overrides?.totalDhikr || 0,
              lastDhikrText: overrides?.lastDhikrText || '',
              lastSessionDate: overrides?.lastSessionDate || new Date().toISOString(),
              isPaired: true,
              userId: overrides?.userId,
              userEmail: overrides?.userEmail,
              userName: overrides?.userName,
            }),
          },
        ]
      : [],
    timestamp: Date.now(),
  }
}

export function useNfc(options: UseNfcOptions = {}): [UseNfcState, UseNfcActions] {
  const { autoStart = false, tapDebounceMs = 700, onTap } = options

  const [isAvailable, setIsAvailable] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastTag, setLastTag] = useState<NfcTagData | null>(null)
  const [sebhaData, setSebhaData] = useState<SebhaData | null>(() => loadSebhaPairing())
  const [error, setError] = useState<string | null>(null)
  const [tapCount, setTapCount] = useState(0)
  const [lastTapAt, setLastTapAt] = useState(0)

  const mountedRef = useRef(true)
  const lastTapTsRef = useRef(0)
  const onTapRef = useRef(onTap)
  onTapRef.current = onTap

  const isNative = NfcService.getPlatform() === 'native'

  const handleTag = useCallback((tag: NfcTagData) => {
    if (!mountedRef.current) return

    const now = Date.now()
    if (now - lastTapTsRef.current < tapDebounceMs) return
    lastTapTsRef.current = now

    setLastTag(tag)
    setError(null)
    setTapCount((c) => c + 1)
    setLastTapAt(now)

    const data = NfcService.parseSebhaData(tag)
    if (data) {
      // Only persist fully claimed tags locally; blank tags stay ephemeral for claim UI
      if (data.isPaired && data.userId) {
        setSebhaData(data)
        persistSebha(data)
      } else if (data.isPaired) {
        setSebhaData(data)
        persistSebha(data)
      } else {
        setSebhaData(data)
      }
      onTapRef.current?.(tag, data)
    }
  }, [tapDebounceMs])

  useEffect(() => {
    mountedRef.current = true

    const checkNfc = async () => {
      const available = await NfcService.isAvailable()
      if (!mountedRef.current) return
      setIsAvailable(available)

      if (available) {
        const enabled = await NfcService.isEnabled()
        if (mountedRef.current) setIsEnabled(enabled)
      }

      if (autoStart && available) {
        const started = await NfcService.startScanning()
        if (mountedRef.current) setIsScanning(started)
      }
    }

    checkNfc()

    const unsubTag = NfcService.onTagDetected(handleTag)
    const unsubError = NfcService.onError((err) => {
      if (mountedRef.current) setError(err.message)
    })

    return () => {
      mountedRef.current = false
      unsubTag()
      unsubError()
      NfcService.stopScanning()
    }
  }, [autoStart, handleTag])

  const startScanning = useCallback(async (opts?: { forceRestart?: boolean }) => {
    setError(null)
    const started = await NfcService.startScanning(opts)
    if (mountedRef.current) {
      setIsScanning(started)
      if (!started && isNative) {
        setError('تعذر بدء اللمس. تأكد من تفعيل اللمس القريب في إعدادات الهاتف.')
      }
    }
    return started
  }, [isNative])

  const stopScanning = useCallback(async () => {
    await NfcService.stopScanning()
    if (mountedRef.current) setIsScanning(false)
  }, [])

  const syncToSebha = useCallback(async (data: SebhaData): Promise<boolean> => {
    setError(null)
    const success = await NfcService.writeTag(data)
    if (success) {
      setSebhaData(data)
      persistSebha(data)
    } else if (mountedRef.current) {
      setError('تعذرت مزامنة البيانات مع السبحة. أعد المحاولة.')
    }
    return success
  }, [])

  /** Apply a cloud-claimed pairing to local device state */
  const applyCloudPairing = useCallback((data: SebhaData) => {
    setSebhaData(data)
    persistSebha(data)
  }, [])

  const clearLocalPairing = useCallback(() => {
    setSebhaData(null)
    clearSebhaPairing()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const simulateTag = useCallback(() => {
    // Blank tag UID for first-time claim testing on web
    const mockTag = buildMockTag({
      serial: 'ELAF-TEST-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      isPaired: false,
    })
    // Force empty records so claim flow treats it as new
    mockTag.records = []
    NfcService.emitSimulatedTag(mockTag)
  }, [])

  const simulateTap = useCallback(() => {
    const mockTag = buildMockTag()
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const prev = JSON.parse(stored) as SebhaData
        mockTag.serialNumber = prev.serial
        mockTag.id = prev.serial
        mockTag.records[0] = {
          type: 'T',
          payload: JSON.stringify({
            app: 'elaf-misbaha',
            v: 1,
            ...prev,
            isPaired: true,
          }),
        }
      }
    } catch {
      /* ignore */
    }
    NfcService.emitSimulatedTag(mockTag)
  }, [])

  const state: UseNfcState = {
    isAvailable,
    isEnabled,
    isScanning,
    lastTag,
    sebhaData,
    error,
    isNative,
    tapCount,
    lastTapAt,
  }

  const actions: UseNfcActions = {
    startScanning,
    stopScanning,
    syncToSebha,
    applyCloudPairing,
    clearLocalPairing,
    clearError,
    simulateTag,
    simulateTap,
  }

  return [state, actions]
}
