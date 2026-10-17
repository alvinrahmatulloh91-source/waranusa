import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { mapContribution } from '@/lib/serialize'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EDITOR_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR']

/** GET /api/admin/stats — ringkasan CMS (EDITOR ke atas). */
export async function GET() {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error

    const [
      itemsTotal,
      published,
      draft,
      pendingReview,
      archived,
      playable,
      models3d,
      provinces,
      categories,
      users,
      cTotal,
      cSubmitted,
      cUnderReview,
      cApproved,
      cRejected,
      cNeedsRevision,
      recentContribRows,
      recentItemRows,
    ] = await Promise.all([
      db.culturalItem.count(),
      db.culturalItem.count({ where: { status: 'PUBLISHED' } }),
      db.culturalItem.count({ where: { status: 'DRAFT' } }),
      db.culturalItem.count({ where: { status: 'PENDING_REVIEW' } }),
      db.culturalItem.count({ where: { status: 'ARCHIVED' } }),
      db.culturalItem.count({ where: { playable: true } }),
      db.culturalItem.count({ where: { model3d: { not: null } } }),
      db.province.count(),
      db.category.count(),
      db.user.count(),
      db.contribution.count(),
      db.contribution.count({ where: { status: 'SUBMITTED' } }),
      db.contribution.count({ where: { status: 'UNDER_REVIEW' } }),
      db.contribution.count({ where: { status: 'APPROVED' } }),
      db.contribution.count({ where: { status: 'REJECTED' } }),
      db.contribution.count({ where: { status: 'NEEDS_REVISION' } }),
      db.contribution.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          province: { select: { name: true, slug: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      db.culturalItem.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          category: true,
          updatedAt: true,
          province: { select: { name: true } },
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        items: {
          total: itemsTotal,
          published,
          draft,
          pendingReview,
          archived,
          playable,
          models3d,
        },
        provinces,
        categories,
        users,
        contributions: {
          total: cTotal,
          submitted: cSubmitted,
          underReview: cUnderReview,
          approved: cApproved,
          rejected: cRejected,
          needsRevision: cNeedsRevision,
        },
        recentContributions: recentContribRows.map(mapContribution),
        recentItems: recentItemRows.map((it) => ({
          id: it.id,
          name: it.name,
          status: it.status,
          category: it.category,
          provinceName: it.province.name,
          updatedAt: it.updatedAt.toISOString(),
        })),
      },
    })
  } catch (err) {
    console.error('GET /api/admin/stats', err)
    return NextResponse.json({ error: 'Gagal memuat statistik admin' }, { status: 500 })
  }
}
