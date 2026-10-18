/**
 * WaraNusa — Validator wilayah (Region)
 */
import { z } from "zod";
import { ISLAND_GROUPS } from "@/lib/constants";

export const regionSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/, "Kode wilayah harus berformat XX-YY (contoh: ID-BA).")
    .max(10, "Kode wilayah maksimal 10 karakter."),
  name: z.string().trim().min(2, "Nama wilayah minimal 2 karakter.").max(100, "Nama wilayah maksimal 100 karakter."),
  islandGroup: z.enum(ISLAND_GROUPS, "Kelompok pulau tidak valid."),
  capital: z.string().trim().max(100, "Ibu kota maksimal 100 karakter.").optional().nullable(),
  summary: z.string().trim().min(10, "Ringkasan minimal 10 karakter.").max(500, "Ringkasan maksimal 500 karakter."),
  description: z.string().trim().max(5000, "Deskripsi maksimal 5000 karakter.").optional().nullable(),
  lat: z.number().min(-90, "Lintang antara -90 sampai 90.").max(90, "Lintang antara -90 sampai 90."),
  lng: z.number().min(-180, "Bujur antara -180 sampai 180.").max(180, "Bujur antara -180 sampai 180."),
});

export const regionUpdateSchema = regionSchema.partial();
