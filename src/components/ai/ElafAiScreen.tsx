import { useEffect, useRef, useState } from 'react'
import { ELAF_AI_FAQS, type ElafAiMessage } from '../../data/elafAi'
import { askElafAi, isGeminiConfigured } from '../../services/GeminiService'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ElafAiScreen({
  onBack,
  isPro,
  onActivatePro,
}: {
  onBack: () => void
  isPro: boolean
  onActivatePro: () => void
}) {
  const [messages, setMessages] = useState<ElafAiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'السلام عليكم — أنا إيلاف AI. اسأل عن الصلاة، الأذكار، الحج، أو اختر سؤالاً شائعاً بالأسفل.',
      at: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const configured = isGeminiConfigured()

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, busy])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    if (!isPro) {
      onActivatePro()
      return
    }

    setError(null)
    const userMsg: ElafAiMessage = { id: uid(), role: 'user', text: q, at: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setBusy(true)

    const history = [...messages.filter((m) => m.id !== 'welcome'), userMsg]
    const result = await askElafAi(q, history)
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          text: `عذراً، ${result.error}`,
          at: Date.now(),
        },
      ])
      return
    }

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: 'assistant', text: result.text, at: Date.now() },
    ])
  }

  return (
    <div
      className="absolute inset-0 z-[70] flex flex-col"
      style={{ background: 'linear-gradient(180deg, #FAF8F4 0%, #F0F7F8 100%)', direction: 'rtl' }}
    >
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #E2EEF0' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#F0F4F5', color: '#133840' }}
          aria-label="رجوع"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black truncate" style={{ color: '#133840', fontFamily: 'Cairo, sans-serif' }}>
              إيلاف AI
            </h1>
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: '#D4AF37', color: '#133840' }}
            >
              PRO
            </span>
          </div>
          <p className="text-[11px]" style={{ color: '#7E9DA3' }}>
            مساعد إسلامي · أسئلة شائعة · محادثة
          </p>
        </div>
        <img
          src="/ai/elaf-ai-mascot.png"
          alt=""
          className="w-14 h-14 object-contain flex-shrink-0"
          style={{ filter: 'drop-shadow(0 4px 10px rgba(36,172,181,0.35))' }}
        />
      </div>

      {!isPro && (
        <button
          type="button"
          onClick={onActivatePro}
          className="mx-4 mt-3 px-3 py-2.5 rounded-2xl text-[11px] font-bold text-center"
          style={{ background: '#FFF8E8', color: '#92400E', border: '1px solid #FDE68A' }}
        >
          هذه ميزة PRO — المسّ سبحة إيلاف لتفعيل المساعد
        </button>
      )}

      {!configured && isPro && (
        <div
          className="mx-4 mt-3 px-3 py-2.5 rounded-2xl text-[11px] font-semibold text-center"
          style={{ background: '#EAF9FC', color: '#0E7490', border: '1px solid #CDEEF5' }}
        >
          بانتظار مفتاح Gemini — ضع VITE_GEMINI_API_KEY في ملف .env
        </div>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className="max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap"
              style={
                m.role === 'user'
                  ? {
                      background: '#24ACB5',
                      color: '#fff',
                      borderBottomRightRadius: 6,
                    }
                  : {
                      background: '#fff',
                      color: '#133840',
                      border: '1px solid #E2EEF0',
                      borderBottomLeftRadius: 6,
                    }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-end">
            <div
              className="px-3.5 py-2.5 rounded-2xl text-[12px] font-semibold"
              style={{ background: '#fff', color: '#7E9DA3', border: '1px solid #E2EEF0' }}
            >
              يفكر…
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-4 pb-2">
        <p className="text-[10px] font-bold mb-2" style={{ color: '#7E9DA3' }}>
          أسئلة شائعة
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {ELAF_AI_FAQS.map((faq) => (
            <button
              key={faq.id}
              type="button"
              disabled={busy}
              onClick={() => void send(faq.question)}
              className="flex-shrink-0 px-3 py-2 rounded-full text-[11px] font-bold whitespace-nowrap disabled:opacity-50"
              style={{
                background: '#fff',
                color: '#133840',
                border: '1px solid #CDEEF5',
              }}
            >
              {faq.question}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="px-4 pb-1 text-[10px] font-semibold text-center" style={{ color: '#B91C1C' }}>
          {error}
        </p>
      )}

      <form
        className="flex-shrink-0 flex items-end gap-2 px-4 pt-1 pb-4"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
        style={{ borderTop: '1px solid #E2EEF0', background: 'rgba(255,255,255,0.85)' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isPro ? 'اسأل إيلاف AI…' : 'فعّل PRO للسؤال'}
          disabled={busy || !isPro}
          className="flex-1 px-4 py-3 rounded-2xl text-[13px] outline-none disabled:opacity-60"
          style={{
            background: '#F7F8F9',
            border: '1px solid #E8ECEE',
            color: '#133840',
            fontFamily: 'Cairo, sans-serif',
          }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim() || !isPro}
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          style={{ background: '#24ACB5', color: '#fff' }}
          aria-label="إرسال"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
