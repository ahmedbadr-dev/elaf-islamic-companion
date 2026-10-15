import { registerPlugin, Capacitor } from '@capacitor/core'

export interface NfcLaunchResult {
  launched: boolean
  /** Hardware UID hex from the NFC intent, if Android provided it */
  tagUid?: string
}

export interface NfcLaunchPlugin {
  /** Returns whether the app was launched/resumed by an NFC tag (true once, then resets). */
  consume(): Promise<NfcLaunchResult>
}

export const NfcLaunch = registerPlugin<NfcLaunchPlugin>('NfcLaunch', {
  web: {
    async consume() {
      return { launched: false }
    },
  },
})

/** Safe helper for NFC cold-start / resume launches. */
export async function consumeNfcLaunch(): Promise<NfcLaunchResult> {
  try {
    if (Capacitor.getPlatform() !== 'android') return { launched: false }
    const result = await NfcLaunch.consume()
    return {
      launched: !!result?.launched,
      tagUid: result?.tagUid || undefined,
    }
  } catch {
    return { launched: false }
  }
}
