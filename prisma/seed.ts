/**
 * Seed WaraNusa — kategori, pengguna demo, provinsi + item budaya (berelasi
 * CulturalSource), dan kontribusi contoh dengan alur moderasi baru.
 * Idempotent: membersihkan seluruh tabel sesuai urutan FK.
 * Jalankan: bun prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { SUMATRA_JAWA } from '../src/data/seed/provinces-a'
import { BALI_NUSA_PAPUA } from '../src/data/seed/provinces-b'
import { CATEGORIES } from '../src/data/islands'
import { hashPassword } from '../src/lib/password'

const db = new PrismaClient()

const DEMO_PASSWORD = 'waranusa123'

const CATEGORY_IMAGE: Record<string, string> = {
  RUMAH_ADAT: '/images/rumah-adat.png',
  PAKAIAN_ADAT: '/images/pakaian-adat.png',
  ALAT_MUSIK: '/images/alat-musik.png',
  TARIAN: '/images/tarian.png',
  MAKANAN: '/images/makanan.png',
}

const DEMO_USERS = [
  { email: 'admin@waranusa.id', name: 'Administrator WaraNusa', role: 'SUPER_ADMIN' },
  { email: 'editor@waranusa.id', name: 'Editor Konten', role: 'EDITOR' },
  { email: 'kurator@waranusa.id', name: 'Kurator Budaya', role: 'REVIEWER' },
  { email: 'warga@waranusa.id', name: 'Warga Nusantara', role: 'CONTRIBUTOR' },
]

function licenseFor(url?: string): string | null {
  return url && url.includes('wikipedia.org') ? 'CC BY-SA — Wikipedia' : null
}

async function main() {
  console.log('Seeding WaraNusa...')

  // Reset menyeluruh (idempotent) mengikuti urutan FK:
  // reviews → contributions → sessions → sources → items → categories → provinces → users
  await db.moderationReview.deleteMany()
  await db.contribution.deleteMany()
  await db.session.deleteMany()
  await db.culturalSource.deleteMany()
  await db.culturalItem.deleteMany()
  await db.category.deleteMany()
  await db.province.deleteMany()
  await db.user.deleteMany()

  // Kategori dari konstanta bersama
  for (const c of CATEGORIES) {
    await db.category.create({
      data: { key: c.key, label: c.label, description: c.desc, icon: c.icon, image: c.image },
    })
  }
  console.log(`  ✓ ${CATEGORIES.length} kategori`)

  // Pengguna demo
  const users: Record<string, string> = {}
  for (const u of DEMO_USERS) {
    const created = await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: hashPassword(DEMO_PASSWORD),
      },
    })
    users[u.role] = created.id
    console.log(`  ✓ ${u.role}: ${u.email}`)
  }

  // Provinsi + item budaya (status PUBLISHED + baris sumber)
  let itemCount = 0
  let sourceCount = 0
  for (const p of [...SUMATRA_JAWA, ...BALI_NUSA_PAPUA]) {
    const province = await db.province.create({
      data: {
        name: p.name,
        slug: p.slug,
        island: p.island,
        capital: p.capital,
        lat: p.lat,
        lng: p.lng,
        motto: p.motto,
        description: p.description,
        history: p.history,
        traditions: p.traditions,
      },
    })

    for (const it of p.items) {
      await db.culturalItem.create({
        data: {
          provinceId: province.id,
          category: it.category,
          name: it.name,
          region: it.region ?? null,
          shortDesc: it.shortDesc,
          description: it.description,
          philosophy: it.philosophy,
          imageUrl: CATEGORY_IMAGE[it.category] ?? null,
          model3d: it.model3d ?? null,
          parts: it.parts ? JSON.stringify(it.parts) : null,
          playable: it.playable ?? false,
          sounds: it.sounds ? JSON.stringify(it.sounds) : null,
          melody: it.melody ? JSON.stringify(it.melody) : null,
          status: 'PUBLISHED',
          needsReview: it.sources.length < 2,
          sources: {
            create: it.sources.map((s) => ({
              title: s.title,
              url: s.url ?? null,
              license: licenseFor(s.url),
            })),
          },
        },
      })
      itemCount++
      sourceCount += it.sources.length
    }
    console.log(`  ✓ ${p.name} (${p.items.length} item)`)
  }

  // Kontribusi contoh dengan alur moderasi baru
  const bali = await db.province.findUnique({ where: { slug: 'bali' } })
  const jateng = await db.province.findUnique({ where: { slug: 'jawa-tengah' } })

  const c1 = await db.contribution.create({
    data: {
      provinceId: jateng?.id ?? null,
      category: 'MAKANAN',
      title: 'Tahu Gimbal Semarang',
      content:
        'Tahu Gimbal adalah hidangan Semarang berupa tahu goreng, gimbal (udang rebus berbalut tepung), kol, dan telur, disiram kuah kacang pedas manis. Berasal dari kawasan Johar dan dikaitkan dengan pedagang Tionghoa-Jawa abad ke-19. Kuah kacangnya dibuat segar setiap hari agar rasa tetap gurih.',
      contributorName: 'Rina Kartika',
      sourceRef: 'Buku Kuliner Semarang, Komunitas Kuliner Nusantara',
      userId: users.CONTRIBUTOR,
      status: 'APPROVED',
      reviewNote: 'Konten akurat, relevan dengan kategori, ditambahkan ke arsip komunitas.',
      aiNote: 'Relevan dan faktual. Direkomendasikan untuk dipublikasikan.',
      reviewedAt: new Date(),
    },
  })
  await db.moderationReview.create({
    data: {
      contributionId: c1.id,
      reviewerId: users.REVIEWER,
      action: 'APPROVED',
      note: 'Konten akurat, relevan dengan kategori, ditambahkan ke arsip komunitas.',
    },
  })

  await db.contribution.create({
    data: {
      provinceId: bali?.id ?? null,
      category: 'TARIAN',
      title: 'Tari Baris War',
      content:
        'Baris War adalah tarian perang Bali yang menggambarkan pasukan raja berlatih sebelum berperang. Penari membawa payung, tombak, dan tameng dengan gerak yang gagah. Baris War dipentaskan saat upacara odalan pura di desa pembinaan.',
      contributorName: 'I Made Surya',
      sourceRef: 'Dokumentasi Festival Bali Arts Festival 2022',
      userId: users.CONTRIBUTOR,
      status: 'SUBMITTED',
      aiNote: 'Informasi tampak relevan; menunggu verifikasi kurator manusia.',
      reviewedAt: null,
    },
  })

  await db.contribution.create({
    data: {
      provinceId: null,
      category: 'ALAT_MUSIK',
      title: 'Angklung Caruk',
      content:
        'Angklung Caruk adalah kesenian rakyat Rejang Lebong, Bengkulu, berupa ansambel angklung yang dimainkan sambil menari dalam perayaan panen raya. Seluruh pemain memakai baju adat Rejang dengan hiasan manik.',
      contributorName: 'Dedi Mulyadi',
      sourceRef: 'Catatan lapangan Seni Budaya Bengkulu',
      userId: users.EDITOR,
      status: 'UNDER_REVIEW',
      aiNote: 'Perlu konfirmasi sumber primer.',
      reviewedAt: null,
    },
  })
  console.log('  ✓ 3 kontribusi contoh (APPROVED / SUBMITTED / UNDER_REVIEW)')

  const [catCount, userCount, provinceCount, itemTotal, srcTotal, contribTotal] = await Promise.all([
    db.category.count(),
    db.user.count(),
    db.province.count(),
    db.culturalItem.count(),
    db.culturalSource.count(),
    db.contribution.count(),
  ])
  console.log(
    `Selesai: ${catCount} kategori, ${userCount} pengguna, ${provinceCount} provinsi, ${itemTotal} item budaya, ${srcTotal} sumber, ${contribTotal} kontribusi.`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
