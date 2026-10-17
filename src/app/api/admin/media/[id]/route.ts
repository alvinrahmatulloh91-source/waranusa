import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { mapMediaAsset } from '@/lib/serialize'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const WRITE_ROLES: UserRole[] = ['SUPER_ADMIN', 'EDITOR']
const VALID_TYPES = ['IMAGE', 'AUDIO', 'MODEL_3D', 'VIDEO']

/** PATCH /api/admin/media/[id] — update aset media */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(WRITE_ROLES)
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    const existing = await db.mediaAsset.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Aset media tidak ditemukan.' }, { status: 404 })
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data update tidak valid.' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (typeof body.title === 'string') data.title = body.title.trim()
    if (typeof body.type === 'string' && VALID_TYPES.includes(body.type.trim())) data.type = body.type.trim()
    if (typeof body.url === 'string') data.url = body.url.trim()
    if (body.license !== undefined) data.license = typeof body.license === 'string' ? body.license.trim() || null : null
    if (body.creator !== undefined) data.creator = typeof body.creator === 'string' ? body.creator.trim() || null : null
    if (body.sourceUrl !== undefined) data.sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() || null : null
    if (body.caption !== undefined) data.caption = typeof body.caption === 'string' ? body.caption.trim() || null : null
    if (body.itemId !== undefined) data.itemId = typeof body.itemId === 'string' && body.itemId.trim() ? body.itemId.trim() : null
    if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured)

    const updated = await db.mediaAsset.update({
      where: { id },
      data,
      include: {
        culturalItem: {
          select: { id: true, name: true, category: true },
        },
      },
    })

    return NextResponse.json({ media: mapMediaAsset(updated) })
  } catch (err) {
    console.error('PATCH /api/admin/media/[id]', err)
    return NextResponse.json({ error: 'Gagal memperbarui aset media' }, { status: 500 })
  }
}

/** DELETE /api/admin/media/[id] — hapus aset media */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(WRITE_ROLES)
    if ('error' in auth) return auth.error

    const { id } = await ctx.params
    const existing = await db.mediaAsset.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Aset media tidak ditemukan.' }, { status: 404 })
    }

    await db.mediaAsset.delete({ where: { id } })
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('DELETE /api/admin/media/[id]', err)
    return NextResponse.json({ error: 'Gagal menghapus aset media' }, { status: 500 })
  }
}
