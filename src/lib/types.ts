import type { SoundParam } from '@/lib/instrument-audio'

/* Re-export agar modul lain (mis. lib/serialize.ts) bisa mengimpor dari sini. */
export type { SoundParam }

/* ============================================================
 * WaraNusa — tipe data kontrak API & domain (sumber kebenaran
 * bersama untuk frontend dan backend).
 * ============================================================ */

/* ---------- Enum status ---------- */

/** Status publikasi objek budaya (alur CMS). */
export type ItemStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'

/** Status moderasi kontribusi: diajukan → menunggu → selesai. */
export type ContributionStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_REVISION'

/** Peran pengguna (otorisasi divalidasi di server). */
export type UserRole = 'SUPER_ADMIN' | 'EDITOR' | 'REVIEWER' | 'CONTRIBUTOR'

export const ITEM_STATUSES: ItemStatus[] = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED']
export const CONTRIBUTION_STATUSES: ContributionStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'NEEDS_REVISION',
]
export const USER_ROLES: UserRole[] = ['SUPER_ADMIN', 'EDITOR', 'REVIEWER', 'CONTRIBUTOR']

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Menunggu Tinjauan',
  PUBLISHED: 'Terpublikasi',
  REJECTED: 'Ditolak',
  ARCHIVED: 'Diarsipkan',
}

export const CONTRIBUTION_STATUS_LABEL: Record<ContributionStatus, string> = {
  SUBMITTED: 'Diajukan',
  UNDER_REVIEW: 'Menunggu Peninjauan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  NEEDS_REVISION: 'Perlu Revisi',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: 'Administrator',
  EDITOR: 'Editor',
  REVIEWER: 'Kurator',
  CONTRIBUTOR: 'Kontributor',
}

/* ---------- Kategori & sumber ---------- */

export interface ItemSource {
  id?: string
  itemId?: string
  title: string
  url?: string | null
  publisher?: string | null
  year?: string | null
  license?: string | null
  note?: string | null
  createdAt?: string
  culturalItem?: { id: string; name: string; category: string } | null
}

export type MediaType = 'IMAGE' | 'AUDIO' | 'MODEL_3D' | 'VIDEO'

export interface MediaAssetRecord {
  id: string
  itemId?: string | null
  title: string
  type: MediaType
  url: string
  mimeType?: string | null
  fileSize?: number | null
  license?: string | null
  creator?: string | null
  sourceUrl?: string | null
  caption?: string | null
  isFeatured?: boolean
  createdAt?: string
  updatedAt?: string
  culturalItem?: { id: string; name: string; category: string } | null
}

export interface ItemPart {
  id: string
  name: string
  pos: [number, number, number]
  color: string
  function: string
  philosophy: string
}

export interface CategoryMeta {
  id: string
  key: string
  label: string
  description: string
  icon: string
  image: string
  /** Jumlah item terpublikasi dalam kategori (opsional dari API). */
  itemCount?: number
}

/* ---------- Objek budaya ---------- */

export interface CulturalItemFull {
  id: string
  slug?: string | null
  provinceId: string
  /** Key kategori, mis. RUMAH_ADAT — label ditampilkan via kategori API. */
  category: string
  name: string
  region: string | null
  shortDesc: string
  description: string
  history: string | null
  culturalFunction: string | null
  philosophy: string
  imageUrl: string | null
  model3d: string | null
  parts: ItemPart[]
  playable: boolean
  sounds: SoundParam[]
  melody: string[]
  sources: ItemSource[]
  mediaAssets?: MediaAssetRecord[]
  status: ItemStatus
  /**true bila konten/sumber masih perlu diverifikasi kurator. */
  needsReview: boolean
  isDemonstration: boolean
  createdAt?: string
  updatedAt?: string
  province?: { name: string; slug: string; island: string }
}

/** Ringkasan item untuk daftar admin. */
export type AdminItemRecord = CulturalItemFull

/* ---------- Wilayah / provinsi ---------- */

export interface ProvinceSummary {
  id: string
  name: string
  slug: string
  island: string
  capital: string
  lat: number
  lng: number
  motto: string
  itemCount: number
  communityCount: number
}

export interface ProvinceFull {
  id: string
  name: string
  slug: string
  island: string
  capital: string
  lat: number
  lng: number
  motto: string
  description: string
  history: string
  traditions: string
  items: CulturalItemFull[]
  contributions: ContributionRecord[]
}

/* ---------- Kontribusi & moderasi ---------- */

export interface ModerationReviewRecord {
  id: string
  action: string
  note: string | null
  createdAt: string
  reviewer?: { id: string; name: string } | null
}

export interface ContributionRecord {
  id: string
  provinceId: string | null
  category: string
  title: string
  content: string
  contributorName: string
  sourceRef: string | null
  status: ContributionStatus
  /** Catatan kurator manusia. */
  reviewNote: string | null
  /** Catatan kurasi otomatis (AI) — bukan keputusan akhir. */
  aiNote: string | null
  /** Item budaya yang dibuat bila kontribusi disetujui & dipublikasikan. */
  createdItemId: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt?: string
  province?: { name: string; slug: string } | null
  user?: { id: string; name: string; email: string } | null
  reviews?: ModerationReviewRecord[]
}

/* ---------- Autentikasi ---------- */

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
}

/* ---------- Statistik publik ---------- */

export interface Stats {
  provinces: number
  items: number
  playable: number
  approved: number
  pending: number
}

/* ---------- Admin ---------- */

export interface AdminRecentItem {
  id: string
  name: string
  status: ItemStatus
  category: string
  provinceName: string
  updatedAt: string
}

export interface AdminStats {
  items: {
    total: number
    published: number
    draft: number
    pendingReview: number
    archived: number
    playable: number
    models3d: number
  }
  provinces: number
  categories: number
  users: number
  contributions: {
    total: number
    submitted: number
    underReview: number
    approved: number
    rejected: number
    needsRevision: number
  }
  recentContributions: ContributionRecord[]
  recentItems: AdminRecentItem[]
}

export interface AdminUserRecord {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  contributionCount: number
}
