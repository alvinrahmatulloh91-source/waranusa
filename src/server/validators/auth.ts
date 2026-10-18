/**
 * WaraNusa — Validator autentikasi (zod)
 */
import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .email("Format email tidak valid.")
    .max(120, "Email maksimal 120 karakter.")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Kata sandi wajib diisi.").max(200, "Kata sandi terlalu panjang."),
});
