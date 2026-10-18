/**
 * WaraNusa — Konstanta & Kaidah domain
 * Sumber kebenaran untuk status, role, tipe media, dan batasan upload.
 * (Pada SQLite Prisma, enum tidak didukung — nilai divalidasi dari konstanta ini.)
 */

export const ROLES = ["SUPER_ADMIN", "EDITOR", "REVIEWER", "CONTRIBUTOR"] as const;
export type Role = (typeof ROLES)[number];

export const ITEM_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const CONTRIBUTION_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_REVISION",
  "APPROVED",
  "REJECTED",
] as const;
export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];

export const MEDIA_TYPES = ["IMAGE", "AUDIO", "MODEL_3D", "TEXTURE", "THUMBNAIL"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_STATUSES = ["ACTIVE", "ARCHIVED"] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const SOURCE_TYPES = ["BOOK", "JOURNAL", "WEBSITE", "MUSEUM", "ARCHIVE", "OTHER"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const ISLAND_GROUPS = [
  "SUMATERA",
  "JAWA",
  "BALI_NUSA_TENGGARA",
  "KALIMANTAN",
  "SULAWESI",
  "MALUKU_PAPUA",
] as const;
export type IslandGroup = (typeof ISLAND_GROUPS)[number];

export const MODERATION_ACTIONS = [
  "SUBMIT",
  "START_REVIEW",
  "REQUEST_REVISION",
  "APPROVE",
  "REJECT",
] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

/** Batas ukuran file per tipe media (bytes) */
export const MAX_UPLOAD_BYTES: Record<MediaType, number> = {
  IMAGE: 5 * 1024 * 1024, // 5 MB
  AUDIO: 15 * 1024 * 1024, // 15 MB
  MODEL_3D: 30 * 1024 * 1024, // 30 MB
  TEXTURE: 8 * 1024 * 1024, // 8 MB
  THUMBNAIL: 2 * 1024 * 1024, // 2 MB
};

export const MAX_PAGE_SIZE = 48;
export const DEFAULT_PAGE_SIZE = 12;

/** Model 3D prosedural yang didukung viewer (fallback bila aset GLB belum ada) */
export const PROCEDURAL_MODELS = ["rumah-gadang", "joglo", "saron", "generic"] as const;
export type ProceduralModelKey = (typeof PROCEDURAL_MODELS)[number];

export const SESSION_COOKIE = "waranusa_session";
export const SESSION_TTL_DAYS = 7;

export function labelRole(r: string): string {
  return { SUPER_ADMIN: "Super Admin", EDITOR: "Editor", REVIEWER: "Reviewer", CONTRIBUTOR: "Kontributor" }[r] ?? r;
}
export function labelItemStatus(s: string): string {
  return { DRAFT: "Draft", PUBLISHED: "Terpublikasi", ARCHIVED: "Arsip" }[s] ?? s;
}
export function labelContributionStatus(s: string): string {
  return {
    SUBMITTED: "Diajukan",
    IN_REVIEW: "Menunggu Peninjauan",
    NEEDS_REVISION: "Perlu Revisi",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    DRAFT: "Draft",
  }[s] ?? s;
}
export function labelMediaType(t: string): string {
  return { IMAGE: "Gambar", AUDIO: "Audio", MODEL_3D: "Model 3D", TEXTURE: "Tekstur", THUMBNAIL: "Thumbnail" }[t] ?? t;
}
export function labelSourceType(t: string): string {
  return { BOOK: "Buku", JOURNAL: "Jurnal", WEBSITE: "Situs Web", MUSEUM: "Museum", ARCHIVE: "Arsip", OTHER: "Lainnya" }[t] ?? t;
}
