/**
 * WaraNusa — Controller admin: hotspot model 3D
 * POST /api/admin/cultural-items/[id]/hotspots
 * PATCH/DELETE /api/admin/cultural-items/[id]/hotspots/[hotspotId]
 */
import { db } from "@/lib/db";
import { ok, created, notFound, handleApiError } from "@/lib/api-response";
import { WRITE_ROLES, type AuthUser } from "@/lib/auth";
import { hotspotCreateSchema, hotspotUpdateSchema } from "@/server/validators/item";
import { serializeHotspot } from "@/server/serializers";
import { logActivity } from "@/server/services/audit";
import { guard, readJson } from "@/server/services/http";

export async function createHotspot(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const item = await db.culturalItem.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!item) return notFound("Objek budaya tidak ditemukan.");

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = hotspotCreateSchema.parse(body);

    const hotspot = await db.modelHotspot.create({
      data: {
        itemId: id,
        title: input.title,
        description: input.description,
        x: input.x,
        y: input.y,
        z: input.z,
        published: input.published ?? true,
      },
    });

    await logActivity(
      db,
      user.id,
      "hotspot.create",
      "ModelHotspot",
      hotspot.id,
      `Menambah hotspot "${hotspot.title}" pada "${item.title}".`
    );
    return created(serializeHotspot(hotspot));
  } catch (e) {
    return handleApiError(e);
  }
}

export async function updateHotspot(
  req: Request,
  ctx: { params: Promise<{ id: string; hotspotId: string }> }
): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id, hotspotId } = await ctx.params;
    const hotspot = await db.modelHotspot.findFirst({ where: { id: hotspotId, itemId: id } });
    if (!hotspot) return notFound("Hotspot tidak ditemukan.");

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = hotspotUpdateSchema.parse(body);

    const data: { title?: string; description?: string; x?: number; y?: number; z?: number; published?: boolean } = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.x !== undefined) data.x = input.x;
    if (input.y !== undefined) data.y = input.y;
    if (input.z !== undefined) data.z = input.z;
    if (input.published !== undefined) data.published = input.published;

    const updated = await db.modelHotspot.update({ where: { id: hotspot.id }, data });
    await logActivity(
      db,
      user.id,
      "hotspot.update",
      "ModelHotspot",
      updated.id,
      `Memperbarui hotspot "${updated.title}".`
    );
    return ok(serializeHotspot(updated));
  } catch (e) {
    return handleApiError(e);
  }
}

export async function deleteHotspot(
  _req: Request,
  ctx: { params: Promise<{ id: string; hotspotId: string }> }
): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id, hotspotId } = await ctx.params;
    const hotspot = await db.modelHotspot.findFirst({ where: { id: hotspotId, itemId: id } });
    if (!hotspot) return notFound("Hotspot tidak ditemukan.");

    await db.modelHotspot.delete({ where: { id: hotspot.id } });
    await logActivity(db, user.id, "hotspot.delete", "ModelHotspot", hotspot.id, `Menghapus hotspot "${hotspot.title}".`);
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
