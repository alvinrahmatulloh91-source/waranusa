/**
 * WaraNusa — Controller admin: kategori (CRUD)
 * GET/POST /api/admin/categories | PATCH/DELETE /api/admin/categories/[id]
 */
import { db } from "@/lib/db";
import { ok, created, fail, notFound, handleApiError } from "@/lib/api-response";
import { ALL_STAFF, WRITE_ROLES, type AuthUser } from "@/lib/auth";
import { categorySchema, categoryUpdateSchema } from "@/server/validators/category";
import { serializeCategory } from "@/server/serializers";
import { uniqueSlug } from "@/server/services/slug";
import { logActivity } from "@/server/services/audit";
import { guard, readJson } from "@/server/services/http";

interface CategoryCtx {
  params: Promise<{ id: string }>;
}

/** GET /api/admin/categories */
export async function listAdminCategories(): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;
    const rows = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { culturalItems: true } } },
    });
    return ok(rows.map((c) => serializeCategory(c, c._count.culturalItems)));
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/admin/categories */
export async function createAdminCategory(req: Request): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = categorySchema.parse(body);

    const slug = await uniqueSlug(db, "category", input.slug || input.name);

    const category = await db.category.create({
      data: {
        slug,
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    });

    await logActivity(db, user.id, "category.create", "Category", category.id, `Menambah kategori "${category.name}".`);
    return created(serializeCategory(category));
  } catch (e) {
    return handleApiError(e);
  }
}

/** PATCH /api/admin/categories/[id] */
export async function updateAdminCategory(req: Request, ctx: CategoryCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return notFound("Kategori tidak ditemukan.");

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = categoryUpdateSchema.parse(body);

    const data: Partial<{
      slug: string;
      name: string;
      description: string | null;
      icon: string | null;
      sortOrder: number;
    }> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.slug !== undefined && input.slug.trim().toLowerCase() !== existing.slug.toLowerCase()) {
      data.slug = await uniqueSlug(db, "category", input.slug, existing.id);
    }

    const updated = await db.category.update({ where: { id }, data });
    await logActivity(db, user.id, "category.update", "Category", id, `Memperbarui kategori "${updated.name}".`);
    return ok(serializeCategory(updated));
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE /api/admin/categories/[id] — tolak bila masih dipakai objek budaya */
export async function deleteAdminCategory(_req: Request, ctx: CategoryCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return notFound("Kategori tidak ditemukan.");

    const count = await db.culturalItem.count({ where: { categoryId: id } });
    if (count > 0) {
      return fail(
        `Kategori masih digunakan oleh ${count} objek budaya. Pindahkan objek budaya ke kategori lain terlebih dahulu.`,
        409
      );
    }

    await db.category.delete({ where: { id } });
    await logActivity(db, user.id, "category.delete", "Category", id, `Menghapus kategori "${existing.name}".`);
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
