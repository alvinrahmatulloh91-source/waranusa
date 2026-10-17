import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { slugify } from '@/lib/serialize'
import { ISLAND_GROUPS } from '@/data/islands'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EDITOR_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR']
const ISLAND_KEYS = ISLAND_GROUPS.map((g) => g.key)

/** GET /api/admin/provinces — semua provinsi + jumlah item (semua status). */
export async function GET() {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error

    const provinces = await db.province.findMany({
      orderBy: { name: 'asc' },
      include: {
        items: { select: { id: true } },
        contributions: { where: { status: 'APPROVED' }, select: { id: true } },
      },
    })

    return NextResponse.json({
      provinces: provinces.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        island: p.island,
        capital: p.capital,
        lat: p.lat,
        lng: p.lng,
        motto: p.motto,
        description: p.description,
        history: p.history,
        traditions: p.traditions,
        itemCount: p.items.length,
        communityCount: p.contributions.length,
      })),
    })
  } catch (err) {
    console.error('GET /api/admin/provinces', err)
    return NextResponse.json({ error: 'Gagal memuat provinsi admin' }, { status: 500 })
  }
}

/** POST /api/admin/provinces — tambah provinsi baru. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data provinsi tidak valid.' }, { status: 400 })

    const name = String(body.name ?? '').trim()
    const slugInput = String(body.slug ?? '').trim()
    const island = String(body.island ?? '').trim()
    const capital = String(body.capital ?? '').trim()
    const motto = String(body.motto ?? '').trim()
    const description = String(body.description ?? '').trim()
    const history = String(body.history ?? '').trim()
    const traditions = String(body.traditions ?? '').trim()
    const lat = Number(body.lat)
    const lng = Number(body.lng)

    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: 'Nama provinsi harus 2-80 karakter.' }, { status: 400 })
    }
    if (!ISLAND_KEYS.includes(island)) {
      return NextResponse.json(
        { error: `Gugus pulau tidak valid. Pilihan: ${ISLAND_KEYS.join(', ')}.` },
        { status: 400 },
      )
    }
    if (!capital) return NextResponse.json({ error: 'Ibu kota wajib diisi.' }, { status: 400 })
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return NextResponse.json({ error: 'Latitude tidak valid (-90..90).' }, { status: 400 })
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return NextResponse.json({ error: 'Longitude tidak valid (-180..180).' }, { status: 400 })
    }
    if (!motto || !description || !history || !traditions) {
      return NextResponse.json(
        { error: 'Motto, deskripsi, sejarah, dan tradisi wajib diisi.' },
        { status: 400 },
      )
    }

    const slug = slugInput ? slugify(slugInput) : slugify(name)
    if (!slug) return NextResponse.json({ error: 'Slug provinsi tidak valid.' }, { status: 400 })

    const dupName = await db.province.findUnique({ where: { name }, select: { id: true } })
    if (dupName) {
      return NextResponse.json({ error: 'Nama provinsi sudah terdaftar.' }, { status: 409 })
    }
    const dupSlug = await db.province.findUnique({ where: { slug }, select: { id: true } })
    if (dupSlug) {
      return NextResponse.json({ error: 'Slug provinsi sudah digunakan.' }, { status: 409 })
    }

    const province = await db.province.create({
      data: { name, slug, island, capital, lat, lng, motto, description, history, traditions },
    })

    return NextResponse.json({ province }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/provinces', err)
    return NextResponse.json({ error: 'Gagal membuat provinsi' }, { status: 500 })
  }
}
