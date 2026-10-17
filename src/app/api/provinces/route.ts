import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/provinces — ringkasan semua provinsi (itemCount semua status, komunitas = kontribusi APPROVED). */
export async function GET() {
  try {
    const provinces = await db.province.findMany({
      orderBy: { name: 'asc' },
      include: {
        items: { select: { category: true } },
        contributions: { where: { status: 'APPROVED' }, select: { id: true } },
      },
    })

    const data = provinces.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      island: p.island,
      capital: p.capital,
      lat: p.lat,
      lng: p.lng,
      motto: p.motto,
      itemCount: p.items.length,
      communityCount: p.contributions.length,
    }))

    return NextResponse.json({ provinces: data })
  } catch (err) {
    console.error('GET /api/provinces', err)
    return NextResponse.json({ error: 'Gagal memuat provinsi' }, { status: 500 })
  }
}
