/**
 * Publikasi kontribusi komunitas menjadi CulturalItem (dipakai admin status API).
 * - Kontribusi tanpa provinsi tidak dapat dipublikasikan (item wajib punya provinsi);
 *   createdItemId tetap null.
 * - Item dibuat berstatus PUBLISHED + needsReview=true (menunggu verifikasi kurator).
 * - Sumber dibuat dari sourceRef kontributor.
 */
import { db } from '@/lib/db'

const CATEGORY_IMAGE: Record<string, string> = {
  RUMAH_ADAT: '/images/rumah-adat.png',
  PAKAIAN_ADAT: '/images/pakaian-adat.png',
  ALAT_MUSIK: '/images/alat-musik.png',
  TARIAN: '/images/tarian.png',
  MAKANAN: '/images/makanan.png',
}

/** Kalimat pertama konten, dipotong maksimal 160 karakter. */
function toShortDesc(content: string): string {
  const firstSentence = content.split(/(?<=[.!?])\s/)[0] ?? content
  return firstSentence.length > 160 ? `${firstSentence.slice(0, 157)}...` : firstSentence
}

/**
 * Buat CulturalItem dari kontribusi (bila belum pernah dibuat).
 * Mengembalikan id item yang dibuat, atau null bila tidak memenuhi syarat.
 */
export async function publishContribution(contributionId: string): Promise<string | null> {
  const contribution = await db.contribution.findUnique({ where: { id: contributionId } })
  if (!contribution) return null
  if (contribution.createdItemId) return contribution.createdItemId
  if (!contribution.provinceId) return null // item wajib terikat provinsi

  const item = await db.culturalItem.create({
    data: {
      provinceId: contribution.provinceId,
      category: contribution.category,
      name: contribution.title,
      shortDesc: toShortDesc(contribution.content),
      description: contribution.content,
      philosophy: 'Belum didokumentasikan — perlu tinjauan kurator.',
      imageUrl: CATEGORY_IMAGE[contribution.category] ?? null,
      playable: false,
      status: 'PUBLISHED',
      needsReview: true,
      sources: {
        create: [
          {
            title: contribution.sourceRef || 'Referensi kontributor',
            note: 'Dikirim melalui kontribusi komunitas — perlu verifikasi kurator.',
          },
        ],
      },
    },
    select: { id: true },
  })

  await db.contribution.update({
    where: { id: contribution.id },
    data: { createdItemId: item.id },
  })

  return item.id
}
