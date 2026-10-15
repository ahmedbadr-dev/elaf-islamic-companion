import { ELAF_AI_SYSTEM_PROMPT, type ElafAiMessage } from '../data/elafAi'

const MODEL = 'gemini-2.5-flash'

function getApiKey(): string {
  const key = (import.meta as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || ''
  return key.trim()
}

export function isGeminiConfigured(): boolean {
  return getApiKey().length > 10
}

type GeminiPart = { text?: string }
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] }

function toGeminiHistory(messages: ElafAiMessage[]): GeminiContent[] {
  return messages
    .filter((m) => m.text.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.text }],
    }))
}

export async function askElafAi(
  question: string,
  history: ElafAiMessage[] = []
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return {
      ok: false,
      error: 'مفتاح Gemini غير مضبوط بعد — أضف VITE_GEMINI_API_KEY ثم أعد البناء',
    }
  }

  const q = question.trim()
  if (!q) return { ok: false, error: 'اكتب سؤالك أولاً' }

  const contents = [...toGeminiHistory(history.slice(-12)), { role: 'user' as const, parts: [{ text: q }] }]

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: ELAF_AI_SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      if (res.status === 400 || res.status === 403) {
        return { ok: false, error: 'مفتاح API غير صالح أو مرفوض — تحقق من مفتاح Gemini' }
      }
      if (res.status === 429) {
        return { ok: false, error: 'تم تجاوز حد الطلبات — حاول بعد لحظات' }
      }
      console.warn('[ElafAI] Gemini error', res.status, body.slice(0, 200))
      return { ok: false, error: `تعذّر الاتصال بالمساعد (${res.status})` }
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('')?.trim()
    if (!text) return { ok: false, error: 'لم يُرجع المساعد رداً — أعد المحاولة' }
    return { ok: true, text }
  } catch (err) {
    console.warn('[ElafAI] network', err)
    return { ok: false, error: 'تحقق من الاتصال بالإنترنت ثم أعد المحاولة' }
  }
}
