export type MushafPaperTheme = 'white' | 'cream' | 'dark' | 'emerald'

export type MushafBookmark = {
  page: number
  surahName: string
  surahNumber?: number
  updatedAt: string
}

const MUSHAF_THEME_KEY = 'elaf-mushaf-theme'
const MUSHAF_BOOKMARK_KEY = 'elaf-mushaf-bookmark'
const WIRD_DONE_KEY = 'elaf-wird-done'

export function loadMushafTheme(): MushafPaperTheme {
  try {
    const v = localStorage.getItem(MUSHAF_THEME_KEY)
    if (v === 'cream' || v === 'dark' || v === 'emerald' || v === 'white') return v
  } catch {
    /* ignore */
  }
  return 'white'
}

export function saveMushafTheme(theme: MushafPaperTheme) {
  localStorage.setItem(MUSHAF_THEME_KEY, theme)
  window.dispatchEvent(new CustomEvent('elaf-mushaf-theme', { detail: theme }))
}

export function loadMushafBookmark(): MushafBookmark | null {
  try {
    const raw = localStorage.getItem(MUSHAF_BOOKMARK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MushafBookmark
    if (!parsed?.page || parsed.page < 1 || parsed.page > 604) return null
    return parsed
  } catch {
    return null
  }
}

export function saveMushafBookmark(bookmark: Omit<MushafBookmark, 'updatedAt'> & { updatedAt?: string }) {
  const next: MushafBookmark = {
    page: Math.min(604, Math.max(1, Math.round(bookmark.page))),
    surahName: bookmark.surahName || '…',
    surahNumber: bookmark.surahNumber,
    updatedAt: bookmark.updatedAt || new Date().toISOString(),
  }
  localStorage.setItem(MUSHAF_BOOKMARK_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('elaf-mushaf-bookmark', { detail: next }))
  return next
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** الورد القراني — daily completion for متابعة يومك */
export function loadWirdDoneToday(): boolean {
  try {
    return localStorage.getItem(WIRD_DONE_KEY) === todayKey()
  } catch {
    return false
  }
}

export function setWirdDoneToday(done: boolean) {
  try {
    if (done) localStorage.setItem(WIRD_DONE_KEY, todayKey())
    else localStorage.removeItem(WIRD_DONE_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('elaf-wird-done', { detail: done }))
}
