/**
 * Azkar dataset from https://github.com/osamayy/azkar-db
 * Source: azkar.json (SQLite export) — category, zekr, description, count, reference
 */
import rawAzkar from './azkarDb.json'
import rawCategories from './azkarCategories.json'

export type AzkarDbItem = {
  category: string
  text: string
  description: string
  reference: string
  total: number
}

export type AthkarItem = {
  text: string
  count: number
  total: number
  audioKey: string
  description?: string
  reference?: string
}

export type AthkarCategoryMeta = {
  id: string
  label: string
  count: number
}

const items = rawAzkar as AzkarDbItem[]
const categories = rawCategories as AthkarCategoryMeta[]

export const AZKAR_CATEGORIES: AthkarCategoryMeta[] = categories

/** Build fresh progress state for all categories (count starts at 0). */
export function buildAthkarData(): Record<string, AthkarItem[]> {
  const map: Record<string, AthkarItem[]> = {}
  for (const cat of AZKAR_CATEGORIES) {
    map[cat.id] = []
  }
  for (const row of items) {
    const list = map[row.category] ?? (map[row.category] = [])
    const idx = list.length
    list.push({
      text: row.text,
      count: 0,
      total: Math.max(1, row.total || 1),
      audioKey: `db-${slug(row.category)}-${idx}`,
      description: row.description || undefined,
      reference: row.reference || undefined,
    })
  }
  return map
}

export const DEFAULT_ATHKAR_CATEGORY =
  AZKAR_CATEGORIES.find((c) => c.id === 'أذكار الصباح')?.id ??
  AZKAR_CATEGORIES[0]?.id ??
  ''

function slug(s: string): string {
  return s
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
    .slice(0, 40)
}
