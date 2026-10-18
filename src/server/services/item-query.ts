/**
 * WaraNusa — Query builder untuk CulturalItem (publik & admin)
 * Catatan SQLite: `contains` di SQLite berjalan di atas LIKE sehingga
 * peka-huruf-besar/kecil untuk karakter ASCII (cocok untuk konten Indonesia).
 */
import type { Prisma } from "@prisma/client";
import { ITEM_STATUSES, type ItemStatus } from "@/lib/constants";

export type ItemSort = "newest" | "oldest" | "popular" | "title";

export function parseItemSort(v: string | null | undefined): ItemSort {
  return v === "oldest" || v === "popular" || v === "title" ? v : "newest";
}

export function itemOrderBy(sort: ItemSort): Prisma.CulturalItemOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "popular":
      return [{ viewCount: "desc" }, { createdAt: "desc" }];
    case "title":
      return [{ title: "asc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export interface ItemFilterOptions {
  search?: string | null;
  category?: string | null; // slug kategori
  region?: string | null; // kode wilayah
  status?: string | null; // khusus admin: DRAFT | PUBLISHED | ARCHIVED
  featured?: string | null; // khusus admin: "true" | "false"
  forcePublished?: boolean; // publik: hanya PUBLISHED
}

export function buildItemWhere(o: ItemFilterOptions): Prisma.CulturalItemWhereInput {
  const where: Prisma.CulturalItemWhereInput = {};
  if (o.forcePublished) {
    where.status = "PUBLISHED";
  } else if (o.status && (ITEM_STATUSES as readonly string[]).includes(o.status)) {
    where.status = o.status as ItemStatus;
  }
  if (o.featured === "true") where.featured = true;
  else if (o.featured === "false") where.featured = false;
  if (o.category) where.category = { slug: o.category };
  if (o.region) where.region = { code: o.region };
  if (o.search) {
    where.OR = [
      { title: { contains: o.search } },
      { summary: { contains: o.search } },
    ];
  }
  return where;
}
