/**
 * WaraNusa — Validator kontribusi & moderasi
 * Catatan: regionId divalidasi sebagai string + keberadaan di DB
 * (Prisma memakai cuid, bukan uuid, sehingga cek uuid ketat akan menolak id sah).
 */
import { z } from "zod";
import { CONTRIBUTION_STATUSES } from "@/lib/constants";

export const contributionSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(150, "Judul maksimal 150 karakter."),
  regionId: z.string().trim().max(64, "ID wilayah tidak valid.").nullable().optional(),
  categorySlug: z.string().trim().min(1, "Kategori wajib dipilih.").max(120, "Kategori tidak valid."),
  description: z
    .string()
    .trim()
    .min(20, "Deskripsi minimal 20 karakter.")
    .max(5000, "Deskripsi maksimal 5000 karakter."),
  sourceRef: z.string().trim().max(500, "Referensi sumber maksimal 500 karakter.").optional().nullable(),
  submitterName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama maksimal 80 karakter."),
  submitterEmail: z
    .email("Format email tidak valid.")
    .max(120, "Email maksimal 120 karakter.")
    .transform((v) => v.trim().toLowerCase()),
});

export const contributionStatusSchema = z.object({
  status: z.enum(CONTRIBUTION_STATUSES, "Status tidak valid."),
  note: z.string().trim().max(2000, "Catatan maksimal 2000 karakter.").optional(),
  publishItemId: z.boolean().optional(),
});
