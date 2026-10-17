import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { asRole } from '@/lib/serialize'
import { USER_ROLES } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/users/[id]/role — ubah peran pengguna (SUPER_ADMIN saja).
 * Melarang menurunkan SUPER_ADMIN terakhir di sistem.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(['SUPER_ADMIN'])
    if ('error' in auth) return auth.error
    const { id } = await ctx.params

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const role = String(body?.role ?? '').trim()
    if (!(USER_ROLES as string[]).includes(role)) {
      return NextResponse.json(
        { error: 'Peran tidak valid (SUPER_ADMIN, EDITOR, REVIEWER, atau CONTRIBUTOR).' },
        { status: 400 },
      )
    }

    const target = await db.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 })
    }

    // Lindungi SUPER_ADMIN terakhir dari penurunan peran (termasuk oleh diri sendiri).
    if (target.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      const superAdminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } })
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { error: 'Minimal harus ada satu administrator.' },
          { status: 400 },
        )
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: { role },
      include: { _count: { select: { contributions: true } } },
    })

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: asRole(updated.role),
        createdAt: updated.createdAt.toISOString(),
        contributionCount: updated._count.contributions,
      },
    })
  } catch (err) {
    console.error('PATCH /api/admin/users/[id]/role', err)
    return NextResponse.json({ error: 'Gagal mengubah peran pengguna' }, { status: 500 })
  }
}
