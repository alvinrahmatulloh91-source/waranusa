/**
 * WaraNusa — Kontrak Tipe API (sumber kebenaran frontend & backend)
 * Semua endpoint mengembalikan bentuk ApiOk<T> / ApiErr yang konsisten.
 */
import type {
  ContributionStatus,
  ItemStatus,
  MediaType,
  Role,
  SourceType,
} from "./constants";

// ---------- Bentuk respons standar ----------
export interface ApiOk<T> {
  data: T;
  meta?: PageMeta;
}
export interface ApiErr {
  error: { message: string; code?: string; fields?: Record<string, string> };
}
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---------- Entitas ----------
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Region {
  id: string;
  code: string;
  name: string;
  islandGroup: string;
  capital?: string | null;
  summary: string;
  description?: string | null;
  lat: number;
  lng: number;
  itemCount?: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  itemCount?: number;
}

export interface Source {
  id: string;
  itemId?: string | null;
  title: string;
  creator?: string | null;
  url?: string | null;
  sourceType: SourceType;
  accessDate?: string | null;
  attribution?: string | null;
  license?: string | null;
  verificationNote?: string | null;
  createdAt?: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  description?: string | null;
  type: MediaType;
  format: string;
  mimeType: string;
  size: number;
  /** Null untuk aset embed eksternal (mis. Sketchfab) */
  storagePath: string | null;
  /** URL embed eksternal (hanya MODEL_3D embed, mis. Sketchfab) */
  embedUrl?: string | null;
  /** URL siap pakai (static untuk seed, API route untuk upload, embed URL untuk aset embed) */
  url: string;
  license?: string | null;
  attribution?: string | null;
  status: "ACTIVE" | "ARCHIVED";
  uploader?: { id: string; name: string } | null;
  usageCount: number;
  usedBy?: { itemId: string; itemTitle: string; role: string }[];
  createdAt: string;
}

export interface Hotspot {
  id: string;
  itemId: string;
  title: string;
  description: string;
  x: number;
  y: number;
  z: number;
  published: boolean;
}

export interface CulturalItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  history?: string | null;
  meaning?: string | null;
  status: ItemStatus;
  featured: boolean;
  viewCount: number;
  attribution?: string | null;
  license?: string | null;
  category: Category;
  region: Region;
  coverMedia?: MediaAsset | null;
  modelMedia?: MediaAsset | null;
  audioMedia?: MediaAsset | null;
  gallery?: MediaAsset[];
  sources?: Source[];
  hotspots?: Hotspot[];
  contributionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contribution {
  id: string;
  refCode: string;
  title: string;
  regionId?: string | null;
  region?: Region | null;
  categorySlug: string;
  description: string;
  sourceRef?: string | null;
  submitterName: string;
  submitterEmail: string;
  status: ContributionStatus;
  createdAt: string;
  updatedAt: string;
  reviews?: ModerationReview[];
}

export interface ModerationReview {
  id: string;
  action: string;
  note?: string | null;
  createdAt: string;
  reviewer?: { id: string; name: string; role: string };
}

export interface ActivityEntry {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  detail?: string | null;
  createdAt: string;
  user?: { id: string; name: string; role: string } | null;
}

export interface AdminStats {
  itemsTotal: number;
  itemsPublished: number;
  itemsDraft: number;
  itemsArchived: number;
  categoriesTotal: number;
  regionsTotal: number;
  mediaTotal: number;
  mediaByType: Record<MediaType, number>;
  models3dTotal: number;
  audioTotal: number;
  contributionsPending: number;
  usersTotal: number;
}

// ---------- Payload ----------
export interface ItemQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categorySlug?: string;
  regionCode?: string;
  sort?: "newest" | "oldest" | "popular" | "title";
}

export interface AdminItemQuery extends ItemQuery {
  status?: ItemStatus | "ALL";
  featured?: "true" | "false";
}

export interface ContributionInput {
  title: string;
  regionId?: string | null;
  categorySlug: string;
  description: string;
  sourceRef?: string;
  submitterName: string;
  submitterEmail: string;
}

export interface ItemInput {
  title: string;
  slug?: string;
  summary: string;
  description: string;
  history?: string;
  meaning?: string;
  status?: ItemStatus;
  featured?: boolean;
  categoryId: string;
  regionId: string;
  coverMediaId?: string | null;
  modelMediaId?: string | null;
  audioMediaId?: string | null;
  galleryMediaIds?: string[];
  attribution?: string;
  license?: string;
  sources?: Array<Omit<Source, "id" | "itemId" | "createdAt">>;
  hotspots?: Array<Omit<Hotspot, "id" | "itemId" | "createdAt">>;
}

export interface RegionInput {
  code: string;
  name: string;
  islandGroup: string;
  capital?: string;
  summary: string;
  description?: string;
  lat: number;
  lng: number;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface MediaInput {
  name?: string;
  description?: string;
  type?: MediaType;
  license?: string;
  attribution?: string;
  /** Payload khusus embed eksternal (Sketchfab) — lihat api.admin.media.embed */
  embedUrl?: string;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role: Role;
  active?: boolean;
}

export interface ContributionStatusInput {
  status: ContributionStatus;
  note?: string;
  publishItemId?: boolean;
}
