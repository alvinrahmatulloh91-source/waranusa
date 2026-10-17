import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** GET /api/auth/me — user sesi saat ini (selalu 200; user null bila anonim). */
export async function GET() {
  try {
    const user = await getSessionUser()
    return NextResponse.json({ user })
  } catch (err) {
    console.error('GET /api/auth/me', err)
    return NextResponse.json({ user: null })
  }
}
