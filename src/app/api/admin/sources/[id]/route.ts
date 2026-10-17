import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const WRITE_ROLES: UserRole[] = ['SUPER_ADMIN', 'EDITOR']

/** PATCH /api/admin/sources/[id] — update sumber */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(WRITE_ROLES)
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    const existing = await db.culturalSource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sumber tidak ditemukan.' }, { status: 404 })
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data update tidak valid.' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim()
    if (body.url !== undefined) data.url = typeof body.url === 'string' ? body.url.trim() || null : null
    if (body.publisher !== undefined) data.publisher = typeof body.publisher === 'string' ? body.publisher.trim() || null : null
    if (body.year !== undefined) data.year = typeof body.year === 'string' ? body.year.trim() || null : null
    if (body.license !== undefined) data.license = typeof body.license === 'string' ? body.license.trim() || null : null
    if (body.note !== undefined) data.note = typeof body.note === 'string' ? body.note.trim() || null : null
    if (body.itemId !== undefined && typeof body.itemId === 'string' && body.itemId.trim()) {
      data.itemId = body.itemId.trim()
    }

    const updated = await db.culturalSource.update({
      where: { id },
      data,
      include: {
        culturalItem: {
          select: { id: true, name: true, category: true, status: true },
        },
      },
    })

    return NextResponse.json({ source: updated })
  } catch (err) {
    console.error('PATCH /api/admin/sources/[id]', err)
    return NextResponse.json({ error: 'Gagal memperbarui sumber' }, { status: 500 })
  }
}

/** DELETE /api/admin/sources/[id] — hapus sumber */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(WRITE_ROLES)
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    const existing = await db.culturalSource.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sumber tidak ditemukan.' }, { status: 404 })
    }

    await db.culturalSource.delete({ where: { id } })
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('DELETE /api/admin/sources/[id]', err)
    return NextResponse.json({ error: 'Gagal menghapus sumber' }, { status: 500 })
  }
}
