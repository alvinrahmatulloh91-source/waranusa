import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { mapContribution } from '@/lib/serialize'
import { USER_ROLES } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface ReviewResult {
  verdict: 'APPROVED' | 'PENDING' | 'REJECTED'
  note: string
}

/**
 * Pra-kurasi otomatis dengan LLM (z-ai-web-dev-sdk, backend only).
 * HASIL AI HANYA menjadi catatan `aiNote` — TIDAK menentukan status kontribusi.
 * Fallback null bila layan AI tidak tersedia.
 */
async function autoReview(payload: {
  title: string
  content: string
  category: string
  provinceName?: string
  sourceRef?: string
}): Promise<string | null> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'Anda adalah kurator WaraNusa, platform arsip warisan budaya Indonesia. ' +
            'Tugas Anda meninjau kontribusi warga sebelum dipublikasikan. ' +
            'Kriteria: (1) relevan dengan budaya/tradisi Indonesia dan kategori yang dipilih, ' +
            '(2) berisi informasi faktual yang masuk akal dan tidak menyesatkan, ' +
            '(3) bukan spam, promosi, atau konten tidak pantas, (4) minimal 1-2 kalimat yang informatif. ' +
            'Balas HANYA dengan JSON valid tanpa teks lain, format: ' +
            '{"verdict":"APPROVED|PENDING|REJECTED","note":"alasan singkat dalam bahasa Indonesia maksimal 2 kalimat"}. ' +
            'Gunakan APPROVED bila konten layak tayang, PENDING bila perlu verifikasi kurator manusia, REJECTED bila spam/tidak relevan/tidak pantas.',
        },
        {
          role: 'user',
          content:
            `Kategori: ${payload.category}\n` +
            `Provinsi: ${payload.provinceName ?? '(umum/tidak disebut)'}\n` +
            `Judul: ${payload.title}\n` +
            `Isi: ${payload.content}\n` +
            `Sumber: ${payload.sourceRef ?? '(tidak disebut)'}\n` +
            'Tinjau kontribusi ini dan berikan verdict JSON.',
        },
      ],
      thinking: { type: 'disabled' },
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0]) as ReviewResult
      if (parsed.note) return parsed.note
    }
    return null
  } catch (err) {
    console.error('autoReview gagal (aiNote dikosongkan):', err)
    return null
  }
}

/**
 * POST /api/contributions — kirim kontribusi (WAJIB login).
 * Status selalu SUBMITTED; aiNote diisi hasil pra-kurasi AI (opsional).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([...USER_ROLES])
    if ('error' in auth) return auth.error
    const sessionUser = auth.user

    const rl = checkRateLimit(`contrib:${sessionUser.id}`, 10, 60 * 1000)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' }, { status: 429 })
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ error: 'Data kontribusi tidak valid.' }, { status: 400 })
    }

    const title = String(body.title ?? '').trim()
    const content = String(body.content ?? '').trim()
    const category = String(body.category ?? '').trim()
    const sourceRef = String(body.sourceRef ?? '').trim() || null
    const provinceId = body.provinceId ? String(body.provinceId) : null

    if (title.length < 3 || title.length > 120) {
      return NextResponse.json({ error: 'Judul harus 3-120 karakter.' }, { status: 400 })
    }
    if (content.length < 20 || content.length > 4000) {
      return NextResponse.json({ error: 'Isi kontribusi harus 20-4000 karakter.' }, { status: 400 })
    }
    const categoryRow = await db.category.findUnique({ where: { key: category }, select: { id: true } })
    if (!categoryRow) {
      return NextResponse.json({ error: 'Kategori tidak valid.' }, { status: 400 })
    }
    let provinceName: string | undefined
    if (provinceId) {
      const province = await db.province.findUnique({
        where: { id: provinceId },
        select: { name: true },
      })
      if (!province) return NextResponse.json({ error: 'Provinsi tidak ditemukan.' }, { status: 400 })
      provinceName = province.name
    }

    // Pra-kurasi AI → hanya catatan, keputusan tetap di kurator manusia.
    const aiNote = await autoReview({ title, content, category, provinceName, sourceRef: sourceRef ?? undefined })

    const created = await db.contribution.create({
      data: {
        provinceId,
        category,
        title,
        content,
        contributorName: sessionUser.name,
        sourceRef,
        userId: sessionUser.id,
        status: 'SUBMITTED',
        aiNote,
        reviewedAt: null,
      },
      include: {
        province: { select: { name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ contribution: mapContribution(created) }, { status: 201 })
  } catch (err) {
    console.error('POST /api/contributions', err)
    return NextResponse.json({ error: 'Gagal mengirim kontribusi' }, { status: 500 })
  }
}
