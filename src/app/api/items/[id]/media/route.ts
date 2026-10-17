import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapMediaAsset } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

/** GET /api/items/[id]/media — galeri aset media objek budaya */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const item = await db.culturalItem.findUnique({
      where: { id },
      select: { id: true, name: true, imageUrl: true, model3d: true, status: true },
    })
    if (!item || item.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Objek budaya tidak ditemukan.' }, { status: 404 })
    }

    const rows = await db.mediaAsset.findMany({
      where: { itemId: id },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      itemId: id,
      itemName: item.name,
      media: rows.map(mapMediaAsset),
    })
  } catch (err) {
    console.error('GET /api/items/[id]/media', err)
    return NextResponse.json({ error: 'Gagal memuat aset media objek budaya' }, { status: 500 })
  }
}
