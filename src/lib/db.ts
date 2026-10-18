import { PrismaClient } from '@prisma/client'

/**
 * Klien Prisma singleton dengan penanda versi skema.
 * Di dev, globalThis menyimpan instance antar-hot-reload; tanpa penanda versi,
 * instance LAMA (skema lama) tetap terpakai setelah `prisma db push`/`generate`.
 * Bump SCHEMA_VERSION setiap mengubah prisma/schema.prisma.
 */
const SCHEMA_VERSION = 'waranusa-schema-2026-10-17-v6'

const globalForPrisma = globalThis as unknown as {
  __waranusaPrisma?: PrismaClient
  __waranusaPrismaVersion?: string
}

function getClient(): PrismaClient {
  if (globalForPrisma.__waranusaPrismaVersion === SCHEMA_VERSION && globalForPrisma.__waranusaPrisma) {
    return globalForPrisma.__waranusaPrisma
  }
  // Lepas instance lama (versi skema berbeda) agar koneksi tidak menumpuk.
  const stale = globalForPrisma.__waranusaPrisma
  if (stale) {
    void stale.$disconnect().catch(() => undefined)
  }
  const client = new PrismaClient()
  globalForPrisma.__waranusaPrisma = client
  globalForPrisma.__waranusaPrismaVersion = SCHEMA_VERSION
  return client
}

export const db = getClient()
