/**
 * تسميع — listen to the user recite ayahs and score against targets.
 * Uses Web Speech API (works in Chrome / Android WebView).
 */

export type TasmeeStatus =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'correct'
  | 'incorrect'
  | 'complete'
  | 'unsupported'
  | 'denied'
  | 'error'

type SpeechRec = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string; confidence: number }
    length: number
  }>
}

export type TasmeeAyahTarget = {
  number: number
  text: string
}

function getSpeechRecognitionCtor(): (new () => SpeechRec) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec
    webkitSpeechRecognition?: new () => SpeechRec
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

/** Strip tashkeel / normalize Arabic for ASR comparison */
export function normalizeArabic(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '') // harakat + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^؀-ۿ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Word-overlap score 0..1 between spoken transcript and target ayah */
export function scoreRecitation(spoken: string, target: string): number {
  const a = normalizeArabic(spoken)
  const b = normalizeArabic(target)
  if (!a || !b) return 0

  // Direct containment (short ayahs)
  if (b.includes(a) && a.length >= Math.min(8, b.length * 0.5)) return 0.85
  if (a.includes(b) && b.length >= 6) return 0.95

  const aw = a.split(' ').filter((w) => w.length > 1)
  const bw = b.split(' ').filter((w) => w.length > 1)
  if (!bw.length) return 0

  let hits = 0
  const used = new Set<number>()
  for (const word of aw) {
    const idx = bw.findIndex((t, i) => !used.has(i) && (t === word || t.includes(word) || word.includes(t)))
    if (idx >= 0) {
      used.add(idx)
      hits += 1
    }
  }
  return hits / bw.length
}

function wordCount(text: string): number {
  return normalizeArabic(text)
    .split(' ')
    .filter((w) => w.length > 1).length
}

/**
 * Decide if spoken text matches current ayah, is still partial, or is clearly wrong.
 */
export function judgeAyah(
  spoken: string,
  target: string,
  threshold = 0.5
): 'correct' | 'partial' | 'wrong' {
  const score = scoreRecitation(spoken, target)
  if (score >= threshold) return 'correct'

  const spokenWords = wordCount(spoken)
  const targetWords = Math.max(1, wordCount(target))
  // Need enough spoken content before declaring خطأ
  const enoughToJudge = spokenWords >= Math.max(2, Math.ceil(targetWords * 0.55))
  if (enoughToJudge && score < 0.32) return 'wrong'
  return 'partial'
}

export function isSpeechRecognitionSupported(): boolean {
  return !!getSpeechRecognitionCtor()
}

export async function requestMicrophoneAccess(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return isSpeechRecognitionSupported()
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    return true
  } catch {
    return false
  }
}

export type TasmeeSession = {
  stop: () => void
}

/**
 * Single-ayah listen (legacy helper).
 */
export function startTasmee(opts: {
  targetText: string
  onStatus: (status: TasmeeStatus, detail?: { transcript?: string; score?: number }) => void
  threshold?: number
}): TasmeeSession {
  return startPageTasmee({
    ayahs: [{ number: 0, text: opts.targetText }],
    threshold: opts.threshold,
    onStatus: opts.onStatus,
    onAyahCorrect: () => undefined,
  })
}

/**
 * Page تسميع: listen continuously, reveal ayahs one-by-one when correct,
 * stop immediately with incorrect when a clear mismatch is detected.
 */
export function startPageTasmee(opts: {
  ayahs: TasmeeAyahTarget[]
  onStatus: (
    status: TasmeeStatus,
    detail?: { transcript?: string; score?: number; ayahNumber?: number; index?: number }
  ) => void
  onAyahCorrect: (ayah: TasmeeAyahTarget, index: number) => void
  /** Minimum overlap to count as صحيح (default 0.5) */
  threshold?: number
  startIndex?: number
}): TasmeeSession {
  const Ctor = getSpeechRecognitionCtor()
  const threshold = opts.threshold ?? 0.5
  const ayahs = opts.ayahs
  let index = Math.max(0, opts.startIndex ?? 0)
  let stopped = false
  let rec: SpeechRec | null = null
  let buffer = ''
  let restarting = false

  const emit = (
    status: TasmeeStatus,
    detail?: { transcript?: string; score?: number; ayahNumber?: number; index?: number }
  ) => {
    if (stopped && status === 'listening') return
    opts.onStatus(status, detail)
  }

  const halt = (status: TasmeeStatus, detail?: { transcript?: string; score?: number }) => {
    if (stopped) return
    stopped = true
    try {
      rec?.abort()
    } catch {
      try {
        rec?.stop()
      } catch {
        /* ignore */
      }
    }
    const cur = ayahs[index]
    emit(status, {
      ...detail,
      ayahNumber: cur?.number,
      index,
    })
  }

  const advanceFromBuffer = () => {
    while (index < ayahs.length) {
      const cur = ayahs[index]
      const verdict = judgeAyah(buffer, cur.text, threshold)
      if (verdict !== 'correct') {
        if (verdict === 'wrong') {
          halt('incorrect', {
            transcript: buffer,
            score: scoreRecitation(buffer, cur.text),
          })
        }
        return
      }
      const score = scoreRecitation(buffer, cur.text)
      opts.onAyahCorrect(cur, index)
      emit('correct', {
        transcript: buffer,
        score,
        ayahNumber: cur.number,
        index,
      })
      // Drop matched words roughly from buffer so leftovers can match next ayah
      const targetWords = wordCount(cur.text)
      const parts = normalizeArabic(buffer).split(' ').filter(Boolean)
      buffer = parts.slice(Math.min(parts.length, Math.max(targetWords, 1))).join(' ')
      index += 1
      if (index >= ayahs.length) {
        halt('complete', { transcript: buffer })
        return
      }
      emit('listening', {
        transcript: buffer,
        ayahNumber: ayahs[index].number,
        index,
      })
    }
  }

  if (!Ctor) {
    emit('unsupported')
    return { stop: () => undefined }
  }

  if (!ayahs.length || index >= ayahs.length) {
    emit('error')
    return { stop: () => undefined }
  }

  rec = new Ctor()
  rec.lang = 'ar-SA'
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 3

  rec.onstart = () => {
    if (!stopped) {
      emit('listening', {
        ayahNumber: ayahs[index]?.number,
        index,
      })
    }
  }

  rec.onresult = (event) => {
    if (stopped) return
    let interim = ''
    let finals = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i]
      const t = r[0]?.transcript || ''
      if (r.isFinal) finals += `${t} `
      else interim += t
    }
    if (finals.trim()) {
      buffer = `${buffer} ${finals}`.replace(/\s+/g, ' ').trim()
      advanceFromBuffer()
      if (stopped) return
    }
    const live = (buffer || interim).trim()
    if (live) {
      emit('listening', {
        transcript: live,
        ayahNumber: ayahs[index]?.number,
        index,
      })
      // Soft check on interim+buffer for early wrong detection
      if (!finals.trim() && interim) {
        const soft = judgeAyah(`${buffer} ${interim}`, ayahs[index].text, threshold)
        if (soft === 'wrong') {
          halt('incorrect', {
            transcript: `${buffer} ${interim}`.trim(),
            score: scoreRecitation(`${buffer} ${interim}`, ayahs[index].text),
          })
        } else if (soft === 'correct') {
          buffer = `${buffer} ${interim}`.replace(/\s+/g, ' ').trim()
          advanceFromBuffer()
        }
      }
    }
  }

  rec.onerror = (ev) => {
    if (stopped) return
    if (ev.error === 'no-speech' || ev.error === 'aborted') {
      // Keep session alive for continuous mode (no-speech is common between ayahs)
      return
    }
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
      halt('denied')
      return
    }
    halt('error')
  }

  rec.onend = () => {
    if (stopped) return
    // Android WebView often ends recognition — restart while session active
    restarting = true
    window.setTimeout(() => {
      restarting = false
      if (stopped || !rec) return
      try {
        rec.start()
      } catch {
        /* ignore brief restart races */
      }
    }, 180)
  }

  try {
    emit('requesting', { ayahNumber: ayahs[index].number, index })
    rec.start()
  } catch {
    emit('error')
  }

  return {
    stop: () => {
      if (stopped) return
      stopped = true
      try {
        rec?.abort()
      } catch {
        try {
          rec?.stop()
        } catch {
          /* ignore */
        }
      }
      if (!restarting) emit('idle')
    },
  }
}

/**
 * Pull repeated dhikr phrases out of a rolling ASR buffer.
 * Returns how many times the target was heard and leftover text.
 */
export function extractDhikrMatches(
  spoken: string,
  target: string,
  threshold = 0.72
): { matches: number; remainder: string } {
  let rem = normalizeArabic(spoken)
  const needle = normalizeArabic(target)
  if (!rem || !needle) return { matches: 0, remainder: rem }

  const targetWords = needle.split(' ').filter((w) => w.length > 0)
  let matches = 0
  let guard = 0

  while (rem.length >= Math.min(needle.length, 3) && guard++ < 40) {
    if (rem.includes(needle)) {
      matches += 1
      rem = rem.replace(needle, ' ').replace(/\s+/g, ' ').trim()
      continue
    }

    const remWords = rem.split(' ').filter(Boolean)
    if (remWords.length < Math.max(1, Math.ceil(targetWords.length * 0.6))) break

    const takeN = Math.max(targetWords.length, 1)
    const take = remWords.slice(0, takeN).join(' ')
    if (scoreRecitation(take, needle) >= threshold) {
      matches += 1
      rem = remWords.slice(takeN).join(' ')
      continue
    }

    // Drop leading noise word and retry (avoid stuck buffers)
    if (remWords.length > takeN + 1) {
      rem = remWords.slice(1).join(' ')
      continue
    }
    break
  }

  return { matches, remainder: rem }
}

/**
 * Continuous dhikr listen: each spoken match of `targetText` fires `onMatch`.
 * Does not stop on mismatch — keeps listening for the next repetition.
 */
export function startDhikrListen(opts: {
  targetText: string
  onMatch: (detail: { transcript: string; score: number }) => void
  onStatus: (status: TasmeeStatus, detail?: { transcript?: string; score?: number }) => void
  threshold?: number
  /** Min ms between counted matches (default 420) */
  matchCooldownMs?: number
}): TasmeeSession {
  const Ctor = getSpeechRecognitionCtor()
  const threshold = opts.threshold ?? 0.72
  const cooldown = opts.matchCooldownMs ?? 420
  let stopped = false
  let rec: SpeechRec | null = null
  let buffer = ''
  let restarting = false
  let lastMatchAt = 0

  const emit = (
    status: TasmeeStatus,
    detail?: { transcript?: string; score?: number }
  ) => {
    if (stopped && status === 'listening') return
    opts.onStatus(status, detail)
  }

  const consume = (chunk: string) => {
    if (!chunk.trim()) return
    buffer = `${buffer} ${chunk}`.replace(/\s+/g, ' ').trim()
    const { matches, remainder } = extractDhikrMatches(buffer, opts.targetText, threshold)
    buffer = remainder

    const now = Date.now()
    if (matches > 0) {
      // Interim + final often fire twice for the same phrase
      if (!(matches === 1 && now - lastMatchAt < cooldown)) {
        lastMatchAt = now
        for (let i = 0; i < matches; i++) {
          emit('correct', { transcript: opts.targetText, score: 1 })
          opts.onMatch({ transcript: opts.targetText, score: 1 })
        }
      }
    }

    emit('listening', { transcript: buffer || chunk })
  }

  if (!Ctor) {
    emit('unsupported')
    return { stop: () => undefined }
  }

  if (!normalizeArabic(opts.targetText)) {
    emit('error')
    return { stop: () => undefined }
  }

  rec = new Ctor()
  rec.lang = 'ar-SA'
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 3

  rec.onstart = () => {
    if (!stopped) emit('listening')
  }

  rec.onresult = (event) => {
    if (stopped) return
    let interim = ''
    let finals = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i]
      const t = r[0]?.transcript || ''
      if (r.isFinal) finals += `${t} `
      else interim += t
    }
    if (finals.trim()) consume(finals)
    else if (interim.trim()) {
      // Soft match on interim so short phrases count without waiting for final
      const probe = `${buffer} ${interim}`.replace(/\s+/g, ' ').trim()
      const { matches } = extractDhikrMatches(probe, opts.targetText, threshold)
      if (matches > 0) consume(interim)
      else emit('listening', { transcript: probe })
    }
  }

  rec.onerror = (ev) => {
    if (stopped) return
    if (ev.error === 'no-speech' || ev.error === 'aborted') return
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
      stopped = true
      emit('denied')
      return
    }
    // Network / transient — keep session; onend will restart
  }

  rec.onend = () => {
    if (stopped) return
    restarting = true
    window.setTimeout(() => {
      restarting = false
      if (stopped || !rec) return
      try {
        rec.start()
      } catch {
        /* ignore */
      }
    }, 180)
  }

  try {
    emit('requesting')
    rec.start()
  } catch {
    emit('error')
  }

  return {
    stop: () => {
      if (stopped) return
      stopped = true
      try {
        rec?.abort()
      } catch {
        try {
          rec?.stop()
        } catch {
          /* ignore */
        }
      }
      if (!restarting) emit('idle')
    },
  }
}
