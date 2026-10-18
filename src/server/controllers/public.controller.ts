/**
 * WaraNusa — Controller endpoint publik
 * regions, categories, cultural-items, sources, settings
 */
import type { Prisma, MediaAsset } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, notFound, handleApiError, paginateMeta } from "@/lib/api-response";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, SOURCE_TYPES, type SourceType } from "@/lib/constants";
import {
  serializeCategory,
  serializeRegion,
  serializeItem,
  serializeSource,
  serializeMediaAsset,
  itemLiteInclude,
  itemFullInclude,
} from "@/server/serializers";
import { parsePagination } from "@/server/services/http";
import { buildItemWhere, itemOrderBy, parseItemSort } from "@/server/services/item-query";
import { mediaUsageMap } from "@/server/services/media-usage";

const SETTING_PUBLIC_KEYS = ["siteName", "tagline", "aboutShort", "contactEmail", "footerNote", "contributionNotice"];

/** Cari item PUBLISHED berdasarkan slug ATAU id */
function findPublishedItem(idOrSlug: string) {
  return db.culturalItem.findFirst({
    where: { OR: [{ slug: idOrSlug }, { id: idOrSlug }], status: "PUBLISHED" },
  });
}

/** GET /api/regions */
export async function listRegions(): Promise<Response> {
  try {
    const regions = await db.region.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { culturalItems: { where: { status: "PUBLISHED" } } } } },
    });
    return ok(regions.map((r) => serializeRegion(r, r._count.culturalItems)));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/categories */
export async function listCategories(): Promise<Response> {
  try {
    const categories = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { culturalItems: { where: { status: "PUBLISHED" } } } } },
    });
    return ok(categories.map((c) => serializeCategory(c, c._count.culturalItems)));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/cultural-items — hanya PUBLISHED, paginated */
export async function listItems(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const { page, pageSize, skip, take } = parsePagination(url, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const sort = parseItemSort(url.searchParams.get("sort"));
    const where = buildItemWhere({
      search: url.searchParams.get("search"),
      category: url.searchParams.get("category"),
      region: url.searchParams.get("region"),
      forcePublished: true,
    });
    const [total, rows] = await Promise.all([
      db.culturalItem.count({ where }),
      db.culturalItem.findMany({ where, orderBy: itemOrderBy(sort), skip, take, include: itemLiteInclude }),
    ]);
    return ok(rows.map(serializeItem), paginateMeta(page, pageSize, total));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/cultural-items/[id] — detail lengkap (hotspot hanya yang published), viewCount++ */
export async function itemDetail(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const item = await db.culturalItem.findFirst({
      where: { OR: [{ slug: id }, { id }], status: "PUBLISHED" },
      include: itemFullInclude,
    });
    if (!item) return notFound("Objek budaya tidak ditemukan.");
    // Increment viewCount (await, tetapi kegagalan tidak boleh menggagalkan respons)
    try {
      await db.culturalItem.update({ where: { id: item.id }, data: { viewCount: { increment: 1 } } });
    } catch {
      /* abaikan kegagalan counter */
    }
    return ok(serializeItem({ ...item, hotspots: item.hotspots.filter((h) => h.published) }));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/cultural-items/[id]/sources */
export async function itemSources(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const item = await findPublishedItem(id);
    if (!item) return notFound("Objek budaya tidak ditemukan.");
    const sources = await db.culturalSource.findMany({
      where: { itemId: item.id },
      orderBy: { createdAt: "asc" },
    });
    return ok(sources.map((s) => serializeSource(s)));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/cultural-items/[id]/media — cover+model+audio+gallery (dedupe) dengan usageCount */
export async function itemMedia(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = await ctx.params;
    const item = await db.culturalItem.findFirst({
      where: { OR: [{ slug: id }, { id }], status: "PUBLISHED" },
      include: {
        coverMedia: true,
        modelMedia: true,
        audioMedia: true,
        gallery: { orderBy: { order: "asc" }, include: { media: true } },
      },
    });
    if (!item) return notFound("Objek budaya tidak ditemukan.");
    const unique = new Map<string, MediaAsset>();
    for (const m of [item.coverMedia, item.modelMedia, item.audioMedia]) {
      if (m) unique.set(m.id, m);
    }
    for (const g of item.gallery) unique.set(g.media.id, g.media);
    const usage = await mediaUsageMap([...unique.keys()]);
    return ok([...unique.values()].map((m) => serializeMediaAsset(m, usage.get(m.id) ?? [])));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/sources — arsip sumber publik (dari item PUBLISHED atau tanpa item) */
export async function listPublicSources(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim();
    const type = url.searchParams.get("type")?.trim();

    const conds: Prisma.CulturalSourceWhereInput[] = [
      { OR: [{ item: { status: "PUBLISHED" } }, { itemId: null }] },
    ];
    if (type && (SOURCE_TYPES as readonly string[]).includes(type)) conds.push({ sourceType: type as SourceType });
    if (search) {
      conds.push({ OR: [{ title: { contains: search } }, { creator: { contains: search } }] });
    }

    const rows = await db.culturalSource.findMany({
      where: { AND: conds },
      orderBy: { createdAt: "desc" },
      include: { item: { select: { id: true, slug: true, title: true } } },
    });
    return ok(rows.map((s) => serializeSource(s)));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/settings — pengaturan publik (whitelist key) */
export async function getSettings(): Promise<Response> {
  try {
    const rows = await db.setting.findMany({ where: { key: { in: SETTING_PUBLIC_KEYS } } });
    const data: Record<string, string> = {};
    for (const r of rows) data[r.key] = r.value;
    return ok(data);
  } catch (e) {
    return handleApiError(e);
  }
}
