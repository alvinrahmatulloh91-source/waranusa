import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { requireRole } from '@/lib/auth'
import { slugify } from '@/lib/serialize'
import { ISLAND_GROUPS } from '@/data/islands'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EDITOR_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR']
const ISLAND_KEYS = ISLAND_GROUPS.map((g) => g.key)

/** PATCH /api/admin/provinces/[id] — perbarui provinsi (slug boleh diubah selama tidak duplikat). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error
    const { id } = await ctx.params

    const existing = await db.province.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Provinsi tidak ditemukan.' }, { status: 404 })
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data provinsi tidak valid.' }, { status: 400 })

    const data: Prisma.ProvinceUpdateInput = {}

    if ('name' in body) {
      const name = String(body.name ?? '').trim()
      if (name.length < 2 || name.length > 80) {
        return NextResponse.json({ error: 'Nama provinsi harus 2-80 karakter.' }, { status: 400 })
      }
      if (name !== existing.name) {
        const dup = await db.province.findUnique({ where: { name }, select: { id: true } })
        if (dup) return NextResponse.json({ error: 'Nama provinsi sudah terdaftar.' }, { status: 409 })
      }
      data.name = name
    }
    if ('slug' in body) {
      const slug = slugify(String(body.slug ?? ''))
      if (!slug) return NextResponse.json({ error: 'Slug provinsi tidak valid.' }, { status: 400 })
      if (slug !== existing.slug) {
        const dup = await db.province.findUnique({ where: { slug }, select: { id: true } })
        if (dup) {
          return NextResponse.json({ error: 'Slug provinsi sudah digunakan.' }, { status: 409 })
        }
      }
      data.slug = slug
    }
    if ('island' in body) {
      const island = String(body.island ?? '').trim()
      if (!ISLAND_KEYS.includes(island)) {
        return NextResponse.json(
          { error: `Gugus pulau tidak valid. Pilihan: ${ISLAND_KEYS.join(', ')}.` },
          { status: 400 },
        )
      }
      data.island = island
    }
    if ('capital' in body) {
      const capital = String(body.capital ?? '').trim()
      if (!capital) return NextResponse.json({ error: 'Ibu kota wajib diisi.' }, { status: 400 })
      data.capital = capital
    }
    if ('lat' in body) {
      const lat = Number(body.lat)
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({ error: 'Latitude tidak valid (-90..90).' }, { status: 400 })
      }
      data.lat = lat
    }
    if ('lng' in body) {
      const lng = Number(body.lng)
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        return NextResponse.json({ error: 'Longitude tidak valid (-180..180).' }, { status: 400 })
      }
      data.lng = lng
    }
    if ('motto' in body) {
      const motto = String(body.motto ?? '').trim()
      if (!motto) return NextResponse.json({ error: 'Motto wajib diisi.' }, { status: 400 })
      data.motto = motto
    }
    if ('description' in body) {
      const description = String(body.description ?? '').trim()
      if (!description) return NextResponse.json({ error: 'Deskripsi wajib diisi.' }, { status: 400 })
      data.description = description
    }
    if ('history' in body) {
      const history = String(body.history ?? '').trim()
      if (!history) return NextResponse.json({ error: 'Sejarah wajib diisi.' }, { status: 400 })
      data.history = history
    }
    if ('traditions' in body) {
      const traditions = String(body.traditions ?? '').trim()
      if (!traditions) return NextResponse.json({ error: 'Tradisi wajib diisi.' }, { status: 400 })
      data.traditions = traditions
    }

    const province = await db.province.update({ where: { id }, data })
    return NextResponse.json({ province })
  } catch (err) {
    console.error('PATCH /api/admin/provinces/[id]', err)
    return NextResponse.json({ error: 'Gagal memperbarui provinsi' }, { status: 500 })
  }
}
