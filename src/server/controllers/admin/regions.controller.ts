/**
 * WaraNusa — Controller admin: wilayah (CRUD)
 * GET/POST /api/admin/regions | PATCH/DELETE /api/admin/regions/[id]
 */
import { db } from "@/lib/db";
import { ok, created, fail, notFound, handleApiError } from "@/lib/api-response";
import { ALL_STAFF, WRITE_ROLES, type AuthUser } from "@/lib/auth";
import { regionSchema, regionUpdateSchema } from "@/server/validators/region";
import { serializeRegion } from "@/server/serializers";
import { logActivity } from "@/server/services/audit";
import { guard, readJson } from "@/server/services/http";

interface RegionCtx {
  params: Promise<{ id: string }>;
}

/** GET /api/admin/regions */
export async function listAdminRegions(): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;
    const rows = await db.region.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { culturalItems: true } } },
    });
    return ok(rows.map((r) => serializeRegion(r, r._count.culturalItems)));
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/admin/regions */
export async function createAdminRegion(req: Request): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = regionSchema.parse(body);

    const dup = await db.region.findUnique({ where: { code: input.code }, select: { id: true } });
    if (dup) return fail("Kode wilayah sudah digunakan.", 409, { code: "Kode wilayah sudah digunakan." });

    const region = await db.region.create({
      data: {
        code: input.code,
        name: input.name,
        islandGroup: input.islandGroup,
        capital: input.capital ?? null,
        summary: input.summary,
        description: input.description ?? null,
        lat: input.lat,
        lng: input.lng,
      },
    });

    await logActivity(db, user.id, "region.create", "Region", region.id, `Menambah wilayah "${region.name}" (${region.code}).`);
    return created(serializeRegion(region));
  } catch (e) {
    return handleApiError(e);
  }
}

/** PATCH /api/admin/regions/[id] */
export async function updateAdminRegion(req: Request, ctx: RegionCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.region.findUnique({ where: { id } });
    if (!existing) return notFound("Wilayah tidak ditemukan.");

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = regionUpdateSchema.parse(body);

    if (input.code !== undefined && input.code !== existing.code) {
      const dup = await db.region.findUnique({ where: { code: input.code }, select: { id: true } });
      if (dup) return fail("Kode wilayah sudah digunakan.", 409, { code: "Kode wilayah sudah digunakan." });
    }

    const data: Partial<{
      code: string;
      name: string;
      islandGroup: string;
      capital: string | null;
      summary: string;
      description: string | null;
      lat: number;
      lng: number;
    }> = {};
    if (input.code !== undefined) data.code = input.code;
    if (input.name !== undefined) data.name = input.name;
    if (input.islandGroup !== undefined) data.islandGroup = input.islandGroup;
    if (input.capital !== undefined) data.capital = input.capital;
    if (input.summary !== undefined) data.summary = input.summary;
    if (input.description !== undefined) data.description = input.description;
    if (input.lat !== undefined) data.lat = input.lat;
    if (input.lng !== undefined) data.lng = input.lng;

    const updated = await db.region.update({ where: { id }, data });
    await logActivity(db, user.id, "region.update", "Region", id, `Memperbarui wilayah "${updated.name}".`);
    return ok(serializeRegion(updated));
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE /api/admin/regions/[id] — tolak bila masih dipakai objek budaya */
export async function deleteAdminRegion(_req: Request, ctx: RegionCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.region.findUnique({ where: { id } });
    if (!existing) return notFound("Wilayah tidak ditemukan.");

    const count = await db.culturalItem.count({ where: { regionId: id } });
    if (count > 0) {
      return fail(
        `Wilayah masih memiliki objek budaya (${count} item). Pindahkan atau hapus objek budaya terlebih dahulu.`,
        409
      );
    }

    await db.region.delete({ where: { id } });
    await logActivity(db, user.id, "region.delete", "Region", id, `Menghapus wilayah "${existing.name}".`);
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
