/**
 * WaraNusa — Controller admin: media (list, upload, detail, update, delete)
 * GET/POST /api/admin/media | GET/PATCH/DELETE /api/admin/media/[id]
 */
import { db } from "@/lib/db";
import { ok, created, fail, notFound, handleApiError, paginateMeta } from "@/lib/api-response";
import { ALL_STAFF, WRITE_ROLES, type AuthUser } from "@/lib/auth";
import { MEDIA_TYPES, type MediaType } from "@/lib/constants";
import { validateUpload, saveUploadFile, deleteUploadFile } from "@/lib/storage";
import { normalizeSketchfabEmbed } from "@/lib/media-embed";
import { mediaUpdateSchema, mediaEmbedCreateSchema } from "@/server/validators/media";
import { serializeMediaAsset } from "@/server/serializers";
import { mediaUsageMap } from "@/server/services/media-usage";
import { logActivity } from "@/server/services/audit";
import { guard, parsePagination } from "@/server/services/http";

interface MediaCtx {
  params: Promise<{ id: string }>;
}

const mediaUsageCountInclude = {
  uploader: true,
  _count: { select: { coverFor: true, modelFor: true, audioFor: true, galleryLinks: true } },
} as const;

/** GET /api/admin/media — paginated, filter type/search/status(default ACTIVE) */
export async function listAdminMedia(req: Request): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const url = new URL(req.url);
    const { page, pageSize, skip, take } = parsePagination(url, 24, 96);
    const type = url.searchParams.get("type")?.trim();
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status")?.trim() || "ACTIVE";

    const where: { type?: string; name?: { contains: string }; status?: string } = {};
    if (type && (MEDIA_TYPES as readonly string[]).includes(type)) where.type = type;
    if (search) where.name = { contains: search };
    if (status !== "ALL") where.status = status;

    const [total, rows] = await Promise.all([
      db.mediaAsset.count({ where }),
      db.mediaAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: mediaUsageCountInclude,
      }),
    ]);

    const usage = await mediaUsageMap(rows.map((r) => r.id));
    return ok(rows.map((r) => serializeMediaAsset(r, usage.get(r.id) ?? [])), paginateMeta(page, pageSize, total));
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/admin/media — multipart upload (WRITE_ROLES) */
export async function uploadMedia(req: Request): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return fail("Body tidak valid. Gunakan multipart/form-data dengan field 'file'.", 400);
    }

    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Berkas wajib diunggah (field 'file').", 422, { file: "Berkas wajib diunggah." });
    }

    const str = (k: string): string | null => {
      const v = form.get(k);
      const s = typeof v === "string" ? v.trim() : "";
      return s.length > 0 ? s : null;
    };
    const name = str("name") ?? file.name;
    const description = str("description");
    const license = str("license");
    const attribution = str("attribution");

    // Tipe media: dari field, atau deteksi dari MIME bila kosong
    let type = str("type") ?? "";
    if (!type) {
      const mime = file.type ?? "";
      type = mime.startsWith("image/")
        ? "IMAGE"
        : mime.startsWith("audio/")
          ? "AUDIO"
          : mime.startsWith("model/")
            ? "MODEL_3D"
            : "";
      if (!type) {
        return fail(
          "Tipe media tidak dapat dideteksi dari berkas. Sebutkan field 'type' (IMAGE/AUDIO/MODEL_3D/TEXTURE/THUMBNAIL).",
          422,
          { type: "Tipe media wajib dipilih." }
        );
      }
    }
    if (!(MEDIA_TYPES as readonly string[]).includes(type)) {
      return fail("Tipe media tidak valid.", 422, { type: "Tipe media tidak valid." });
    }
    const mediaType = type as MediaType;

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateUpload(file.name, buffer, mediaType);
    if (!validation.ok) {
      return fail(validation.error ?? "Berkas tidak valid.", 422, { file: validation.error ?? "Berkas tidak valid." });
    }

    const storagePath = await saveUploadFile(file.name, buffer, validation.mimeType!);
    const asset = await db.mediaAsset.create({
      data: {
        name,
        description,
        type: mediaType,
        format: validation.format!,
        mimeType: validation.mimeType!,
        size: buffer.byteLength,
        storagePath,
        license,
        attribution,
        status: "ACTIVE",
        uploaderId: user.id,
      },
      include: { uploader: true },
    });

    await logActivity(db, user.id, "media.upload", "MediaAsset", asset.id, `Mengunggah media "${asset.name}".`);
    return created(serializeMediaAsset(asset));
  } catch (e) {
    return handleApiError(e);
  }
}

/** POST /api/admin/media/embed — daftarkan model 3D embed eksternal (Sketchfab), tanpa berkas */
export async function createEmbedMedia(req: Request): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("Body tidak valid. Kirim JSON dengan field 'embedUrl'.", 400);
    }
    const input = mediaEmbedCreateSchema.parse(body);

    // Normalisasi + allowlist host sketchfab.com (https, ID model 32-hex)
    const norm = normalizeSketchfabEmbed(input.embedUrl);
    if (!norm.ok) {
      return fail(norm.error, 422, { embedUrl: norm.error });
    }

    const asset = await db.mediaAsset.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        type: "MODEL_3D",
        format: "SKETCHFAB",
        mimeType: "text/html",
        size: 0,
        storagePath: null,
        embedUrl: norm.embedUrl,
        license: input.license ?? null,
        attribution: input.attribution ?? null,
        status: "ACTIVE",
        uploaderId: user.id,
      },
      include: { uploader: true },
    });

    await logActivity(db, user.id, "media.embed.create", "MediaAsset", asset.id, `Mendaftarkan model embed "${asset.name}".`);
    return created(serializeMediaAsset(asset));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/admin/media/[id] — detail dengan usedBy lengkap */
export async function getAdminMedia(_req: Request, ctx: MediaCtx): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const { id } = await ctx.params;
    const asset = await db.mediaAsset.findUnique({ where: { id }, include: mediaUsageCountInclude });
    if (!asset) return notFound("Media tidak ditemukan.");

    const usage = await mediaUsageMap([id]);
    return ok(serializeMediaAsset(asset, usage.get(id) ?? []));
  } catch (e) {
    return handleApiError(e);
  }
}

/** PATCH /api/admin/media/[id] */
export async function updateAdminMedia(req: Request, ctx: MediaCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const existing = await db.mediaAsset.findUnique({ where: { id } });
    if (!existing) return notFound("Media tidak ditemukan.");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("Body tidak valid.", 400);
    }
    const input = mediaUpdateSchema.parse(body);

    const data: Partial<{
      name: string;
      description: string | null;
      license: string | null;
      attribution: string | null;
      status: string;
      embedUrl: string | null;
    }> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.license !== undefined) data.license = input.license;
    if (input.attribution !== undefined) data.attribution = input.attribution;
    if (input.status !== undefined) data.status = input.status;
    if (input.embedUrl !== undefined) {
      // embedUrl hanya relevan untuk aset MODEL_3D
      if (existing.type !== "MODEL_3D") {
        return fail("embedUrl hanya dapat diatur pada aset bertipe MODEL_3D.", 422, { embedUrl: "Aset ini bukan MODEL_3D." });
      }
      if (input.embedUrl === null || input.embedUrl === "") {
        data.embedUrl = null;
      } else {
        const norm = normalizeSketchfabEmbed(input.embedUrl);
        if (!norm.ok) {
          return fail(norm.error, 422, { embedUrl: norm.error });
        }
        data.embedUrl = norm.embedUrl;
      }
    }

    const updated = await db.mediaAsset.update({ where: { id }, data, include: mediaUsageCountInclude });
    await logActivity(db, user.id, "media.update", "MediaAsset", id, `Memperbarui media "${updated.name}".`);

    const usage = await mediaUsageMap([id]);
    return ok(serializeMediaAsset(updated, usage.get(id) ?? []));
  } catch (e) {
    return handleApiError(e);
  }
}

/** DELETE /api/admin/media/[id] — tolak 409 bila masih dipakai objek budaya */
export async function deleteAdminMedia(_req: Request, ctx: MediaCtx): Promise<Response> {
  try {
    const g = await guard(WRITE_ROLES);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const asset = await db.mediaAsset.findUnique({
      where: { id },
      include: {
        coverFor: { select: { id: true, title: true } },
        modelFor: { select: { id: true, title: true } },
        audioFor: { select: { id: true, title: true } },
        galleryLinks: { select: { item: { select: { id: true, title: true } } } },
      },
    });
    if (!asset) return notFound("Media tidak ditemukan.");

    const usages: string[] = [];
    for (const it of asset.coverFor) usages.push(`${it.title} (SAMPUL)`);
    for (const it of asset.modelFor) usages.push(`${it.title} (MODEL 3D)`);
    for (const it of asset.audioFor) usages.push(`${it.title} (AUDIO)`);
    for (const gl of asset.galleryLinks) usages.push(`${gl.item.title} (GALERI)`);
    if (usages.length > 0) {
      return fail(`Media masih digunakan oleh: ${usages.join(", ")}. Lepas penggunaan dahulu.`, 409);
    }

    if (asset.storagePath) {
      await deleteUploadFile(asset.storagePath);
    }
    await db.mediaAsset.delete({ where: { id } });
    await logActivity(db, user.id, "media.delete", "MediaAsset", id, `Menghapus media "${asset.name}".`);
    return ok({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
