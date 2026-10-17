import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/items/[id]/sources — daftar sumber & atribusi objek budaya */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const item = await db.culturalItem.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    })
    if (!item || item.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Objek budaya tidak ditemukan.' }, { status: 404 })
    }

    const sources = await db.culturalSource.findMany({
      where: { itemId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      itemId: id,
      itemName: item.name,
      sources,
    })
  } catch (err) {
    console.error('GET /api/items/[id]/sources', err)
    return NextResponse.json({ error: 'Gagal memuat sumber objek budaya' }, { status: 500 })
  }
}
