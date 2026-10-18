/**
 * WaraNusa — Validator media
 * URL embed Sketchfab divalidasi di controller (normalizeSketchfabEmbed) agar
 * error fields bersih (zod 4 menggabungkan path issue transform dengan field).
 */
import { z } from "zod";
import { MEDIA_STATUSES } from "@/lib/constants";

export const mediaUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nama media wajib diisi.").max(200, "Nama media maksimal 200 karakter.").optional(),
  description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter.").optional().nullable(),
  license: z.string().trim().max(120, "Lisensi maksimal 120 karakter.").optional().nullable(),
  attribution: z.string().trim().max(300, "Atribusi maksimal 300 karakter.").optional().nullable(),
  status: z.enum(MEDIA_STATUSES, "Status media tidak valid.").optional(),
  /** Hanya untuk aset MODEL_3D embed — dinormalisasi di controller */
  embedUrl: z.string().trim().max(500).optional().nullable(),
});

/** POST /api/admin/media/embed — pendaftaran model 3D embed eksternal (Sketchfab) */
export const mediaEmbedCreateSchema = z.object({
  name: z.string().trim().min(1, "Nama media wajib diisi.").max(200, "Nama media maksimal 200 karakter."),
  embedUrl: z.string().trim().min(1, "URL Sketchfab wajib diisi.").max(500),
  description: z.string().trim().max(2000, "Deskripsi maksimal 2000 karakter.").optional().nullable(),
  license: z.string().trim().max(120, "Lisensi maksimal 120 karakter.").optional().nullable(),
  attribution: z.string().trim().max(300, "Atribusi maksimal 300 karakter.").optional().nullable(),
});
