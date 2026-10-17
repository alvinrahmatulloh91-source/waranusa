/**
 * Utilitas hash kata sandi (MURNI — tanpa next/headers).
 * Format tersimpan: `salt:hash` (keduanya hex). Dipakai oleh auth API & seed.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEYLEN = 64

/** Hash kata sandi dengan scrypt: salt acak 16 byte, keylen 64. */
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pw, salt, KEYLEN).toString('hex')
  return `${salt}:${hash}`
}

/** Verifikasi kata sandi terhadap hash tersimpan (aman dari timing attack). */
export function verifyPassword(pw: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const expected = Buffer.from(hash, 'hex')
    const actual = scryptSync(pw, salt, KEYLEN)
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}
