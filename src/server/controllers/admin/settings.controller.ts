/**
 * WaraNusa — Controller admin: pengaturan situs (SUPER_ADMIN only)
 * GET/PUT /api/admin/settings
 */
import { db } from "@/lib/db";
import { ok, handleApiError } from "@/lib/api-response";
import type { AuthUser } from "@/lib/auth";
import { settingsUpdateSchema } from "@/server/validators/user";
import { logActivity } from "@/server/services/audit";
import { guard, readJson } from "@/server/services/http";

async function readAllSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany({ orderBy: { key: "asc" } });
  const data: Record<string, string> = {};
  for (const r of rows) data[r.key] = r.value;
  return data;
}

/** GET /api/admin/settings — semua pengaturan */
export async function getAdminSettings(): Promise<Response> {
  try {
    const g = await guard(["SUPER_ADMIN"]);
    if (g instanceof Response) return g;
    return ok(await readAllSettings());
  } catch (e) {
    return handleApiError(e);
  }
}

/** PUT /api/admin/settings — upsert record pengaturan (maks 20 key) */
export async function updateAdminSettings(req: Request): Promise<Response> {
  try {
    const g = await guard(["SUPER_ADMIN"]);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = settingsUpdateSchema.parse(body);

    for (const [key, value] of Object.entries(input)) {
      await db.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }

    await logActivity(
      db,
      user.id,
      "settings.update",
      "Setting",
      undefined,
      `Memperbarui ${Object.keys(input).length} pengaturan situs.`
    );
    return ok(await readAllSettings());
  } catch (e) {
    return handleApiError(e);
  }
}
