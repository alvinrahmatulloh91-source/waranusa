/**
 * Serializer baris Prisma → bentuk kontrak API (src/lib/types.ts).
 * Dipakai bersama oleh route publik & admin agar bentuk respons konsisten.
 */
import type {
  ContributionRecord,
  ContributionStatus,
  CulturalItemFull,
  ItemPart,
  ItemSource,
  ItemStatus,
  ModerationReviewRecord,
  SoundParam,
  UserRole,
} from '@/lib/types'

/** Parse kolom JSON (String) dengan fallback aman. */
export function parseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export interface SourceRowLike {
  id: string
  title: string
  url: string | null
  publisher: string | null
  year: string | null
  license: string | null
  note: string | null
}

export interface MediaAssetRowLike {
  id: string
  itemId?: string | null
  title: string
  type: string
  url: string
  mimeType?: string | null
  fileSize?: number | null
  license?: string | null
  creator?: string | null
  sourceUrl?: string | null
  caption?: string | null
  isFeatured?: boolean
  createdAt?: Date
  updatedAt?: Date
  culturalItem?: { id: string; name: string; category: string } | null
}

export function mapMediaAsset(m: MediaAssetRowLike) {
  return {
    id: m.id,
    itemId: m.itemId ?? null,
    title: m.title,
    type: m.type as any,
    url: m.url,
    mimeType: m.mimeType ?? null,
    fileSize: m.fileSize ?? null,
    license: m.license ?? null,
    creator: m.creator ?? null,
    sourceUrl: m.sourceUrl ?? null,
    caption: m.caption ?? null,
    isFeatured: !!m.isFeatured,
    createdAt: m.createdAt ? m.createdAt.toISOString() : undefined,
    updatedAt: m.updatedAt ? m.updatedAt.toISOString() : undefined,
    culturalItem: m.culturalItem ?? null,
  }
}

interface ItemRowLike {
  id: string
  provinceId: string
  category: string
  name: string
  region: string | null
  shortDesc: string
  description: string
  philosophy: string
  imageUrl: string | null
  model3d: string | null
  parts: string | null
  playable: boolean
  sounds: string | null
  melody: string | null
  status: string
  needsReview: boolean
  createdAt: Date
  updatedAt: Date
  sources: SourceRowLike[]
  mediaAssets?: MediaAssetRowLike[]
  province?: { name: string; slug: string; island: string } | null
}

/** Baris CulturalItem (+sources/province/mediaAssets) → CulturalItemFull (kolom JSON sudah di-parse). */
export function mapItem(item: ItemRowLike): CulturalItemFull {
  return {
    id: item.id,
    provinceId: item.provinceId,
    category: item.category,
    name: item.name,
    region: item.region,
    shortDesc: item.shortDesc,
    description: item.description,
    philosophy: item.philosophy,
    imageUrl: item.imageUrl,
    model3d: item.model3d,
    parts: parseJSON<ItemPart[]>(item.parts, []),
    playable: item.playable,
    sounds: parseJSON<SoundParam[]>(item.sounds, []),
    melody: parseJSON<string[]>(item.melody, []),
    sources: (item.sources ?? []).map((s): ItemSource => ({
      id: s.id,
      title: s.title,
      url: s.url,
      publisher: s.publisher,
      year: s.year,
      license: s.license,
      note: s.note,
    })),
    mediaAssets: item.mediaAssets ? item.mediaAssets.map(mapMediaAsset) : undefined,
    status: item.status as ItemStatus,
    needsReview: item.needsReview,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    province: item.province ?? undefined,
  }
}

interface ReviewRowLike {
  id: string
  action: string
  note: string | null
  createdAt: Date
  reviewer?: { id: string; name: string } | null
}

interface ContributionRowLike {
  id: string
  provinceId: string | null
  category: string
  title: string
  content: string
  contributorName: string
  sourceRef: string | null
  status: string
  reviewNote: string | null
  aiNote: string | null
  createdItemId: string | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
  province?: { name: string; slug: string } | null
  user?: { id: string; name: string; email: string } | null
  reviews?: ReviewRowLike[]
}

export function mapReview(r: ReviewRowLike): ModerationReviewRecord {
  return {
    id: r.id,
    action: r.action,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    reviewer: r.reviewer ? { id: r.reviewer.id, name: r.reviewer.name } : null,
  }
}

/** Baris Contribution (+province/user/reviews) → ContributionRecord. */
export function mapContribution(c: ContributionRowLike): ContributionRecord {
  return {
    id: c.id,
    provinceId: c.provinceId,
    category: c.category,
    title: c.title,
    content: c.content,
    contributorName: c.contributorName,
    sourceRef: c.sourceRef,
    status: c.status as ContributionStatus,
    reviewNote: c.reviewNote,
    aiNote: c.aiNote,
    createdItemId: c.createdItemId,
    reviewedAt: c.reviewedAt ? c.reviewedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    province: c.province ?? null,
    user: c.user ?? null,
    reviews: c.reviews ? c.reviews.map(mapReview) : undefined,
  }
}

/** Ubah nama menjadi slug URL: lowercase, non-alfanumerik → tanda hubung. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Nilai peran yang valid (impor USER_ROLES menyulitkan bundling server di beberapa kasus). */
export function asRole(value: string): UserRole | null {
  return ['SUPER_ADMIN', 'EDITOR', 'REVIEWER', 'CONTRIBUTOR'].includes(value)
    ? (value as UserRole)
    : null
}
