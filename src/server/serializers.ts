/**
 * WaraNusa — Serializers (ala Laravel API Resource)
 * Transformasi record Prisma -> bentuk respons sesuai kontrak src/lib/types.ts.
 * Semua Date diubah ke string ISO.
 */
import type { Prisma } from "@prisma/client";
import type {
  ActivityLog,
  Category,
  Contribution,
  CulturalItem,
  CulturalItemMedia,
  CulturalSource,
  MediaAsset,
  ModelHotspot,
  ModerationReview,
  Region,
  User,
} from "@prisma/client";
import type { ItemStatus, MediaType, SourceType } from "@/lib/constants";
import { mediaUrl } from "@/lib/storage";

// ---------- Include Prisma siap pakai ----------
/** Relasi ringan untuk daftar (tanpa sources/hotspots) */
export const itemLiteInclude = {
  category: true,
  region: true,
  coverMedia: true,
  modelMedia: true,
  audioMedia: true,
  gallery: { orderBy: { order: "asc" as const }, include: { media: true } },
} satisfies Prisma.CulturalItemInclude;

/** Relasi lengkap untuk detail (termasuk sources & hotspots) */
export const itemFullInclude = {
  ...itemLiteInclude,
  sources: { orderBy: { createdAt: "asc" as const } },
  hotspots: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.CulturalItemInclude;

/** Relasi detail kontribusi */
export const contributionDetailInclude = {
  region: true,
  reviews: {
    orderBy: { createdAt: "asc" as const },
    include: { reviewer: { select: { id: true, name: true, role: true } } },
  },
} satisfies Prisma.ContributionInclude;

// ---------- User ----------
export function serializeUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  };
}

// ---------- Region ----------
export function serializeRegion(r: Region, itemCount?: number) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    islandGroup: r.islandGroup,
    capital: r.capital,
    summary: r.summary,
    description: r.description,
    lat: r.lat,
    lng: r.lng,
    ...(itemCount !== undefined ? { itemCount } : {}),
  };
}

// ---------- Category ----------
export function serializeCategory(c: Category, itemCount?: number) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    icon: c.icon,
    ...(itemCount !== undefined ? { itemCount } : {}),
  };
}

// ---------- Media ----------
export interface MediaUsageRef {
  itemId: string;
  itemTitle: string;
  role: string;
}

type MediaLike = MediaAsset & {
  uploader?: User | null;
  _count?: { coverFor: number; modelFor: number; audioFor: number; galleryLinks: number };
};

export function serializeMediaAsset(m: MediaLike, usage?: MediaUsageRef[]) {
  const c = m._count;
  const usageCount = c ? c.coverFor + c.modelFor + c.audioFor + c.galleryLinks : 0;
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    type: m.type as MediaType,
    format: m.format,
    mimeType: m.mimeType,
    size: m.size,
    storagePath: m.storagePath,
    embedUrl: m.embedUrl ?? null,
    // Aset embed eksternal → url = URL embed; aset berkas → URL konsumsi lokal
    url: m.embedUrl ?? mediaUrl(m.storagePath ?? ""),
    license: m.license,
    attribution: m.attribution,
    status: m.status as "ACTIVE" | "ARCHIVED",
    uploader: m.uploader ? { id: m.uploader.id, name: m.uploader.name } : null,
    usageCount,
    ...(usage ? { usedBy: usage } : {}),
    createdAt: m.createdAt.toISOString(),
  };
}

// ---------- Source ----------
type SourceLike = CulturalSource & {
  item?: { id: string; slug: string; title: string } | null;
};

export function serializeSource(s: SourceLike) {
  return {
    id: s.id,
    itemId: s.itemId,
    title: s.title,
    creator: s.creator,
    url: s.url,
    sourceType: s.sourceType as SourceType,
    accessDate: s.accessDate,
    attribution: s.attribution,
    license: s.license,
    verificationNote: s.verificationNote,
    createdAt: s.createdAt.toISOString(),
    // Info item terkait (untuk arsip sumber) — tidak mengganggu kontrak Source
    ...(s.item !== undefined ? { item: s.item } : {}),
  };
}

// ---------- Hotspot ----------
export function serializeHotspot(h: ModelHotspot) {
  return {
    id: h.id,
    itemId: h.itemId,
    title: h.title,
    description: h.description,
    x: h.x,
    y: h.y,
    z: h.z,
    published: h.published,
  };
}

// ---------- CulturalItem ----------
export type ItemLike = CulturalItem & {
  category: Category;
  region: Region;
  coverMedia: MediaAsset | null;
  modelMedia: MediaAsset | null;
  audioMedia: MediaAsset | null;
  gallery: (CulturalItemMedia & { media: MediaAsset })[];
  sources?: CulturalSource[];
  hotspots?: ModelHotspot[];
};

export function serializeItem(item: ItemLike) {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    description: item.description,
    history: item.history,
    meaning: item.meaning,
    status: item.status as ItemStatus,
    featured: item.featured,
    viewCount: item.viewCount,
    attribution: item.attribution,
    license: item.license,
    category: serializeCategory(item.category),
    region: serializeRegion(item.region),
    coverMedia: item.coverMedia ? serializeMediaAsset(item.coverMedia) : null,
    modelMedia: item.modelMedia ? serializeMediaAsset(item.modelMedia) : null,
    audioMedia: item.audioMedia ? serializeMediaAsset(item.audioMedia) : null,
    gallery: (item.gallery ?? []).map((g) => serializeMediaAsset(g.media)),
    sources: (item.sources ?? []).map((s) => serializeSource(s)),
    hotspots: (item.hotspots ?? []).map((h) => serializeHotspot(h)),
    contributionId: item.contributionId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// ---------- Contribution ----------
export type ContributionLike = Contribution & {
  region?: Region | null;
  reviews?: Array<
    ModerationReview & { reviewer?: { id: string; name: string; role: string } | null }
  >;
};

export function serializeContribution(c: ContributionLike) {
  return {
    id: c.id,
    refCode: c.refCode,
    title: c.title,
    regionId: c.regionId,
    region: c.region ? serializeRegion(c.region) : null,
    categorySlug: c.categorySlug,
    description: c.description,
    sourceRef: c.sourceRef,
    submitterName: c.submitterName,
    submitterEmail: c.submitterEmail,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    ...(c.reviews
      ? {
          reviews: c.reviews.map((r) => ({
            id: r.id,
            action: r.action,
            note: r.note,
            createdAt: r.createdAt.toISOString(),
            ...(r.reviewer
              ? { reviewer: { id: r.reviewer.id, name: r.reviewer.name, role: r.reviewer.role } }
              : {}),
          })),
        }
      : {}),
  };
}

// ---------- ActivityLog ----------
export type ActivityLike = ActivityLog & { user?: { id: string; name: string; role: string } | null };

export function serializeActivity(a: ActivityLike) {
  return {
    id: a.id,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    detail: a.detail,
    createdAt: a.createdAt.toISOString(),
    user: a.user ? { id: a.user.id, name: a.user.name, role: a.user.role } : null,
  };
}
