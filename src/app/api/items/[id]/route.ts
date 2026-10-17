import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapItem } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

/** GET /api/items/[id] — detail item budaya (404 bila tidak ada / bukan PUBLISHED). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const item = await db.culturalItem.findUnique({
      where: { id },
      include: {
        sources: { orderBy: { createdAt: 'asc' } },
        mediaAssets: { orderBy: { createdAt: 'asc' } },
        province: { select: { name: true, slug: true, island: true } },
      },
    })
    if (!item || item.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Item tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ item: mapItem(item) })
  } catch (err) {
    console.error('GET /api/items/[id]', err)
    return NextResponse.json({ error: 'Gagal memuat detail item' }, { status: 500 })
  }
}
