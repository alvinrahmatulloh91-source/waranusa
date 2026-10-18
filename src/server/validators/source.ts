/**
 * WaraNusa — Validator sumber (CulturalSource)
 */
import { z } from "zod";
import { SOURCE_TYPES } from "@/lib/constants";

const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL maksimal 500 karakter.")
  .optional()
  .nullable()
  .refine((v) => !v || /^https?:\/\/\S+$/.test(v), "URL tidak valid (harus diawali http:// atau https://).");

export const sourceCreateSchema = z.object({
  itemId: z.string().max(64).optional().nullable(),
  title: z.string().trim().min(1, "Judul sumber wajib diisi.").max(300, "Judul sumber maksimal 300 karakter."),
  creator: z.string().trim().max(160, "Pencipta maksimal 160 karakter.").optional().nullable(),
  url: optionalUrl,
  sourceType: z.enum(SOURCE_TYPES, "Tipe sumber tidak valid."),
  accessDate: z.string().trim().max(40, "Tanggal akses maksimal 40 karakter.").optional().nullable(),
  attribution: z.string().trim().max(300, "Atribusi maksimal 300 karakter.").optional().nullable(),
  license: z.string().trim().max(120, "Lisensi maksimal 120 karakter.").optional().nullable(),
  verificationNote: z.string().trim().max(1000, "Catatan verifikasi maksimal 1000 karakter.").optional().nullable(),
});

export const sourceUpdateSchema = sourceCreateSchema.partial();
