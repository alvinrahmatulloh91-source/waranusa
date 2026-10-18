/**
 * WaraNusa — Controller autentikasi
 * POST /api/auth/login | POST /api/auth/logout | GET /api/auth/me
 */
import { db } from "@/lib/db";
import { ok, fail, unauthorized, handleApiError } from "@/lib/api-response";
import { createSession, destroyCurrentSession, getCurrentUser, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/server/validators/auth";
import { serializeUser } from "@/server/serializers";
import { logActivity } from "@/server/services/audit";
import { readJson } from "@/server/services/http";

/** POST /api/auth/login — rate limit 5 percobaan/menit per ip+email */
export async function login(req: Request): Promise<Response> {
  try {
    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = loginSchema.parse(body);
    const email = input.email.toLowerCase();

    const ip = clientIp(req);
    const rl = rateLimit(`login:${ip}:${email}`, 5, 60_000);
    if (!rl.allowed) {
      return fail(`Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfterSec} detik.`, 429);
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.active || !verifyPassword(input.password, user.passwordHash)) {
      return unauthorized("Email atau kata sandi salah.");
    }

    const { token, expiresAt } = await createSession(user.id);
    await logActivity(db, user.id, "auth.login", "User", user.id, `${user.name} masuk ke sistem.`);

    const res = ok(serializeUser(user));
    // SameSite=None + Partitioned (CHIPS): sesi tetap tersimpan walau situs berjalan
    // di dalam iframe pratinjau lintas-origin (konteks pihak ketiga). Wajib Secure.
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      partitioned: true,
      path: "/",
      expires: expiresAt,
    });
    return res;
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/auth/logout */
export async function logout(): Promise<Response> {
  try {
    await destroyCurrentSession();
    const res = ok({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      partitioned: true,
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/auth/me — user saat ini atau null */
export async function me(): Promise<Response> {
  try {
    const auth = await getCurrentUser();
    if (!auth) return ok(null);
    const user = await db.user.findUnique({ where: { id: auth.id } });
    if (!user || !user.active) return ok(null);
    return ok(serializeUser(user));
  } catch (e) {
    return handleApiError(e);
  }
}
