import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { createSession, setSessionCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { asRole } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** POST /api/auth/register — daftar akun kontributor + langsung masuk. */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    const rl = checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' }, { status: 429 })
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Data pendaftaran tidak valid.' }, { status: 400 })
    }

    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(body.password ?? '')

    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: 'Nama harus 2-60 karakter.' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 })
    }
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json({ error: 'Kata sandi harus 8-72 karakter.' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 })
    }

    const user = await db.user.create({
      data: { name, email, passwordHash: hashPassword(password), role: 'CONTRIBUTOR' },
      select: { id: true, name: true, email: true, role: true },
    })

    const { token, expiresAt } = await createSession(user.id)
    const res = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, role: asRole(user.role) } },
      { status: 201 },
    )
    setSessionCookie(res, token, expiresAt)
    return res
  } catch (err) {
    console.error('POST /api/auth/register', err)
    return NextResponse.json({ error: 'Gagal mendaftar. Silakan coba lagi.' }, { status: 500 })
  }
}
