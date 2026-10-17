import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { SESSION_COOKIE, clearSessionCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** POST /api/auth/logout — hapus sesi di DB + bersihkan cookie. */
export async function POST() {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (token) {
      await db.session.deleteMany({ where: { token } })
    }
  } catch (err) {
    console.error('POST /api/auth/logout', err)
  }

  const res = NextResponse.json({ ok: true })
  clearSessionCookie(res)
  return res
}
