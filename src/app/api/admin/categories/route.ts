import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EDITOR_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR']
const KEY_RE = /^[A-Z][A-Z0-9_]{2,29}$/

/** GET /api/admin/categories — semua kategori + jumlah item terpublikasi. */
export async function GET() {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error

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
    console.error('GET /api/admin/categories', err)
    return NextResponse.json({ error: 'Gagal memuat kategori admin' }, { status: 500 })
  }
}

/** POST /api/admin/categories — buat kategori baru (key UPPER_SNAKE unik). */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data kategori tidak valid.' }, { status: 400 })

    const key = String(body.key ?? '').trim()
    const label = String(body.label ?? '').trim()
    const description = String(body.description ?? '').trim()
    const icon = String(body.icon ?? '').trim() || 'Shapes'
    const image = String(body.image ?? '').trim() || '/images/arsip-banner.png'

    if (!KEY_RE.test(key)) {
      return NextResponse.json(
        { error: 'Key harus 3-30 karakter: huruf besar/angka/underscore, diawali huruf (contoh: SENI_PERTUKAN).' },
        { status: 400 },
      )
    }
    if (label.length < 3 || label.length > 40) {
      return NextResponse.json({ error: 'Label kategori harus 3-40 karakter.' }, { status: 400 })
    }
    if (!description) {
      return NextResponse.json({ error: 'Deskripsi kategori wajib diisi.' }, { status: 400 })
    }

    const dup = await db.category.findUnique({ where: { key }, select: { id: true } })
    if (dup) {
      return NextResponse.json({ error: 'Key kategori sudah digunakan.' }, { status: 409 })
    }

    const category = await db.category.create({
      data: { key, label, description, icon, image },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/categories', err)
    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 })
  }
}
