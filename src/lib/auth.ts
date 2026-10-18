/**
 * WaraNusa — Autentikasi & Otorisasi (server-only)
 * Pola token opaque di cookie httpOnly (setara Sanctum SPA mode).
 */
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_DAYS, type Role } from "@/lib/constants";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};

export function hashPassword(plain: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
  return bcrypt.compareSync(plain, hash);
}

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** Membuat sesi baru dan mengembalikan token mentah (dipasang di cookie) */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { token: hashToken(token), userId, expiresAt } });
  return { token, expiresAt };
}

/** Memvalidasi token dari cookie; mengembalikan user bila sesi valid */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const store = await cookies();
    const raw = store.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const session = await db.session.findUnique({
      where: { token: hashToken(raw) },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    const u = session.user;
    if (!u.active) return null;
    return { id: u.id, name: u.name, email: u.email, role: u.role as Role, active: u.active };
  } catch (e) {
    console.error("[auth] getCurrentUser failed:", e);
    return null;
  }
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (raw) {
    await db.session.deleteMany({ where: { token: hashToken(raw) } });
  }
}

/** Guard untuk endpoint admin/CMS: user harus login dan punya salah satu role */
export async function requireRole(roles: Role[]): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return roles.includes(user.role) ? user : null;
}

export const CMS_ROLES: Role[] = ["SUPER_ADMIN", "EDITOR", "REVIEWER"];
export const WRITE_ROLES: Role[] = ["SUPER_ADMIN", "EDITOR"];
export const ALL_STAFF: Role[] = ["SUPER_ADMIN", "EDITOR", "REVIEWER"];
