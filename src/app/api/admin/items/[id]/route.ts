import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { requireRole } from '@/lib/auth'
import { mapItem } from '@/lib/serialize'
import { parseItemBody } from '@/lib/admin-item'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EDITOR_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR']

/** PATCH /api/admin/items/[id] — perbarui item (status semua ItemStatus; sources diganti penuh bila dikirim). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error
    const { id } = await ctx.params

    const existing = await db.culturalItem.findUnique({
      where: { id },
      select: { id: true, needsReview: true, sources: { select: { url: true, publisher: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Item tidak ditemukan.' }, { status: 404 })
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data item tidak valid.' }, { status: 400 })

    const { error, fields } = parseItemBody(body, true)
    if (error || !fields) {
      return NextResponse.json({ error: error ?? 'Data item tidak valid.' }, { status: 400 })
    }

    if (fields.status === 'PUBLISHED') {
      const sourceRows = fields.sources ?? existing.sources
      const hasTraceableSource = sourceRows.some((source) => source.url || source.publisher)
      const reviewPending = fields.needsReview ?? existing.needsReview
      if (!hasTraceableSource || reviewPending) {
        return NextResponse.json(
          { error: 'Konten hanya dapat dipublikasikan setelah memiliki sumber yang dapat diperiksa dan tinjauan sumber ditandai selesai.' },
          { status: 400 },
        )
      }
    }

    if (fields.slug) {
      const slugOwner = await db.culturalItem.findFirst({
        where: { slug: fields.slug, id: { not: id } }, select: { id: true },
      })
      if (slugOwner) {
        return NextResponse.json({ error: 'Slug sudah digunakan oleh objek budaya lain.' }, { status: 409 })
      }
    }

    if (fields.category !== undefined) {
      const categoryRow = await db.category.findUnique({
        where: { key: fields.category },
        select: { id: true },
      })
      if (!categoryRow) {
        return NextResponse.json({ error: 'Kategori tidak valid.' }, { status: 400 })
      }
    }
    if (fields.provinceId !== undefined) {
      const provinceRow = await db.province.findUnique({
        where: { id: fields.provinceId },
        select: { id: true },
      })
      if (!provinceRow) {
        return NextResponse.json({ error: 'Provinsi tidak ditemukan.' }, { status: 400 })
      }
    }

    // Whitelist: hanya field yang memang dikirim yang diperbarui.
    const data: Prisma.CulturalItemUncheckedUpdateInput = {}
    if (fields.name !== undefined) data.name = fields.name
    if (fields.slug !== undefined) data.slug = fields.slug
    if (fields.region !== undefined) data.region = fields.region
    if (fields.shortDesc !== undefined) data.shortDesc = fields.shortDesc
    if (fields.description !== undefined) data.description = fields.description
    if (fields.history !== undefined) data.history = fields.history
    if (fields.culturalFunction !== undefined) data.culturalFunction = fields.culturalFunction
    if (fields.philosophy !== undefined) data.philosophy = fields.philosophy
    if (fields.imageUrl !== undefined) data.imageUrl = fields.imageUrl
    if (fields.model3d !== undefined) data.model3d = fields.model3d
    if (fields.playable !== undefined) data.playable = fields.playable
    if (fields.parts !== undefined) data.parts = fields.parts
    if (fields.sounds !== undefined) data.sounds = fields.sounds
    if (fields.melody !== undefined) data.melody = fields.melody
    if (fields.status !== undefined) data.status = fields.status
    if (fields.needsReview !== undefined) data.needsReview = fields.needsReview
    if (fields.isDemonstration !== undefined) data.isDemonstration = fields.isDemonstration
    if (fields.category !== undefined) data.category = fields.category
    if (fields.provinceId !== undefined) data.provinceId = fields.provinceId

    await db.culturalItem.update({ where: { id }, data })

    // Bila array sources dikirim → hapus lalu buat ulang (replace penuh).
    if (fields.sources !== undefined) {
      await db.culturalSource.deleteMany({ where: { itemId: id } })
      if (fields.sources.length > 0) {
        await db.culturalSource.createMany({
          data: fields.sources.map((s) => ({ ...s, itemId: id })),
        })
      }
    }

    const item = await db.culturalItem.findUnique({
      where: { id },
      include: {
        sources: { orderBy: { createdAt: 'asc' } },
        province: { select: { name: true, slug: true, island: true } },
      },
    })
    if (!item) {
      return NextResponse.json({ error: 'Item tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ item: mapItem(item) })
  } catch (err) {
    console.error('PATCH /api/admin/items/[id]', err)
    return NextResponse.json({ error: 'Gagal memperbarui item' }, { status: 500 })
  }
}
