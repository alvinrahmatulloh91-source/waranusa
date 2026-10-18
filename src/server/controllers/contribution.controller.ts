/**
 * WaraNusa — Controller kontribusi (publik & milik pengguna)
 * POST /api/contributions | GET /api/contributions/track | GET /api/my/contributions
 */
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { ok, created, fail, unauthorized, notFound, handleApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { contributionSchema } from "@/server/validators/contribution";
import { serializeContribution, contributionDetailInclude } from "@/server/serializers";
import { logActivity } from "@/server/services/audit";
import { readJson } from "@/server/services/http";

const REF_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomRefCode(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += REF_CHARS[bytes[i] % REF_CHARS.length];
  return `WN-${out}`;
}

/** Buat refCode unik "WN-" + 6 alnum uppercase (loop cek unik) */
async function generateUniqueRefCode(): Promise<string> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const code = randomRefCode();
    const exists = await db.contribution.findUnique({ where: { refCode: code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("Gagal menghasilkan kode referensi unik.");
}

/** POST /api/contributions — publik (boleh anonim), rate limit 5/jam per IP */
export async function createContribution(req: Request): Promise<Response> {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`contrib:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return fail(`Terlalu banyak pengajuan. Coba lagi dalam ${rl.retryAfterSec} detik.`, 429);
    }

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = contributionSchema.parse(body);

    let regionId: string | null = null;
    if (input.regionId) {
      const region = await db.region.findUnique({ where: { id: input.regionId }, select: { id: true } });
      if (!region) return fail("Wilayah tidak ditemukan.", 422, { regionId: "Wilayah tidak ditemukan." });
      regionId = region.id;
    }
    const category = await db.category.findUnique({
      where: { slug: input.categorySlug },
      select: { slug: true },
    });
    if (!category) return fail("Kategori tidak ditemukan.", 422, { categorySlug: "Kategori tidak ditemukan." });

    const auth = await getCurrentUser();
    const refCode = await generateUniqueRefCode();
    const contribution = await db.contribution.create({
      data: {
        refCode,
        title: input.title,
        regionId,
        categorySlug: input.categorySlug,
        description: input.description,
        sourceRef: input.sourceRef ?? null,
        submitterName: input.submitterName,
        submitterEmail: input.submitterEmail.toLowerCase(),
        userId: auth?.id ?? null,
        status: "SUBMITTED",
      },
      include: contributionDetailInclude,
    });

    await logActivity(
      db,
      auth?.id ?? null,
      "contribution.submit",
      "Contribution",
      contribution.id,
      `Pengajuan "${contribution.title}" (${contribution.refCode}).`
    );

    return created({ contribution: serializeContribution(contribution) });
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/contributions/track?refCode=&email= — rate limit 30/menit per IP */
export async function trackContribution(req: Request): Promise<Response> {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`track:${ip}`, 30, 60_000);
    if (!rl.allowed) {
      return fail(`Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfterSec} detik.`, 429);
    }

    const url = new URL(req.url);
    const refCode = url.searchParams.get("refCode")?.trim().toUpperCase();
    const email = url.searchParams.get("email")?.trim().toLowerCase();
    if (!refCode || !email) {
      return fail("Kode referensi dan email wajib diisi.", 400);
    }

    const contribution = await db.contribution.findUnique({
      where: { refCode },
      include: contributionDetailInclude,
    });
    if (!contribution || contribution.submitterEmail.toLowerCase() !== email) {
      return notFound("Kontribusi tidak ditemukan. Periksa kembali kode referensi dan email Anda.");
    }
    return ok(serializeContribution(contribution));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/my/contributions — kontribusi milik pengguna yang sedang login */
export async function myContributions(): Promise<Response> {
  try {
    const auth = await getCurrentUser();
    if (!auth) return unauthorized();
    const rows = await db.contribution.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: "desc" },
      include: contributionDetailInclude,
    });
    return ok(rows.map((c) => serializeContribution(c)));
  } catch (e) {
    return handleApiError(e);
  }
}
