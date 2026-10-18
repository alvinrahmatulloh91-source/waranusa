/**
 * WaraNusa — Controller admin: pengguna (SUPER_ADMIN only)
 * GET/POST /api/admin/users | PATCH /api/admin/users/[id]
 */
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, created, fail, notFound, handleApiError } from "@/lib/api-response";
import { hashPassword, type AuthUser } from "@/lib/auth";
import { userCreateSchema, userUpdateSchema } from "@/server/validators/user";
import { serializeUser } from "@/server/serializers";
import { logActivity } from "@/server/services/audit";
import { guard, readJson } from "@/server/services/http";

interface UserCtx {
  params: Promise<{ id: string }>;
}

/** GET /api/admin/users */
export async function listAdminUsers(): Promise<Response> {
  try {
    const g = await guard(["SUPER_ADMIN"]);
    if (g instanceof Response) return g;
    const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
    return ok(users.map((u) => serializeUser(u)));
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/admin/users */
export async function createAdminUser(req: Request): Promise<Response> {
  try {
    const g = await guard(["SUPER_ADMIN"]);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = userCreateSchema.parse(body);

    const dup = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (dup) return fail("Email sudah terdaftar.", 409, { email: "Email sudah terdaftar." });

    const createdUser = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: hashPassword(input.password),
        role: input.role,
        active: input.active ?? true,
      },
    });

    await logActivity(db, user.id, "user.create", "User", createdUser.id, `Menambah pengguna "${createdUser.name}" (${createdUser.role}).`);
    return created(serializeUser(createdUser));
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Mencegah penonaktifan/penurunan satu-satunya SUPER_ADMIN aktif.
 */
export async function updateAdminUser(req: Request, ctx: UserCtx): Promise<Response> {
  try {
    const g = await guard(["SUPER_ADMIN"]);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const target = await db.user.findUnique({ where: { id } });
    if (!target) return notFound("Pengguna tidak ditemukan.");

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = userUpdateSchema.parse(body);

    // Lindungi akun sendiri: SUPER_ADMIN tidak boleh menonaktifkan dirinya
    if (input.active === false && id === user.id) {
      return fail("Anda tidak dapat menonaktifkan akun Anda sendiri.", 409);
    }

    const demoting =
      target.role === "SUPER_ADMIN" &&
      target.active &&
      (input.active === false || (input.role !== undefined && input.role !== "SUPER_ADMIN"));
    if (demoting) {
      const otherActiveSuper = await db.user.count({
        where: { role: "SUPER_ADMIN", active: true, id: { not: id } },
      });
      if (otherActiveSuper === 0) {
        return fail(
          "Tidak dapat menonaktifkan atau menurunkan satu-satunya Super Admin aktif. Tambahkan Super Admin lain terlebih dahulu.",
          409
        );
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.role !== undefined) data.role = input.role;
    if (input.active !== undefined) data.active = input.active;
    if (input.password !== undefined) data.passwordHash = hashPassword(input.password);

    const updated = await db.user.update({ where: { id }, data });
    await logActivity(db, user.id, "user.update", "User", id, `Memperbarui pengguna "${updated.name}".`);
    return ok(serializeUser(updated));
  } catch (e) {
    return handleApiError(e);
  }
}
