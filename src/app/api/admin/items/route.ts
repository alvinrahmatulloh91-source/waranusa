import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { requireRole } from '@/lib/auth'
import { mapItem } from '@/lib/serialize'
import { parseItemBody } from '@/lib/admin-item'
import { ITEM_STATUSES, type UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EDITOR_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR']

/** GET /api/admin/items — daftar semua item (semua status) dengan filter + paginasi. */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error

    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim()
    const status = sp.get('status')?.trim()
    const province = sp.get('province')?.trim()
    const category = sp.get('category')?.trim()
    const pageRaw = Number(sp.get('page') ?? 1)
    const pageSizeRaw = Number(sp.get('pageSize') ?? 20)
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw >= 1 ? Math.min(Math.floor(pageSizeRaw), 50) : 20

    const where: Prisma.CulturalItemWhereInput = {}
    if (q) where.name = { contains: q }
    if (status && (ITEM_STATUSES as string[]).includes(status)) where.status = status
    if (province && province !== 'ALL') where.province = { is: { slug: province } }
    if (category && category !== 'ALL') where.category = category

    const [total, rows] = await Promise.all([
      db.culturalItem.count({ where }),
      db.culturalItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sources: { orderBy: { createdAt: 'asc' } },
          province: { select: { name: true, slug: true, island: true } },
        },
      }),
    ])

    return NextResponse.json({
      items: rows.map(mapItem),
      meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    })
  } catch (err) {
    console.error('GET /api/admin/items', err)
    return NextResponse.json({ error: 'Gagal memuat item admin' }, { status: 500 })
  }
}

/** POST /api/admin/items — buat item budaya baru (whitelist field). */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data item tidak valid.' }, { status: 400 })

    const { error, fields } = parseItemBody(body, false)
    if (error || !fields) {
      return NextResponse.json({ error: error ?? 'Data item tidak valid.' }, { status: 400 })
    }

    if (fields.status === 'PUBLISHED') {
      const hasTraceableSource = (fields.sources ?? []).some((source) => source.url || source.publisher)
      if (!hasTraceableSource || fields.needsReview) {
        return NextResponse.json(
          { error: 'Konten hanya dapat dipublikasikan setelah memiliki sumber yang dapat diperiksa dan tinjauan sumber ditandai selesai.' },
          { status: 400 },
        )
      }
    }

    if (await db.culturalItem.findUnique({ where: { slug: fields.slug ?? '' }, select: { id: true } })) {
      return NextResponse.json({ error: 'Slug sudah digunakan oleh objek budaya lain.' }, { status: 409 })
    }

    const categoryRow = await db.category.findUnique({
      where: { key: fields.category ?? '' },
      select: { id: true },
    })
    if (!categoryRow) {
      return NextResponse.json({ error: 'Kategori tidak valid.' }, { status: 400 })
    }
    const provinceRow = await db.province.findUnique({
      where: { id: fields.provinceId ?? '' },
      select: { id: true },
    })
    if (!provinceRow) {
      return NextResponse.json({ error: 'Provinsi tidak ditemukan.' }, { status: 400 })
    }

    const created = await db.culturalItem.create({
      data: {
        provinceId: fields.provinceId ?? '',
        slug: fields.slug,
        category: fields.category ?? '',
        name: fields.name ?? '',
        region: fields.region ?? null,
        shortDesc: fields.shortDesc ?? '',
        description: fields.description ?? '',
        history: fields.history ?? null,
        culturalFunction: fields.culturalFunction ?? null,
        philosophy: fields.philosophy ?? '',
        imageUrl: fields.imageUrl ?? null,
        model3d: fields.model3d ?? null,
        parts: fields.parts ?? null,
        playable: fields.playable ?? false,
        sounds: fields.sounds ?? null,
        melody: fields.melody ?? null,
        status: fields.status ?? 'DRAFT',
        needsReview: fields.needsReview ?? false,
        isDemonstration: fields.isDemonstration ?? false,
      },
      select: { id: true },
    })

    if (fields.sources && fields.sources.length > 0) {
      await db.culturalSource.createMany({
        data: fields.sources.map((s) => ({ ...s, itemId: created.id })),
      })
    }

    const item = await db.culturalItem.findUnique({
      where: { id: created.id },
      include: {
        sources: { orderBy: { createdAt: 'asc' } },
        province: { select: { name: true, slug: true, island: true } },
      },
    })

    return NextResponse.json({ item: item ? mapItem(item) : null }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/items', err)
    return NextResponse.json({ error: 'Gagal membuat item' }, { status: 500 })
  }
}
