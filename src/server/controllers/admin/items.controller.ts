/**
 * WaraNusa — Controller admin: objek budaya (CRUD)
 * GET/POST /api/admin/cultural-items | GET/PATCH/DELETE /api/admin/cultural-items/[id]
 */
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, created, fail, notFound, handleApiError, paginateMeta } from "@/lib/api-response";
import { ALL_STAFF, WRITE_ROLES, type AuthUser } from "@/lib/auth";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";
import { itemSchema, itemUpdateSchema, type ItemParsed, type ItemUpdateParsed } from "@/server/validators/item";
import { serializeItem, itemFullInclude, itemLiteInclude } from "@/server/serializers";
import { uniqueSlug } from "@/server/services/slug";
import { logActivity } from "@/server/services/audit";
import { guard, readJson, parsePagination } from "@/server/services/http";
import { buildItemWhere, itemOrderBy, parseItemSort } from "@/server/services/item-query";

interface ItemCtx {
  params: Promise<{ id: string }>;
}

/** Validasi referensi (kategori/wilayah/media) -> daftar error per field bila gagal */
async function validateReferences(input: {
  categoryId?: string;
  regionId?: string;
  coverMediaId?: string | null;
  modelMediaId?: string | null;
  audioMediaId?: string | null;
  galleryMediaIds?: string[];
}): Promise<Record<string, string> | null> {
  const errs: Record<string, string> = {};
  if (input.categoryId !== undefined) {
    const cat = await db.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!cat) errs.categoryId = "Kategori tidak ditemukan.";
  }
  if (input.regionId !== undefined) {
    const reg = await db.region.findUnique({ where: { id: input.regionId }, select: { id: true } });
    if (!reg) errs.regionId = "Wilayah tidak ditemukan.";
  }
  const mediaIds = [
    input.coverMediaId,
    input.modelMediaId,
    input.audioMediaId,
    ...(input.galleryMediaIds ?? []),
  ].filter((x): x is string => typeof x === "string" && x.length > 0);
  if (mediaIds.length > 0) {
    const found = await db.mediaAsset.findMany({ where: { id: { in: mediaIds } }, select: { id: true } });
    if (found.length !== new Set(mediaIds).size) errs.media = "Beberapa media tidak ditemukan.";
  }
  return Object.keys(errs).length > 0 ? errs : null;
}

function sourceCreateData(input: ItemParsed["sources"] | undefined) {
  if (!input) return [];
  return input.map((s) => ({
    title: s.title,
    creator: s.creator ?? null,
    url: s.url ?? null,
    sourceType: s.sourceType,
    accessDate: s.accessDate ?? null,
    attribution: s.attribution ?? null,
    license: s.license ?? null,
    verificationNote: s.verificationNote ?? null,
  }));
}

/** GET /api/admin/cultural-items — semua status, filter lengkap */
export async function listAdminItems(req: Request): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const url = new URL(req.url);
    const { page, pageSize, skip, take } = parsePagination(url, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const where = buildItemWhere({
      search: url.searchParams.get("search"),
      category: url.searchParams.get("category"),
      region: url.searchParams.get("region"),
      status: url.searchParams.get("status"),
      featured: url.searchParams.get("featured"),
    });
    const sort = parseItemSort(url.searchParams.get("sort"));
    const [total, rows] = await Promise.all([
      db.culturalItem.count({ where }),
      db.culturalItem.findMany({ where, orderBy: itemOrderBy(sort), skip, take, include: itemLiteInclude }),
    ]);
    return ok(rows.map(serializeItem), paginateMeta(page, pageSize, total));
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/admin/cultural-items */
export async function createAdminItem(req: Request): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = itemSchema.parse(body);

    const errs = await validateReferences(input);
    if (errs) return fail("Data referensi tidak valid.", 422, errs);

    const slug = await uniqueSlug(db, "culturalItem", input.slug || input.title);

    const item = await db.culturalItem.create({
      data: {
        slug,
        title: input.title,
        summary: input.summary,
        description: input.description,
        history: input.history ?? null,
        meaning: input.meaning ?? null,
        status: input.status ?? "DRAFT",
        featured: input.featured ?? false,
        categoryId: input.categoryId,
        regionId: input.regionId,
        coverMediaId: input.coverMediaId ?? null,
        modelMediaId: input.modelMediaId ?? null,
        audioMediaId: input.audioMediaId ?? null,
        attribution: input.attribution ?? null,
        license: input.license ?? null,
        createdById: user.id,
        gallery: input.galleryMediaIds
          ? { create: input.galleryMediaIds.map((mediaId, i) => ({ mediaId, role: "GALLERY", order: i })) }
          : undefined,
        sources: { create: sourceCreateData(input.sources) },
        hotspots: input.hotspots
          ? {
              create: input.hotspots.map((h) => ({
                title: h.title,
                description: h.description,
                x: h.x,
                y: h.y,
                z: h.z,
                published: h.published ?? true,
              })),
            }
          : undefined,
      },
    });

    await logActivity(db, user.id, "item.create", "CulturalItem", item.id, `Menambahkan objek budaya "${item.title}".`);

    const full = await db.culturalItem.findUnique({ where: { id: item.id }, include: itemFullInclude });
    return created(serializeItem(full!));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/admin/cultural-items/[id] */
export async function getAdminItem(_req: Request, ctx: ItemCtx): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const { id } = await ctx.params;
    const item = await db.culturalItem.findUnique({ where: { id }, include: itemFullInclude });
    if (!item) return notFound("Objek budaya tidak ditemukan.");
    return ok(serializeItem(item));
  } catch (e) {
    return handleApiError(e);
  }
}

/** PATCH /api/admin/cultural-items/[id] — partial update; gallery/sources REPLACE bila key dikirim */
export async function updateAdminItem(req: Request, ctx: ItemCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.culturalItem.findUnique({ where: { id } });
    if (!existing) return notFound("Objek budaya tidak ditemukan.");

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input: ItemUpdateParsed = itemUpdateSchema.parse(body);

    const errs = await validateReferences(input);
    if (errs) return fail("Data referensi tidak valid.", 422, errs);

    const data: Prisma.CulturalItemUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.summary !== undefined) data.summary = input.summary;
    if (input.description !== undefined) data.description = input.description;
    if (input.history !== undefined) data.history = input.history;
    if (input.meaning !== undefined) data.meaning = input.meaning;
    if (input.status !== undefined) data.status = input.status;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.attribution !== undefined) data.attribution = input.attribution;
    if (input.license !== undefined) data.license = input.license;
    if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
    if (input.regionId !== undefined) data.region = { connect: { id: input.regionId } };
    if (input.coverMediaId !== undefined) {
      data.coverMedia = input.coverMediaId ? { connect: { id: input.coverMediaId } } : { disconnect: true };
    }
    if (input.modelMediaId !== undefined) {
      data.modelMedia = input.modelMediaId ? { connect: { id: input.modelMediaId } } : { disconnect: true };
    }
    if (input.audioMediaId !== undefined) {
      data.audioMedia = input.audioMediaId ? { connect: { id: input.audioMediaId } } : { disconnect: true };
    }
    if (input.slug !== undefined && slugChanged(input.slug, existing.slug)) {
      data.slug = await uniqueSlug(db, "culturalItem", input.slug, existing.id);
    }
    if (input.galleryMediaIds !== undefined) {
      data.gallery = {
        deleteMany: {},
        create: input.galleryMediaIds.map((mediaId, i) => ({ mediaId, role: "GALLERY", order: i })),
      };
    }
    if (input.sources !== undefined) {
      data.sources = { deleteMany: {}, create: sourceCreateData(input.sources) ?? [] };
    }

    const updated = await db.culturalItem.update({ where: { id }, data });

    // Audit: tepat satu aksi sesuai perubahan status
    if (input.status !== undefined && input.status !== existing.status && input.status === "PUBLISHED") {
      await logActivity(db, user.id, "item.publish", "CulturalItem", id, `Mempublikasikan "${updated.title}".`);
    } else if (input.status !== undefined && input.status !== existing.status && input.status === "ARCHIVED") {
      await logActivity(db, user.id, "item.archive", "CulturalItem", id, `Mengarsipkan "${updated.title}".`);
    } else {
      await logActivity(db, user.id, "item.update", "CulturalItem", id, `Memperbarui objek budaya "${updated.title}".`);
    }

    const full = await db.culturalItem.findUnique({ where: { id }, include: itemFullInclude });
    return ok(serializeItem(full!));
  } catch (e) {
    return handleApiError(e);
  }
}

function slugChanged(incoming: string, current: string): boolean {
  return incoming.trim().toLowerCase() !== current.toLowerCase();
}

/** DELETE /api/admin/cultural-items/[id] */
export async function deleteAdminItem(_req: Request, ctx: ItemCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.culturalItem.findUnique({ where: { id } });
    if (!existing) return notFound("Objek budaya tidak ditemukan.");

    await db.culturalItem.delete({ where: { id } });
    await logActivity(db, user.id, "item.delete", "CulturalItem", id, `Menghapus objek budaya "${existing.title}".`);
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
