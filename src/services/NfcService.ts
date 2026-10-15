/**
 * NFC Service Layer for Elaf Smart Misbaha
 *
 * Wraps @capgo/capacitor-nfc with platform detection.
 * On web, methods gracefully no-op; use useNfc().simulateTag for testing.
 */

export interface NfcTagData {
  id: string
  serialNumber: string
  technology: string
  records: NdefRecord[]
  timestamp: number
}

export interface NdefRecord {
  type: string
  payload: string
  id?: string
}

export interface SebhaData {
  serial: string
  totalDhikr: number
  lastDhikrText: string
  lastSessionDate: string
  isPaired: boolean
  /** Firebase Auth uid that owns this tag */
  userId?: string
  userEmail?: string
  userName?: string
}

export type NfcEventCallback = (tag: NfcTagData) => void
export type NfcErrorCallback = (error: Error) => void

function bytesToString(bytes: number[] | undefined): string {
  if (!bytes?.length) return ''
  try {
    return new TextDecoder().decode(Uint8Array.from(bytes))
  } catch {
    return String.fromCharCode(...bytes)
  }
}

function bytesToHex(bytes: number[] | undefined): string {
  if (!bytes?.length) return 'unknown'
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Decode NDEF Text (TNF Well Known, type 'T') payload → UTF-8 string */
function decodeNdefTextPayload(payload: number[]): string {
  if (!payload.length) return ''
  const status = payload[0]
  const langLen = status & 0x3f
  const textBytes = payload.slice(1 + langLen)
  return bytesToString(textBytes)
}

class NfcServiceImpl {
  private isNative: boolean
  private nfcModule: any = null
  private listeners: NfcEventCallback[] = []
  private errorListeners: NfcErrorCallback[] = []
  private scanning = false
  private pluginListenerHandle: any = null

  constructor() {
    this.isNative =
      typeof (window as any)?.Capacitor !== 'undefined' &&
      (window as any).Capacitor?.isNativePlatform?.() === true
  }

  private async getPlugin() {
    if (!this.isNative) return null
    if (!this.nfcModule) {
      try {
        const mod = await import('@capgo/capacitor-nfc')
        this.nfcModule = mod.CapacitorNfc || (mod as any).Nfc || (mod as any).default
      } catch (e) {
        console.warn('[NfcService] Failed to load NFC plugin:', e)
        return null
      }
    }
    return this.nfcModule
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isNative) return false
    try {
      const plugin = await this.getPlugin()
      if (!plugin) return false
      const result = await plugin.isSupported()
      return Boolean(result?.supported)
    } catch {
      return false
    }
  }

  async isEnabled(): Promise<boolean> {
    if (!this.isNative) return false
    try {
      const plugin = await this.getPlugin()
      if (!plugin) return false
      const { status } = await plugin.getStatus()
      return status === 'NFC_OK'
    } catch {
      return false
    }
  }

  /**
   * Start continuous NFC scanning (keeps session open for repeated taps).
   * Pass forceRestart=true to tear down and re-enable reader mode — needed when
   * a tag is already resting on the phone (Android only fires on field entry).
   */
  async startScanning(opts?: { forceRestart?: boolean }): Promise<boolean> {
    if (this.scanning && !opts?.forceRestart) return true

    if (this.scanning && opts?.forceRestart) {
      await this.stopScanning(true)
    }

    const plugin = await this.getPlugin()
    if (!plugin) {
      console.info('[NfcService] NFC not available on this platform')
      return false
    }

    try {
      if (this.pluginListenerHandle) {
        try {
          await this.pluginListenerHandle.remove()
        } catch {
          /* ignore */
        }
        this.pluginListenerHandle = null
      }

      this.pluginListenerHandle = await plugin.addListener(
        'nfcEvent',
        (event: any) => {
          const tagData = this.parseTagEvent(event)
          console.info('[NfcService] Tag event', tagData.serialNumber, 'records=', tagData.records.length)
          this.notifyListeners(tagData)
        }
      )

      await plugin.startScanning({
        invalidateAfterFirstRead: false,
        alertMessage: 'المسّ سبحة إيلاف على ظهر الهاتف',
        iosSessionType: 'tag',
      })
      this.scanning = true
      console.info('[NfcService] NFC scanning started (continuous)')
      return true
    } catch (error: any) {
      console.error('[NfcService] Failed to start scanning:', error)
      this.notifyError(new Error(error?.message || 'Failed to start NFC scanning'))
      return false
    }
  }

  /**
   * Stop scanning. By default this is a no-op while any tag listeners are still
   * registered (e.g. another screen is mounted), so switching tabs / opening
   * overlays never kills an in-progress scan. Pass force=true to stop regardless.
   */
  async stopScanning(force = false): Promise<void> {
    if (!this.scanning) return
    if (!force && this.listeners.length > 0) {
      console.info('[NfcService] stopScanning skipped — listeners still active:', this.listeners.length)
      return
    }

    const plugin = await this.getPlugin()
    if (!plugin) return

    try {
      await plugin.stopScanning()
      if (this.pluginListenerHandle) {
        await this.pluginListenerHandle.remove()
        this.pluginListenerHandle = null
      }
      this.scanning = false
      console.info('[NfcService] NFC scanning stopped')
    } catch (error) {
      console.error('[NfcService] Failed to stop scanning:', error)
    }
  }

  /** App package written as an Android Application Record so tapping the tag launches Elaf */
  private static readonly APP_PACKAGE = 'com.elaf.islamiccompanion'

  async writeTag(data: SebhaData): Promise<boolean> {
    const plugin = await this.getPlugin()
    if (!plugin) return false

    try {
      const text = JSON.stringify({
        app: 'elaf-misbaha',
        v: 1,
        ...data,
      })

      const encoder = new TextEncoder()
      const langBytes = Array.from(encoder.encode('ar'))
      const textBytes = Array.from(encoder.encode(text))
      const payload = [langBytes.length & 0x3f, ...langBytes, ...textBytes]

      // Android Application Record (AAR): TNF_EXTERNAL_TYPE, type "android.com:pkg".
      // When present, Android auto-launches this app package on tag tap.
      const aarType = Array.from(encoder.encode('android.com:pkg'))
      const aarPayload = Array.from(encoder.encode(NfcServiceImpl.APP_PACKAGE))

      const writePromise = plugin.write({
        allowFormat: true,
        records: [
          {
            tnf: 0x01, // TNF_WELL_KNOWN
            type: [0x54], // 'T' (Text)
            id: [],
            payload,
          },
          {
            tnf: 0x04, // TNF_EXTERNAL_TYPE
            type: aarType, // android.com:pkg
            id: [],
            payload: aarPayload, // com.elaf.islamiccompanion  (must be last record)
          },
        ],
      })

      // Native write can hang forever if the tag left the field — never block callers.
      await Promise.race([
        writePromise,
        new Promise((_, reject) =>
          window.setTimeout(() => reject(new Error('NFC write timeout')), 3000)
        ),
      ])

      console.info('[NfcService] Data + AAR written to tag')
      return true
    } catch (error: any) {
      console.error('[NfcService] Failed to write to tag:', error)
      this.notifyError(new Error(error?.message || 'Failed to write NFC tag'))
      return false
    }
  }

  private parseTagEvent(event: any): NfcTagData {
    const records: NdefRecord[] = []
    const tag = event?.tag ?? event
    const ndef = tag?.ndefMessage

    if (Array.isArray(ndef)) {
      for (const rec of ndef) {
        const typeStr =
          typeof rec.type === 'string'
            ? rec.type
            : bytesToString(rec.type as number[])
        const payloadBytes: number[] = Array.isArray(rec.payload)
          ? rec.payload
          : []

        let payload = ''
        if (typeStr === 'T' || (rec.type?.[0] === 0x54)) {
          payload = decodeNdefTextPayload(payloadBytes)
        } else if (typeof rec.payload === 'string') {
          payload = rec.payload
        } else {
          payload = bytesToString(payloadBytes)
        }

        records.push({
          type: typeStr || 'unknown',
          payload,
          id: Array.isArray(rec.id) ? bytesToHex(rec.id) : rec.id,
        })
      }
    } else if (event?.records) {
      for (const rec of event.records) {
        records.push({
          type: rec.type || 'unknown',
          payload: typeof rec.payload === 'string' ? rec.payload : bytesToString(rec.payload),
          id: rec.id,
        })
      }
    }

    const idBytes = tag?.id as number[] | undefined
    const serial = bytesToHex(idBytes)

    return {
      id: serial,
      serialNumber: serial,
      technology: tag?.techTypes?.[0] || tag?.type || event?.type || 'NfcA',
      records,
      timestamp: Date.now(),
    }
  }

  parseSebhaData(tag: NfcTagData): SebhaData | null {
    for (const record of tag.records) {
      try {
        const data = JSON.parse(record.payload)
        if (data.app === 'elaf-misbaha') {
          return {
            serial: data.serial || tag.serialNumber,
            totalDhikr: data.totalDhikr || 0,
            lastDhikrText: data.lastDhikrText || '',
            lastSessionDate: data.lastSessionDate || '',
            isPaired: true,
            userId: data.userId || undefined,
            userEmail: data.userEmail || undefined,
            userName: data.userName || undefined,
          }
        }
      } catch {
        // skip non-JSON
      }
    }

    // Blank / unknown tag — return unpaired shell with hardware UID for claiming
    return {
      serial: tag.serialNumber,
      totalDhikr: 0,
      lastDhikrText: '',
      lastSessionDate: '',
      isPaired: false,
    }
  }

  onTagDetected(callback: NfcEventCallback): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback)
    }
  }

  onError(callback: NfcErrorCallback): () => void {
    this.errorListeners.push(callback)
    return () => {
      this.errorListeners = this.errorListeners.filter((cb) => cb !== callback)
    }
  }

  private notifyListeners(tag: NfcTagData) {
    for (const cb of this.listeners) {
      try {
        cb(tag)
      } catch (e) {
        console.error('[NfcService] Listener error:', e)
      }
    }
  }

  private notifyError(error: Error) {
    for (const cb of this.errorListeners) {
      try {
        cb(error)
      } catch (e) {
        console.error('[NfcService] Error listener error:', e)
      }
    }
  }

  /** Inject a tag discovered via Android launch intent (no second tap needed). */
  emitIntentTag(tagUid: string) {
    const serial = (tagUid || '').trim().toUpperCase()
    if (!serial || serial === 'UNKNOWN') return
    this.notifyListeners({
      id: serial,
      serialNumber: serial,
      technology: 'NfcIntent',
      records: [],
      timestamp: Date.now(),
    })
  }

  /** Manually emit a tag (web simulator / tests) */
  emitSimulatedTag(tag: NfcTagData) {
    this.notifyListeners(tag)
  }

  isCurrentlyScanning(): boolean {
    return this.scanning
  }

  getPlatform(): 'native' | 'web' {
    return this.isNative ? 'native' : 'web'
  }
}

export const NfcService = new NfcServiceImpl()
