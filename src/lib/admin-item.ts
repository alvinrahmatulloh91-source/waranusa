/**
 * Parsing & validasi body untuk POST/PATCH item admin (whitelist eksplisit —
 * anti mass-assignment). Kolom JSON (parts/sounds/melody) di-stringify bila
 * penerima berupa array; tipe lain diabaikan.
 */
import { ITEM_STATUSES } from '@/lib/types'

export interface SourceInput {
  title: string
  url: string | null
  publisher: string | null
  year: string | null
  license: string | null
  note: string | null
}

export interface ParsedItemFields {
  name?: string
  region?: string | null
  shortDesc?: string
  description?: string
  philosophy?: string
  imageUrl?: string | null
  model3d?: string | null
  playable?: boolean
  parts?: string | null
  sounds?: string | null
  melody?: string | null
  status?: string
  needsReview?: boolean
  category?: string
  provinceId?: string
  sources?: SourceInput[]
}

/** Status yang diperbolehkan saat MEMBUAT item baru. */
export const ITEM_CREATE_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED']

function asTrimmed(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** string → trimmed (kosong → null), non-string → undefined (abaikan). */
function optionalText(v: unknown): string | null | undefined {
  if (v === null) return null
  if (typeof v === 'string') {
    const t = v.trim()
    return t === '' ? null : t
  }
  return undefined
}

/** array → JSON string, null → null, lainnya → undefined (abaikan). */
function jsonColumn(v: unknown): string | null | undefined {
  if (Array.isArray(v)) return JSON.stringify(v)
  if (v === null) return null
  return undefined
}

function parseSources(raw: unknown): { error?: string; sources?: SourceInput[] } {
  if (!Array.isArray(raw)) return { error: 'Sumber harus berupa daftar (array).' }
  const sources: SourceInput[] = []
  for (const s of raw) {
    const row = (s ?? {}) as Record<string, unknown>
    const title = asTrimmed(row.title)
    if (!title) return { error: 'Setiap sumber harus memiliki judul.' }
    sources.push({
      title: title.slice(0, 200),
      url: optionalText(row.url) ?? null,
      publisher: optionalText(row.publisher) ?? null,
      year: optionalText(row.year) ?? null,
      license: optionalText(row.license) ?? null,
      note: optionalText(row.note) ?? null,
    })
  }
  return { sources }
}

/**
 * Ekstrak field item dari body.
 * @param partial false = wajib lengkap (POST), true = hanya field yang dikirim (PATCH).
 */
export function parseItemBody(
  body: Record<string, unknown>,
  partial: boolean,
): { error?: string; fields?: ParsedItemFields } {
  const fields: ParsedItemFields = {}

  if ('name' in body || !partial) {
    const name = asTrimmed(body.name)
    if (name.length < 3 || name.length > 120) {
      return { error: 'Nama item harus 3-120 karakter.' }
    }
    fields.name = name
  }
  if ('region' in body) {
    const region = optionalText(body.region)
    if (region !== undefined) fields.region = region
  }
  if ('shortDesc' in body || !partial) {
    const shortDesc = asTrimmed(body.shortDesc)
    if (shortDesc.length < 10 || shortDesc.length > 200) {
      return { error: 'Deskripsi singkat harus 10-200 karakter.' }
    }
    fields.shortDesc = shortDesc
  }
  if ('description' in body || !partial) {
    const description = asTrimmed(body.description)
    if (description.length < 20 || description.length > 5000) {
      return { error: 'Deskripsi lengkap minimal 20 karakter (maks 5000).' }
    }
    fields.description = description
  }
  if ('philosophy' in body || !partial) {
    const philosophy = asTrimmed(body.philosophy)
    if (!philosophy) return { error: 'Filosofi wajib diisi.' }
    fields.philosophy = philosophy
  }
  if ('imageUrl' in body) {
    const imageUrl = optionalText(body.imageUrl)
    if (imageUrl !== undefined) fields.imageUrl = imageUrl
  }
  if ('model3d' in body) {
    const model3d = optionalText(body.model3d)
    if (model3d !== undefined) fields.model3d = model3d
  }
  if ('playable' in body) {
    if (typeof body.playable !== 'boolean') return { error: 'Playable harus berupa boolean.' }
    fields.playable = body.playable
  } else if (!partial) {
    fields.playable = false
  }
  if ('parts' in body) {
    const parts = jsonColumn(body.parts)
    if (parts !== undefined) fields.parts = parts
  }
  if ('sounds' in body) {
    const sounds = jsonColumn(body.sounds)
    if (sounds !== undefined) fields.sounds = sounds
  }
  if ('melody' in body) {
    const melody = jsonColumn(body.melody)
    if (melody !== undefined) fields.melody = melody
  }
  if ('category' in body || !partial) {
    const category = asTrimmed(body.category)
    if (!category) return { error: 'Kategori wajib dipilih.' }
    fields.category = category
  }
  if ('provinceId' in body || !partial) {
    const provinceId = asTrimmed(body.provinceId)
    if (!provinceId) return { error: 'Provinsi wajib dipilih.' }
    fields.provinceId = provinceId
  }
  if ('status' in body || !partial) {
    const status = asTrimmed(body.status) || (partial ? undefined : 'DRAFT')
    if (status) {
      const allowed = partial ? ITEM_STATUSES : ITEM_CREATE_STATUSES
      if (!allowed.includes(status as (typeof allowed)[number])) {
        return {
          error: partial
            ? 'Status item tidak valid.'
            : 'Status item baru harus DRAFT, PENDING_REVIEW, atau PUBLISHED.',
        }
      }
      fields.status = status
    }
  }
  if ('needsReview' in body) {
    if (typeof body.needsReview !== 'boolean') return { error: 'NeedsReview harus berupa boolean.' }
    fields.needsReview = body.needsReview
  } else if (!partial) {
    fields.needsReview = false
  }
  if ('sources' in body) {
    const parsed = parseSources(body.sources)
    if (parsed.error) return { error: parsed.error }
    fields.sources = parsed.sources
  }

  return { fields }
}
