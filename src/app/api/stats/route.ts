import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/stats — statistik publik (item hanya yang PUBLISHED). */
export async function GET() {
  try {
    const [provinces, items, playable, approved, pending] = await Promise.all([
      db.province.count(),
      db.culturalItem.count({ where: { status: 'PUBLISHED' } }),
      db.culturalItem.count({ where: { status: 'PUBLISHED', playable: true } }),
      db.contribution.count({ where: { status: 'APPROVED' } }),
      db.contribution.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    ])

    return NextResponse.json({
      stats: { provinces, items, playable, approved, pending },
    })
  } catch (err) {
    console.error('GET /api/stats', err)
    return NextResponse.json({ error: 'Gagal memuat statistik' }, { status: 500 })
  }
}
