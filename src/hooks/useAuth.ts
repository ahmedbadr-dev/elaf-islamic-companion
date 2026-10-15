import { useCallback, useEffect, useState } from 'react'
import {
  completeGoogleRedirect,
  login as authLogin,
  loginWithGoogle as authGoogle,
  logout as authLogout,
  signup as authSignup,
  subscribeAuth,
  updateUserProfile,
  type UserProfile,
} from '../services/AuthService'

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let unsub = () => {}
    void (async () => {
      await completeGoogleRedirect()
      unsub = subscribeAuth((next) => {
        setUser(next)
        setLoading(false)
      })
    })()
    return () => unsub()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const login = useCallback(async (email: string, password: string) => {
    setBusy(true)
    setError(null)
    const res = await authLogin({ email, password })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return false
    }
    setUser(res.user)
    return true
  }, [])

  const signup = useCallback(
    async (data: {
      name: string
      email: string
      password: string
      phone?: string
      city?: string
    }) => {
      setBusy(true)
      setError(null)
      const res = await authSignup(data)
      setBusy(false)
      if (!res.ok) {
        setError(res.error)
        return false
      }
      setUser(res.user)
      return true
    },
    []
  )

  const loginWithGoogle = useCallback(async () => {
    setBusy(true)
    setError(null)
    const res = await authGoogle()
    setBusy(false)
    if (!res.ok) {
      // Redirect in progress message is informational on native
      if (!res.error.includes('جارٍ التحويل')) setError(res.error)
      return false
    }
    setUser(res.user)
    return true
  }, [])

  const logout = useCallback(async () => {
    setBusy(true)
    await authLogout()
    setUser(null)
    setError(null)
    setBusy(false)
  }, [])

  const updateProfile = useCallback(
    async (patch: Partial<Pick<UserProfile, 'name' | 'phone' | 'city' | 'bio' | 'email'>>) => {
      setBusy(true)
      setError(null)
      const res = await updateUserProfile(patch)
      setBusy(false)
      if (!res.ok) {
        setError(res.error)
        return false
      }
      setUser(res.user)
      return true
    },
    []
  )

  return {
    user,
    loading,
    busy,
    error,
    clearError,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfile,
  }
}
