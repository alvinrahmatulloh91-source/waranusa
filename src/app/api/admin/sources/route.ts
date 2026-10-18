import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import type { UserRole } from '@/lib/types'
import { isSafeContentUrl } from '@/lib/admin-item'

export const dynamic = 'force-dynamic'

const READ_ROLES: UserRole[] = ['SUPER_ADMIN', 'EDITOR', 'REVIEWER']
const WRITE_ROLES: UserRole[] = ['SUPER_ADMIN', 'EDITOR']

/** GET /api/admin/sources — daftar semua sumber dengan filter & paginasi */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(READ_ROLES)
    if ('error' in auth) return auth.error

    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim()
    const itemId = sp.get('itemId')?.trim()
    const license = sp.get('license')?.trim()
    const pageRaw = Number(sp.get('page') ?? 1)
    const pageSizeRaw = Number(sp.get('pageSize') ?? 30)
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw >= 1 ? Math.min(Math.floor(pageSizeRaw), 100) : 30

    const where: Prisma.CulturalSourceWhereInput = {}
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { publisher: { contains: q } },
        { license: { contains: q } },
        { note: { contains: q } },
        { culturalItem: { is: { name: { contains: q } } } },
      ]
    }
    if (itemId && itemId !== 'ALL') {
      where.itemId = itemId
    }
    if (license && license !== 'ALL') {
      where.license = { contains: license }
    }

    const [total, rows] = await Promise.all([
      db.culturalSource.count({ where }),
      db.culturalSource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          culturalItem: {
            select: { id: true, name: true, category: true, status: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      sources: rows.map((s) => ({
        id: s.id,
        itemId: s.itemId,
        title: s.title,
        url: s.url,
        publisher: s.publisher,
        year: s.year,
        license: s.license,
        note: s.note,
        createdAt: s.createdAt.toISOString(),
        culturalItem: s.culturalItem,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch (err) {
    console.error('GET /api/admin/sources', err)
    return NextResponse.json({ error: 'Gagal memuat sumber admin' }, { status: 500 })
  }
}

/** POST /api/admin/sources — buat sumber baru terkait objek budaya */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(WRITE_ROLES)
    if ('error' in auth) return auth.error

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data sumber tidak valid.' }, { status: 400 })

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const url = typeof body.url === 'string' ? body.url.trim() : null
    const publisher = typeof body.publisher === 'string' ? body.publisher.trim() : null
    const year = typeof body.year === 'string' ? body.year.trim() : null
    const license = typeof body.license === 'string' ? body.license.trim() : null
    const note = typeof body.note === 'string' ? body.note.trim() : null
    const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : ''

    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'Judul sumber minimal 3 karakter.' }, { status: 400 })
    }
    if (!itemId) {
      return NextResponse.json({ error: 'Objek budaya wajib dipilih.' }, { status: 400 })
    }
    if (url && !isSafeContentUrl(url, true)) {
      return NextResponse.json({ error: 'URL sumber harus menggunakan HTTP atau HTTPS.' }, { status: 400 })
    }

    const item = await db.culturalItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    })
    if (!item) {
      return NextResponse.json({ error: 'Objek budaya tidak ditemukan.' }, { status: 400 })
    }

    const created = await db.culturalSource.create({
      data: {
        itemId,
        title,
        url: url || null,
        publisher: publisher || null,
        year: year || null,
        license: license || null,
        note: note || null,
      },
      include: {
        culturalItem: {
          select: { id: true, name: true, category: true, status: true },
        },
      },
    })

    return NextResponse.json({ source: created }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/sources', err)
    return NextResponse.json({ error: 'Gagal membuat sumber' }, { status: 500 })
  }
}
