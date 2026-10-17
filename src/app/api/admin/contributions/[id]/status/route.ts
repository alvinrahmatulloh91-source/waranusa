import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { mapContribution } from '@/lib/serialize'
import { publishContribution } from '@/lib/contribution-publish'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const REVIEWER_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR', 'REVIEWER']
const MODERATION_STATUSES = ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION']

const DEFAULT_NOTE: Record<string, string> = {
  UNDER_REVIEW: 'Kontribusi sedang ditinjau oleh kurator.',
  APPROVED: 'Diverifikasi dan disetujui oleh kurator.',
  REJECTED: 'Ditolak oleh kurator setelah peninjauan.',
  NEEDS_REVISION: 'Perlu revisi sebelum dapat disetujui.',
}

/**
 * PATCH /api/admin/contributions/[id]/status — aksi moderasi kurator.
 * Menulis baris ModerationReview (audit), memperbarui status, dan bila
 * APPROVED && publish !== false → mempublikasikan kontribusi menjadi item.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(REVIEWER_PLUS)
    if ('error' in auth) return auth.error
    const reviewer = auth.user
    const { id } = await ctx.params

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const status = String(body?.status ?? '').trim()
    const note = String(body?.note ?? '').trim() || null
    const publish = body?.publish === undefined ? true : body?.publish === true

    if (!MODERATION_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Status moderasi tidak valid (UNDER_REVIEW, APPROVED, REJECTED, atau NEEDS_REVISION).' },
        { status: 400 },
      )
    }

    const existing = await db.contribution.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Kontribusi tidak ditemukan.' }, { status: 404 })
    }

    const effectiveNote = note ?? DEFAULT_NOTE[status] ?? null

    // Audit trail: setiap aksi moderasi tercatat sebagai ModerationReview.
    await db.moderationReview.create({
      data: {
        contributionId: id,
        reviewerId: reviewer.id,
        action: status,
        note: effectiveNote,
      },
    })

    await db.contribution.update({
      where: { id },
      data: {
        status,
        reviewNote: effectiveNote,
        reviewedAt: new Date(),
      },
    })

    // Publikasi: hanya bila disetujui & tidak diminta menahan (publish=false),
    // dan kontribusi belum pernah dipublikasikan.
    let createdItemId: string | null = existing.createdItemId
    if (status === 'APPROVED' && publish) {
      createdItemId = await publishContribution(id)
    }

    const contribution = await db.contribution.findUnique({
      where: { id },
      include: {
        province: { select: { name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: { id: true, name: true } } },
        },
      },
    })
    if (!contribution) {
      return NextResponse.json({ error: 'Kontribusi tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ contribution: mapContribution(contribution), createdItemId })
  } catch (err) {
    console.error('PATCH /api/admin/contributions/[id]/status', err)
    return NextResponse.json({ error: 'Gagal memperbarui status kontribusi' }, { status: 500 })
  }
}
