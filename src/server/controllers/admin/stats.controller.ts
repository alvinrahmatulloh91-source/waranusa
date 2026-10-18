/**
 * WaraNusa — Controller admin: statistik & log aktivitas
 * GET /api/admin/stats | GET /api/admin/activity
 */
import { db } from "@/lib/db";
import { ok, handleApiError, paginateMeta } from "@/lib/api-response";
import { ALL_STAFF } from "@/lib/auth";
import type { MediaType } from "@/lib/constants";
import { serializeActivity } from "@/server/serializers";
import { guard, parsePagination } from "@/server/services/http";

/** GET /api/admin/stats — ringkasan angka untuk dashboard */
export async function stats(): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const [
      itemsTotal,
      itemsPublished,
      itemsDraft,
      itemsArchived,
      categoriesTotal,
      regionsTotal,
      mediaTotal,
      mediaGroups,
      models3dTotal,
      audioTotal,
      contributionsPending,
      usersTotal,
    ] = await Promise.all([
      db.culturalItem.count(),
      db.culturalItem.count({ where: { status: "PUBLISHED" } }),
      db.culturalItem.count({ where: { status: "DRAFT" } }),
      db.culturalItem.count({ where: { status: "ARCHIVED" } }),
      db.category.count(),
      db.region.count(),
      db.mediaAsset.count(),
      db.mediaAsset.groupBy({ by: ["type"], _count: { _all: true } }),
      db.mediaAsset.count({ where: { type: "MODEL_3D" } }),
      db.mediaAsset.count({ where: { type: "AUDIO" } }),
      db.contribution.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
      db.user.count(),
    ]);

    const mediaByType: Record<MediaType, number> = { IMAGE: 0, AUDIO: 0, MODEL_3D: 0, TEXTURE: 0, THUMBNAIL: 0 };
    for (const grp of mediaGroups) {
      if ((Object.keys(mediaByType) as string[]).includes(grp.type)) {
        mediaByType[grp.type as MediaType] = grp._count._all;
      }
    }

    return ok({
      itemsTotal,
      itemsPublished,
      itemsDraft,
      itemsArchived,
      categoriesTotal,
      regionsTotal,
      mediaTotal,
      mediaByType,
      models3dTotal,
      audioTotal,
      contributionsPending,
      usersTotal,
    });
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/admin/activity — log aktivitas terbaru (paginated) */
export async function activity(req: Request): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const url = new URL(req.url);
    const { page, pageSize, skip, take } = parsePagination(url, 10, 100);
    const [total, rows] = await Promise.all([
      db.activityLog.count(),
      db.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { user: { select: { id: true, name: true, role: true } } },
      }),
    ]);
    return ok(rows.map(serializeActivity), paginateMeta(page, pageSize, total));
  } catch (e) {
    return handleApiError(e);
  }
}
