import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'

const firebaseConfig = {
  apiKey: 'AIzaSyD7iZvI0HWYNuPRtwXgd5WRhbob4NtWvL4',
  authDomain: 'af-quran-app.firebaseapp.com',
  projectId: 'af-quran-app',
  storageBucket: 'af-quran-app.firebasestorage.app',
  messagingSenderId: '523928400710',
  appId: '1:523928400710:web:d39361d762872c3d47ab47',
}

export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)

/**
 * Capacitor Android WebView often breaks Firestore's default WebChannel transport
 * and surfaces as "unavailable" / network errors. Force long-polling on native.
 */
function createFirestore() {
  if (!Capacitor.isNativePlatform()) return getFirestore(firebaseApp)
  try {
    return initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    })
  } catch {
    // Already initialized (HMR / re-entry)
    return getFirestore(firebaseApp)
  }
}

function createAuth() {
  if (!Capacitor.isNativePlatform()) return getAuth(firebaseApp)
  try {
    return initializeAuth(firebaseApp, {
      persistence: indexedDBLocalPersistence,
    })
  } catch {
    return getAuth(firebaseApp)
  }
}

export const firebaseDb = createFirestore()
export const firebaseAuth = createAuth()
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
