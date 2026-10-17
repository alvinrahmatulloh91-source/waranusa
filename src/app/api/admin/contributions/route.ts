import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { mapContribution } from '@/lib/serialize'
import { CONTRIBUTION_STATUSES, type UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const REVIEWER_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR', 'REVIEWER']

/** GET /api/admin/contributions — antrean moderasi (REVIEWER ke atas), param status opsional. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(REVIEWER_PLUS)
    if ('error' in auth) return auth.error

    const status = req.nextUrl.searchParams.get('status')?.trim()
    const where =
      status && (CONTRIBUTION_STATUSES as string[]).includes(status) ? { status } : {}

    const rows = await db.contribution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        province: { select: { name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: { id: true, name: true } } },
        },
      },
    })

    return NextResponse.json({ contributions: rows.map(mapContribution) })
  } catch (err) {
    console.error('GET /api/admin/contributions', err)
    return NextResponse.json({ error: 'Gagal memuat kontribusi' }, { status: 500 })
  }
}
