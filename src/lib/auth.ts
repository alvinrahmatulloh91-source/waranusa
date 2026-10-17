/**
 * Autentikasi sesi WaraNusa: cookie httpOnly `wn_session` ↔ tabel Session.
 * Hanya boleh diimpor dari kode server (route handler / server component).
 */
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { SessionUser, UserRole } from '@/lib/types'

export const SESSION_COOKIE = 'wn_session'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 hari
const SESSION_TTL_SEC = 7 * 24 * 60 * 60

/** Buat baris Session baru (token cuid via default Prisma) untuk seorang user. */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const session = await db.session.create({
    data: { userId, expiresAt },
    select: { token: true, expiresAt: true },
  })
  return { token: session.token, expiresAt: session.expiresAt }
}

/**
 * Ambil user dari cookie sesi. Mengembalikan null bila anonim,
 * token tidak dikenal, atau sesi sudah kadaluarsa (baris kadaluarsa dihapus).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  })
  if (!session) return null

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined)
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as UserRole,
  }
}

/**
 * Guard peran untuk route admin/moderasi.
 * - Tanpa sesi            → 401 {error:'Silakan masuk terlebih dahulu.'}
 * - Peran tidak diizinkan → 403 {error:'Anda tidak memiliki izin untuk aksi ini.'}
 */
export async function requireRole(
  roles: UserRole[],
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const user = await getSessionUser()
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 }),
    }
  }
  if (!roles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk aksi ini.' },
        { status: 403 },
      ),
    }
  }
  return { user }
}

/** Tempel cookie sesi ke respons (httpOnly, lax, 7 hari; secure: false untuk sandbox http). */
export function setSessionCookie(res: NextResponse, token: string, expiresAt: Date): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
    expires: expiresAt,
    maxAge: SESSION_TTL_SEC,
  })
}

/** Hapus cookie sesi dari browser. */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
    maxAge: 0,
  })
}
