import { registerPlugin } from '@capacitor/core'

export interface LocationAccuracyPlugin {
  /** Show Google Play in-app dialog to turn on device location / accuracy. */
  promptEnable(): Promise<{ enabled: boolean }>
}

export const LocationAccuracy = registerPlugin<LocationAccuracyPlugin>('LocationAccuracy')
