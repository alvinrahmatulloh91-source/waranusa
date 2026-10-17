import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/categories — metadata kategori + jumlah item PUBLISHED per kategori. */
export async function GET() {
  try {
    const [categories, counts] = await Promise.all([
      db.category.findMany({ orderBy: { createdAt: 'asc' } }),
      db.culturalItem.groupBy({
        by: ['category'],
        where: { status: 'PUBLISHED' },
        _count: { _all: true },
      }),
    ])

    const countMap = new Map(counts.map((c) => [c.category, c._count._all]))

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        key: c.key,
        label: c.label,
        description: c.description,
        icon: c.icon,
        image: c.image,
        itemCount: countMap.get(c.key) ?? 0,
      })),
    })
  } catch (err) {
    console.error('GET /api/categories', err)
    return NextResponse.json({ error: 'Gagal memuat kategori' }, { status: 500 })
  }
}
