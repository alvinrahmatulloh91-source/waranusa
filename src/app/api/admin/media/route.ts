import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { mapMediaAsset } from '@/lib/serialize'
import type { Prisma } from '@prisma/client'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const READ_ROLES: UserRole[] = ['SUPER_ADMIN', 'EDITOR', 'REVIEWER']
const WRITE_ROLES: UserRole[] = ['SUPER_ADMIN', 'EDITOR']
const VALID_TYPES = ['IMAGE', 'AUDIO', 'MODEL_3D', 'VIDEO']

/** GET /api/admin/media — daftar aset media dengan filter & paginasi */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(READ_ROLES)
    if ('error' in auth) return auth.error

    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim()
    const type = sp.get('type')?.trim()
    const itemId = sp.get('itemId')?.trim()
    const pageRaw = Number(sp.get('page') ?? 1)
    const pageSizeRaw = Number(sp.get('pageSize') ?? 24)
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw >= 1 ? Math.min(Math.floor(pageSizeRaw), 100) : 24

    const where: Prisma.MediaAssetWhereInput = {}
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { license: { contains: q } },
        { creator: { contains: q } },
        { caption: { contains: q } },
      ]
    }
    if (type && VALID_TYPES.includes(type)) {
      where.type = type
    }
    if (itemId && itemId !== 'ALL') {
      where.itemId = itemId
    }

    const [total, rows] = await Promise.all([
      db.mediaAsset.count({ where }),
      db.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          culturalItem: {
            select: { id: true, name: true, category: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      media: rows.map(mapMediaAsset),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch (err) {
    console.error('GET /api/admin/media', err)
    return NextResponse.json({ error: 'Gagal memuat media admin' }, { status: 500 })
  }
}

/** POST /api/admin/media — tambah aset media baru */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(WRITE_ROLES)
    if ('error' in auth) return auth.error

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data media tidak valid.' }, { status: 400 })

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const type = typeof body.type === 'string' ? body.type.trim() : ''
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const license = typeof body.license === 'string' ? body.license.trim() : null
    const creator = typeof body.creator === 'string' ? body.creator.trim() : null
    const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : null
    const caption = typeof body.caption === 'string' ? body.caption.trim() : null
    const itemId = typeof body.itemId === 'string' && body.itemId.trim() ? body.itemId.trim() : null
    const isFeatured = Boolean(body.isFeatured)

    if (!title || title.length < 2) {
      return NextResponse.json({ error: 'Judul aset media minimal 2 karakter.' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipe media harus IMAGE, AUDIO, MODEL_3D, atau VIDEO.' }, { status: 400 })
    }
    if (!url || url.length < 3) {
      return NextResponse.json({ error: 'URL berkas/media wajib diisi.' }, { status: 400 })
    }

    if (itemId) {
      const itemExists = await db.culturalItem.findUnique({
        where: { id: itemId },
        select: { id: true },
      })
      if (!itemExists) {
        return NextResponse.json({ error: 'Objek budaya terkait tidak ditemukan.' }, { status: 400 })
      }
    }

    const created = await db.mediaAsset.create({
      data: {
        title,
        type,
        url,
        license: license || null,
        creator: creator || null,
        sourceUrl: sourceUrl || null,
        caption: caption || null,
        itemId,
        isFeatured,
      },
      include: {
        culturalItem: {
          select: { id: true, name: true, category: true },
        },
      },
    })

    return NextResponse.json({ media: mapMediaAsset(created) }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/media', err)
    return NextResponse.json({ error: 'Gagal membuat aset media' }, { status: 500 })
  }
}
