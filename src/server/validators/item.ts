/**
 * WaraNusa — Validator objek budaya (CulturalItem) & hotspot
 */
import { z } from "zod";
import { ITEM_STATUSES, SOURCE_TYPES } from "@/lib/constants";

/** URL opsional: kosong/null boleh; bila diisi harus http(s) */
const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL maksimal 500 karakter.")
  .optional()
  .nullable()
  .refine((v) => !v || /^https?:\/\/\S+$/.test(v), "URL tidak valid (harus diawali http:// atau https://).");

export const sourceInputSchema = z.object({
  title: z.string().trim().min(1, "Judul sumber wajib diisi.").max(300, "Judul sumber maksimal 300 karakter."),
  creator: z.string().trim().max(160, "Pencipta maksimal 160 karakter.").optional().nullable(),
  url: optionalUrl,
  sourceType: z.enum(SOURCE_TYPES, "Tipe sumber tidak valid."),
  accessDate: z.string().trim().max(40, "Tanggal akses maksimal 40 karakter.").optional().nullable(),
  attribution: z.string().trim().max(300, "Atribusi maksimal 300 karakter.").optional().nullable(),
  license: z.string().trim().max(120, "Lisensi maksimal 120 karakter.").optional().nullable(),
  verificationNote: z.string().trim().max(1000, "Catatan verifikasi maksimal 1000 karakter.").optional().nullable(),
});

export const hotspotInputSchema = z.object({
  title: z.string().trim().min(1, "Judul hotspot wajib diisi.").max(120, "Judul hotspot maksimal 120 karakter."),
  description: z.string().trim().min(1, "Deskripsi hotspot wajib diisi.").max(1000, "Deskripsi hotspot maksimal 1000 karakter."),
  x: z.number("Koordinat x harus berupa angka."),
  y: z.number("Koordinat y harus berupa angka."),
  z: z.number("Koordinat z harus berupa angka."),
  published: z.boolean().optional(),
});

export const itemSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(200, "Judul maksimal 200 karakter."),
  slug: z.string().trim().max(220, "Slug maksimal 220 karakter.").optional(),
  summary: z.string().trim().min(1, "Ringkasan wajib diisi.").max(500, "Ringkasan maksimal 500 karakter."),
  description: z.string().trim().min(1, "Deskripsi wajib diisi.").max(20000, "Deskripsi maksimal 20000 karakter."),
  history: z.string().trim().max(20000, "Sejarah maksimal 20000 karakter.").optional().nullable(),
  meaning: z.string().trim().max(20000, "Makna maksimal 20000 karakter.").optional().nullable(),
  status: z.enum(ITEM_STATUSES, "Status tidak valid.").optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih."),
  regionId: z.string().min(1, "Wilayah wajib dipilih."),
  coverMediaId: z.string().optional().nullable(),
  modelMediaId: z.string().optional().nullable(),
  audioMediaId: z.string().optional().nullable(),
  galleryMediaIds: z.array(z.string()).max(30, "Galeri maksimal 30 media.").optional(),
  attribution: z.string().trim().max(300, "Atribusi maksimal 300 karakter.").optional().nullable(),
  license: z.string().trim().max(120, "Lisensi maksimal 120 karakter.").optional().nullable(),
  sources: z.array(sourceInputSchema).max(50, "Sumber maksimal 50.").optional(),
  hotspots: z.array(hotspotInputSchema).max(100, "Hotspot maksimal 100.").optional(),
});

export const itemUpdateSchema = itemSchema.partial();

export const hotspotCreateSchema = hotspotInputSchema.extend({
  published: z.boolean().optional(),
});

export const hotspotUpdateSchema = hotspotCreateSchema.partial();

export type ItemParsed = z.infer<typeof itemSchema>;
export type ItemUpdateParsed = z.infer<typeof itemUpdateSchema>;
