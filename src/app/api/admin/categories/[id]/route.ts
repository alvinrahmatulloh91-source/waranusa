import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { requireRole } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

const EDITOR_PLUS: UserRole[] = ['SUPER_ADMIN', 'EDITOR']

/** PATCH /api/admin/categories/[id] — ubah metadata kategori (KEY tidak boleh diubah). */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(EDITOR_PLUS)
    if ('error' in auth) return auth.error
    const { id } = await ctx.params

    const existing = await db.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan.' }, { status: 404 })
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Data kategori tidak valid.' }, { status: 400 })

    if ('key' in body) {
      return NextResponse.json({ error: 'Key kategori tidak dapat diubah.' }, { status: 400 })
    }

    const data: Prisma.CategoryUpdateInput = {}
    if ('label' in body) {
      const label = String(body.label ?? '').trim()
      if (label.length < 3 || label.length > 40) {
        return NextResponse.json({ error: 'Label kategori harus 3-40 karakter.' }, { status: 400 })
      }
      data.label = label
    }
    if ('description' in body) {
      const description = String(body.description ?? '').trim()
      if (!description) {
        return NextResponse.json({ error: 'Deskripsi kategori wajib diisi.' }, { status: 400 })
      }
      data.description = description
    }
    if ('icon' in body) {
      const icon = String(body.icon ?? '').trim()
      if (!icon) return NextResponse.json({ error: 'Ikon wajib diisi.' }, { status: 400 })
      data.icon = icon
    }
    if ('image' in body) {
      const image = String(body.image ?? '').trim()
      if (!image) return NextResponse.json({ error: 'Gambar wajib diisi.' }, { status: 400 })
      data.image = image
    }

    const category = await db.category.update({ where: { id }, data })
    return NextResponse.json({ category })
  } catch (err) {
    console.error('PATCH /api/admin/categories/[id]', err)
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 })
  }
}
