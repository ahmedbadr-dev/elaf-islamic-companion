import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile as firebaseUpdateProfile,
  updateEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { firebaseAuth, googleProvider } from './firebase'

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  city: string
  bio: string
  avatarInitials: string
  photoURL: string
  createdAt: string
}

type ProfileExtras = {
  phone: string
  city: string
  bio: string
}

const EXTRAS_KEY = 'elaf-profile-extras'

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'إ'
  if (parts.length === 1) return parts[0].slice(0, 2)
  return (parts[0][0] + parts[1][0]).slice(0, 2)
}

function readExtrasMap(): Record<string, ProfileExtras> {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, ProfileExtras>
  } catch {
    return {}
  }
}

function writeExtras(uid: string, extras: ProfileExtras) {
  const map = readExtrasMap()
  map[uid] = extras
  localStorage.setItem(EXTRAS_KEY, JSON.stringify(map))
}

function getExtras(uid: string): ProfileExtras {
  return readExtrasMap()[uid] || { phone: '', city: '', bio: '' }
}

export function mapFirebaseUser(user: User): UserProfile {
  const extras = getExtras(user.uid)
  const name = user.displayName || user.email?.split('@')[0] || 'مستخدم'
  return {
    id: user.uid,
    name,
    email: user.email || '',
    phone: extras.phone || user.phoneNumber || '',
    city: extras.city,
    bio: extras.bio,
    avatarInitials: initialsFromName(name),
    photoURL: user.photoURL || '',
    createdAt: user.metadata.creationTime || new Date().toISOString(),
  }
}

export type AuthResult = { ok: true; user: UserProfile } | { ok: false; error: string }

function mapAuthError(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'هذا البريد مسجّل مسبقاً'
    case 'auth/invalid-email':
      return 'البريد الإلكتروني غير صالح'
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة (٦ أحرف على الأقل)'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'البريد أو كلمة المرور غير صحيحة'
    case 'auth/popup-closed-by-user':
      return 'تم إغلاق نافذة تسجيل الدخول'
    case 'auth/popup-blocked':
      return 'المتصفح حظر نافذة Google — اسمح بالنوافذ المنبثقة'
    case 'auth/network-request-failed':
      return 'تعذّر الاتصال — تحقق من الإنترنت'
    case 'auth/too-many-requests':
      return 'محاولات كثيرة — حاول لاحقاً'
    case 'auth/operation-not-allowed':
      return 'طريقة الدخول غير متاحة حالياً'
    case 'auth/unauthorized-domain':
      return 'تعذّر تسجيل الدخول من هذا الجهاز — حاول مرة أخرى'
    default:
      return 'تعذّر إتمام العملية. حاول مرة أخرى'
  }
}

export async function signup(input: {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
}): Promise<AuthResult> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password

  if (name.length < 2) return { ok: false, error: 'أدخل اسماً صالحاً' }
  if (!email.includes('@')) return { ok: false, error: 'أدخل بريداً إلكترونياً صالحاً' }
  if (password.length < 6) return { ok: false, error: 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' }

  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    await firebaseUpdateProfile(cred.user, { displayName: name })
    writeExtras(cred.user.uid, {
      phone: (input.phone || '').trim(),
      city: (input.city || '').trim(),
      bio: '',
    })
    await cred.user.reload()
    return { ok: true, user: mapFirebaseUser(firebaseAuth.currentUser || cred.user) }
  } catch (err) {
    return { ok: false, error: mapAuthError(err) }
  }
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  try {
    const cred = await signInWithEmailAndPassword(
      firebaseAuth,
      input.email.trim().toLowerCase(),
      input.password
    )
    return { ok: true, user: mapFirebaseUser(cred.user) }
  } catch (err) {
    return { ok: false, error: mapAuthError(err) }
  }
}

export async function loginWithGoogle(): Promise<AuthResult> {
  try {
    if (Capacitor.isNativePlatform()) {
      await signInWithRedirect(firebaseAuth, googleProvider)
      // Redirect leaves the page; result handled by completeGoogleRedirect()
      return { ok: false, error: 'جارٍ التحويل إلى Google…' }
    }
    const cred = await signInWithPopup(firebaseAuth, googleProvider)
    return { ok: true, user: mapFirebaseUser(cred.user) }
  } catch (err) {
    return { ok: false, error: mapAuthError(err) }
  }
}

/** Call once on app start to finish Google redirect (Capacitor / mobile web). */
export async function completeGoogleRedirect(): Promise<UserProfile | null> {
  try {
    const result = await getRedirectResult(firebaseAuth)
    if (!result?.user) return null
    return mapFirebaseUser(result.user)
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  await signOut(firebaseAuth)
}

export async function updateUserProfile(
  patch: Partial<Pick<UserProfile, 'name' | 'phone' | 'city' | 'bio' | 'email'>>
): Promise<AuthResult> {
  const user = firebaseAuth.currentUser
  if (!user) return { ok: false, error: 'يجب تسجيل الدخول أولاً' }

  try {
    if (patch.name != null) {
      const name = patch.name.trim()
      if (name.length < 2) return { ok: false, error: 'أدخل اسماً صالحاً' }
      await firebaseUpdateProfile(user, { displayName: name })
    }

    if (patch.email != null) {
      const email = patch.email.trim().toLowerCase()
      if (!email.includes('@')) return { ok: false, error: 'أدخل بريداً صالحاً' }
      if (email !== (user.email || '')) {
        await updateEmail(user, email)
      }
    }

    const extras = getExtras(user.uid)
    writeExtras(user.uid, {
      phone: patch.phone != null ? patch.phone.trim() : extras.phone,
      city: patch.city != null ? patch.city.trim() : extras.city,
      bio: patch.bio != null ? patch.bio.trim() : extras.bio,
    })

    await user.reload()
    return { ok: true, user: mapFirebaseUser(firebaseAuth.currentUser || user) }
  } catch (err) {
    return { ok: false, error: mapAuthError(err) }
  }
}

export function subscribeAuth(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, (fbUser) => {
    callback(fbUser ? mapFirebaseUser(fbUser) : null)
  })
}

export function getCurrentProfile(): UserProfile | null {
  const user = firebaseAuth.currentUser
  return user ? mapFirebaseUser(user) : null
}
