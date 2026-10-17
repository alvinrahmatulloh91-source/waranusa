import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { asRole } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

/** GET /api/admin/users — daftar seluruh pengguna (SUPER_ADMIN saja). */
export async function GET() {
  try {
    const auth = await requireRole(['SUPER_ADMIN'])
    if ('error' in auth) return auth.error

    const users = await db.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { contributions: true } } },
    })

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: asRole(u.role),
        createdAt: u.createdAt.toISOString(),
        contributionCount: u._count.contributions,
      })),
    })
  } catch (err) {
    console.error('GET /api/admin/users', err)
    return NextResponse.json({ error: 'Gagal memuat pengguna' }, { status: 500 })
  }
}
