/**
 * WaraNusa — Helper slug (ala Laravel Str::slug + unique rule)
 */
import type { PrismaClient } from "@prisma/client";

/** Ubah teks menjadi slug: lowercase, a-z0-9, pemisah "-" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // buang diakritik
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
    .replace(/-+$/g, "");
}

/**
 * Pastikan slug unik pada model tertentu; bila sudah dipakai, tambahkan suffix -2, -3, ...
 * excludeId dipakai saat update agar slug milik record itu sendiri dianggap tersedia.
 */
export async function uniqueSlug(
  client: PrismaClient,
  model: "culturalItem" | "category",
  base: string,
  excludeId?: string
): Promise<string> {
  const root = slugify(base) || (model === "culturalItem" ? "objek-budaya" : "kategori");
  for (let i = 0; ; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (model === "culturalItem") {
      const found = await client.culturalItem.findUnique({ where: { slug: candidate }, select: { id: true } });
      if (!found || found.id === excludeId) return candidate;
    } else {
      const found = await client.category.findUnique({ where: { slug: candidate }, select: { id: true } });
      if (!found || found.id === excludeId) return candidate;
    }
  }
}
