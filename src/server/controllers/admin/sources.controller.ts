/**
 * WaraNusa — Controller admin: sumber (CRUD)
 * GET/POST /api/admin/sources | PATCH/DELETE /api/admin/sources/[id]
 */
import { db } from "@/lib/db";
import { ok, created, fail, notFound, handleApiError } from "@/lib/api-response";
import { ALL_STAFF, WRITE_ROLES, type AuthUser } from "@/lib/auth";
import { SOURCE_TYPES, type SourceType } from "@/lib/constants";
import { sourceCreateSchema, sourceUpdateSchema } from "@/server/validators/source";
import { serializeSource } from "@/server/serializers";
import { logActivity } from "@/server/services/audit";
import { guard, readJson } from "@/server/services/http";

interface SourceCtx {
  params: Promise<{ id: string }>;
}

const sourceItemInclude = { item: { select: { id: true, slug: true, title: true } } } as const;

/** Validasi itemId bila dikirim; pesan error per field atau null */
async function validateItemId(itemId: string | null | undefined): Promise<string | null> {
  if (itemId === undefined || itemId === null || itemId === "") return null;
  const found = await db.culturalItem.findUnique({ where: { id: itemId }, select: { id: true } });
  return found ? null : "Objek budaya tidak ditemukan.";
}

/** GET /api/admin/sources — filter search/type/itemId */
export async function listAdminSources(req: Request): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim();
    const type = url.searchParams.get("type")?.trim();
    const itemId = url.searchParams.get("itemId")?.trim();

    const where: {
      sourceType?: string;
      itemId?: string;
      OR?: Array<{ title?: { contains: string }; creator?: { contains: string } }>;
    } = {};
    if (type && (SOURCE_TYPES as readonly string[]).includes(type)) where.sourceType = type;
    if (itemId) where.itemId = itemId;
    if (search) {
      where.OR = [{ title: { contains: search } }, { creator: { contains: search } }];
    }

    const rows = await db.culturalSource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: sourceItemInclude,
    });
    return ok(rows.map((s) => serializeSource(s)));
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/admin/sources */
export async function createAdminSource(req: Request): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = sourceCreateSchema.parse(body);

    const itemErr = await validateItemId(input.itemId);
    if (itemErr) return fail("Data referensi tidak valid.", 422, { itemId: itemErr });

    const source = await db.culturalSource.create({
      data: {
        itemId: input.itemId ?? null,
        title: input.title,
        creator: input.creator ?? null,
        url: input.url ?? null,
        sourceType: input.sourceType,
        accessDate: input.accessDate ?? null,
        attribution: input.attribution ?? null,
        license: input.license ?? null,
        verificationNote: input.verificationNote ?? null,
      },
      include: sourceItemInclude,
    });

    await logActivity(db, user.id, "source.create", "CulturalSource", source.id, `Menambah sumber "${source.title}".`);
    return created(serializeSource(source));
  } catch (e) {
    return handleApiError(e);
  }
}

/** PATCH /api/admin/sources/[id] */
export async function updateAdminSource(req: Request, ctx: SourceCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.culturalSource.findUnique({ where: { id } });
    if (!existing) return notFound("Sumber tidak ditemukan.");

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = sourceUpdateSchema.parse(body);

    if (input.itemId !== undefined) {
      const itemErr = await validateItemId(input.itemId);
      if (itemErr) return fail("Data referensi tidak valid.", 422, { itemId: itemErr });
    }

    const data: Partial<{
      itemId: string | null;
      title: string;
      creator: string | null;
      url: string | null;
      sourceType: string;
      accessDate: string | null;
      attribution: string | null;
      license: string | null;
      verificationNote: string | null;
    }> = {};
    if (input.itemId !== undefined) data.itemId = input.itemId;
    if (input.title !== undefined) data.title = input.title;
    if (input.creator !== undefined) data.creator = input.creator;
    if (input.url !== undefined) data.url = input.url;
    if (input.sourceType !== undefined) data.sourceType = input.sourceType as SourceType;
    if (input.accessDate !== undefined) data.accessDate = input.accessDate;
    if (input.attribution !== undefined) data.attribution = input.attribution;
    if (input.license !== undefined) data.license = input.license;
    if (input.verificationNote !== undefined) data.verificationNote = input.verificationNote;

    const updated = await db.culturalSource.update({ where: { id }, data, include: sourceItemInclude });
    await logActivity(db, user.id, "source.update", "CulturalSource", id, `Memperbarui sumber "${updated.title}".`);
    return ok(serializeSource(updated));
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE /api/admin/sources/[id] */
export async function deleteAdminSource(_req: Request, ctx: SourceCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.culturalSource.findUnique({ where: { id } });
    if (!existing) return notFound("Sumber tidak ditemukan.");

    await db.culturalSource.delete({ where: { id } });
    await logActivity(db, user.id, "source.delete", "CulturalSource", id, `Menghapus sumber "${existing.title}".`);
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
