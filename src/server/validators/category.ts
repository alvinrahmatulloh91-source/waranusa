/**
 * WaraNusa — Validator kategori (Category)
 */
import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter.").max(100, "Nama kategori maksimal 100 karakter."),
  slug: z.string().trim().max(120, "Slug maksimal 120 karakter.").optional(),
  description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter.").optional().nullable(),
  icon: z.string().trim().max(60, "Nama ikon maksimal 60 karakter.").optional().nullable(),
  sortOrder: z.number().int("Urutan harus bilangan bulat.").min(0, "Urutan minimal 0.").max(999, "Urutan maksimal 999.").optional(),
});

export const categoryUpdateSchema = categorySchema.partial();
