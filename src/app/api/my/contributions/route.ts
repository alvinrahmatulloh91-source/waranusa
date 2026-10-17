import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { mapContribution } from '@/lib/serialize'
import { USER_ROLES } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** GET /api/my/contributions — riwayat kontribusi milik sesi (dengan reviews). */
export async function GET() {
  try {
    const auth = await requireRole([...USER_ROLES])
    if ('error' in auth) return auth.error

    const rows = await db.contribution.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        province: { select: { name: true, slug: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: { id: true, name: true } } },
        },
      },
    })

    return NextResponse.json({ contributions: rows.map(mapContribution) })
  } catch (err) {
    console.error('GET /api/my/contributions', err)
    return NextResponse.json({ error: 'Gagal memuat kontribusi Anda' }, { status: 500 })
  }
}
