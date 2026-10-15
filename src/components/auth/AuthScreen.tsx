import { useState, useEffect, type CSSProperties, type FormEvent } from 'react'

type AuthMode = 'login' | 'signup'

export function AuthScreen({
  onLogin,
  onSignup,
  error,
  onClearError,
  busy,
  onClose,
  title,
  initialEmail,
  initialMode = 'login',
  allowSignup = false,
  pendingTagUid,
  onRequestNfcScan,
}: {
  onLogin: (email: string, password: string) => Promise<boolean>
  onSignup: (data: {
    name: string
    email: string
    password: string
    phone?: string
    city?: string
  }) => Promise<boolean>
  onGoogle?: () => Promise<boolean>
  error: string | null
  onClearError: () => void
  busy?: boolean
  onClose?: () => void
  title?: string
  initialEmail?: string
  subtitle?: string
  initialMode?: AuthMode
  allowSignup?: boolean
  pendingTagUid?: string | null
  onRequestNfcScan?: () => void
}) {
  const [mode, setMode] = useState<AuthMode>(allowSignup && initialMode === 'signup' ? 'signup' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail || '')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [localHint, setLocalHint] = useState<string | null>(null)

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail)
  }, [initialEmail])

  useEffect(() => {
    if (allowSignup && initialMode === 'signup') {
      setMode('signup')
      return
    }
    if (!allowSignup) setMode('login')
  }, [allowSignup, initialMode])

  const switchMode = (next: AuthMode) => {
    onClearError()
    setLocalHint(null)
    if (next === 'signup' && !allowSignup) {
      setLocalHint('لإنشاء حساب المسّ سبحة إيلاف أولاً')
      setMode('login')
      return
    }
    setMode(next)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    onClearError()
    setLocalHint(null)
    if (mode === 'login') {
      await onLogin(email, password)
      return
    }
    if (!allowSignup || !pendingTagUid) {
      setLocalHint('لإنشاء حساب المسّ سبحة إيلاف أولاً')
      return
    }
    await onSignup({ name, email, password, phone, city })
  }

  const inputStyle: CSSProperties = {
    background: '#F7F8F9',
    border: '1px solid #E8ECEE',
    color: '#133840',
    fontFamily: 'Cairo, sans-serif',
  }

  return (
    <div
      className="w-full h-full flex flex-col overflow-y-auto"
      style={{
        background: '#FFFFFF',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
      }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: '#F7F8F9', border: '1px solid #E8ECEE' }}
          aria-label="إغلاق"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#3A5C64">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md w-full mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-[88px] h-[88px] rounded-[28px] flex items-center justify-center mb-4 overflow-hidden"
            style={{
              background: '#FFFFFF',
              border: '1px solid #EEF1F3',
              boxShadow: '0 8px 28px rgba(19,56,64,0.08)',
            }}
          >
            <img src="/elaf-logo.png" alt="إيلاف" className="w-full h-full object-contain p-2.5" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#133840' }}>
            إيلاف
          </h1>
          <p className="text-[13px] mt-1.5 font-semibold" style={{ color: '#7E9DA3' }}>
            {title || (mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب وربط السبحة')}
          </p>
          {allowSignup && pendingTagUid && mode === 'signup' && (
            <p className="text-[11px] mt-2 px-3 py-1.5 rounded-full font-bold" style={{ background: '#EAF9FC', color: '#24ACB5' }}>
              سبحة إيلاف جاهزة للربط ✓
            </p>
          )}
        </div>

        <div className="flex p-1 gap-1 rounded-full mb-6" style={{ background: '#F7F8F9' }}>
          {(
            [
              { id: 'login' as const, label: 'تسجيل الدخول' },
              { id: 'signup' as const, label: 'إنشاء حساب' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchMode(tab.id)}
              className="flex-1 py-2.5 rounded-full text-[12px] font-bold transition-all"
              style={{
                background: mode === tab.id ? '#133840' : 'transparent',
                color: mode === tab.id ? '#fff' : '#7E9DA3',
                opacity: tab.id === 'signup' && !allowSignup ? 0.55 : 1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!allowSignup && (
          <div
            className="mb-4 px-3 py-3 rounded-2xl text-[11px] font-semibold leading-relaxed text-center"
            style={{ background: '#FFF8E8', color: '#92400E', border: '1px solid #FDE68A' }}
          >
            لإنشاء حساب جديد المسّ سبحة إيلاف أولاً. تسجيل الدخول متاح لمن لديه حساب مسبقاً.
            {onRequestNfcScan && (
              <button
                type="button"
                onClick={onRequestNfcScan}
                className="mt-2 w-full py-2.5 rounded-xl text-[12px] font-black text-white"
                style={{ background: '#24ACB5' }}
              >
                المس سبحة إيلاف الآن
              </button>
            )}
          </div>
        )}

        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3.5">
          {mode === 'signup' && (
            <label className="block">
              <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
                الاسم الكامل
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="محمد أحمد"
                className="w-full px-4 py-3.5 rounded-2xl text-[13px] outline-none"
                style={inputStyle}
              />
            </label>
          )}

          <label className="block">
            <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
              البريد الإلكتروني
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full px-4 py-3.5 rounded-2xl text-[13px] outline-none"
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
              كلمة المرور
            </span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-2xl text-[13px] outline-none"
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {mode === 'signup' && (
            <>
              <label className="block">
                <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
                  رقم الجوال (اختياري)
                </span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full px-4 py-3.5 rounded-2xl text-[13px] outline-none"
                  style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold mb-1.5 block" style={{ color: '#3A5C64' }}>
                  المدينة (اختياري)
                </span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="الرياض"
                  className="w-full px-4 py-3.5 rounded-2xl text-[13px] outline-none"
                  style={inputStyle}
                />
              </label>
            </>
          )}

          {(error || localHint) && (
            <div
              className="px-3 py-2.5 rounded-xl text-[11px] font-semibold text-center"
              style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}
            >
              {error || localHint}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || (mode === 'signup' && !allowSignup)}
            className="mt-2 w-full py-3.5 rounded-2xl text-[14px] font-black text-white disabled:opacity-60"
            style={{
              background: '#24ACB5',
              boxShadow: '0 8px 20px rgba(36,172,181,0.28)',
            }}
          >
            {busy ? 'جارٍ التحميل…' : mode === 'login' ? 'دخول' : 'إنشاء الحساب وربط السبحة'}
          </button>
        </form>
      </div>
    </div>
  )
}
