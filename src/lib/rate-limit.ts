/**
 * Rate limiter in-memory sederhana (fixed window per kunci).
 * Bucket disimpan di globalThis agar aman terhadap hot-reload dev server.
 */

interface Bucket {
  count: number
  resetAt: number
}

const globalForRateLimit = globalThis as unknown as {
  __waranusaRateLimit?: Map<string, Bucket>
}

const buckets: Map<string, Bucket> = globalForRateLimit.__waranusaRateLimit ?? new Map()
globalForRateLimit.__waranusaRateLimit = buckets

/**
 * Cek & catat satu permintaan untuk `key`.
 * - ok: true bila masih dalam kuota `limit` per `windowMs`.
 * - ok: false → retryAfterSec berisi detik menuju reset jendela.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now()

  // Pembersihan entri kadaluarsa agar Map tidak tumbuh tanpa batas.
  if (buckets.size > 500) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k)
    }
  }

  const entry = buckets.get(key)
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
  }
  entry.count += 1
  return { ok: true }
}
