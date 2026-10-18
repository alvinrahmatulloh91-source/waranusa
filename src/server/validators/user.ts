/**
 * WaraNusa — Validator pengguna & pengaturan
 */
import { z } from "zod";
import { ROLES } from "@/lib/constants";

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama maksimal 80 karakter."),
  email: z
    .email("Format email tidak valid.")
    .max(120, "Email maksimal 120 karakter.")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(100, "Kata sandi maksimal 100 karakter."),
  role: z.enum(ROLES, "Peran tidak valid."),
  active: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama maksimal 80 karakter.").optional(),
  role: z.enum(ROLES, "Peran tidak valid.").optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(100, "Kata sandi maksimal 100 karakter.").optional(),
});

export const settingsUpdateSchema = z
  .record(z.string().trim().min(1, "Kunci tidak boleh kosong.").max(100, "Kunci maksimal 100 karakter."), z.string().max(2000, "Nilai maksimal 2000 karakter."))
  .refine((v) => Object.keys(v).length <= 20, "Maksimal 20 pengaturan per permintaan.");
