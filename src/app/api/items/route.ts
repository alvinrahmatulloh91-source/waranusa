import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { mapItem } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

/**
 * GET /api/items — arsip budaya (hanya item PUBLISHED).
 * Param: q, category (key), island, province (slug), playable=1, limit (maks 200).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim()
    const category = sp.get('category')
    const island = sp.get('island')
    const province = sp.get('province')
    const playable = sp.get('playable') === '1'
    const limitRaw = Number(sp.get('limit') ?? 200)
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, Math.floor(limitRaw)), 200) : 200

    const where: Prisma.CulturalItemWhereInput = { status: 'PUBLISHED' }
    if (category && category !== 'ALL') where.category = category
    if (playable) where.playable = true
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { shortDesc: { contains: q } },
        { description: { contains: q } },
        { region: { contains: q } },
        { province: { is: { name: { contains: q } } } },
      ]
    }
    if (province && province !== 'ALL') {
      where.province = { is: { slug: province } }
    } else if (island && island !== 'ALL') {
      where.province = { is: { island } }
    }

    const rows = await db.culturalItem.findMany({
      where,
      orderBy: [{ province: { name: 'asc' } }, { category: 'asc' }, { name: 'asc' }],
      take: limit,
      include: {
        sources: { orderBy: { createdAt: 'asc' } },
        province: { select: { name: true, slug: true, island: true } },
      },
    })

    return NextResponse.json({ items: rows.map(mapItem) })
  } catch (err) {
    console.error('GET /api/items', err)
    return NextResponse.json({ error: 'Gagal memuat arsip budaya' }, { status: 500 })
  }
}
