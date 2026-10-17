import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createSession, setSessionCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { asRole } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

/** POST /api/auth/login — masuk dengan email + kata sandi (cookie sesi 7 hari). */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(body?.password ?? '')

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    const rl = checkRateLimit(`login:${ip}:${email}`, 5, 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' }, { status: 429 })
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan kata sandi wajib diisi.' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, passwordHash: true },
    })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Email atau kata sandi salah.' }, { status: 401 })
    }

    const { token, expiresAt } = await createSession(user.id)
    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: asRole(user.role) },
    })
    setSessionCookie(res, token, expiresAt)
    return res
  } catch (err) {
    console.error('POST /api/auth/login', err)
    return NextResponse.json({ error: 'Gagal masuk. Silakan coba lagi.' }, { status: 500 })
  }
}
