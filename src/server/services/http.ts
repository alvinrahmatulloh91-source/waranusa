/**
 * WaraNusa — Helper HTTP bersama untuk controller (guard, body, pagination)
 */
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { fail, forbidden, unauthorized } from "@/lib/api-response";
import type { Role } from "@/lib/constants";

/**
 * Guard ala Laravel middleware auth+role.
 * Mengembalikan AuthUser bila lolos, atau Response error (401/403) untuk di-return langsung.
 */
export async function guard(roles: readonly Role[]): Promise<AuthUser | Response> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!roles.includes(user.role)) return forbidden();
  return user;
}

/** Parse body JSON; mengembalikan Response 400 bila body rusak */
export async function readJson(req: Request): Promise<unknown | Response> {
  try {
    return await req.json();
  } catch {
    return fail("Body tidak valid.", 400);
  }
}

/** Parse query pagination dengan batas wajar */
export function parsePagination(
  url: URL,
  defaultPageSize: number,
  maxPageSize: number
): { page: number; pageSize: number; skip: number; take: number } {
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "", 10);
  const rawSize = Number.parseInt(url.searchParams.get("pageSize") ?? "", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, Number.isFinite(rawSize) && rawSize > 0 ? rawSize : defaultPageSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
