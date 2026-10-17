import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapItem, mapContribution } from '@/lib/serialize'

export const dynamic = 'force-dynamic'

/** GET /api/provinces/[slug] — detail provinsi: item PUBLISHED + kontribusi APPROVED. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params
    const province = await db.province.findUnique({
      where: { slug },
      include: {
        items: {
          where: { status: 'PUBLISHED' },
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
          include: { sources: { orderBy: { createdAt: 'asc' } } },
        },
        contributions: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { province: { select: { name: true, slug: true } } },
        },
      },
    })

    if (!province) {
      return NextResponse.json({ error: 'Provinsi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      province: {
        id: province.id,
        name: province.name,
        slug: province.slug,
        island: province.island,
        capital: province.capital,
        lat: province.lat,
        lng: province.lng,
        motto: province.motto,
        description: province.description,
        history: province.history,
        traditions: province.traditions,
        items: province.items.map(mapItem),
        contributions: province.contributions.map(mapContribution),
      },
    })
  } catch (err) {
    console.error('GET /api/provinces/[slug]', err)
    return NextResponse.json({ error: 'Gagal memuat detail provinsi' }, { status: 500 })
  }
}
