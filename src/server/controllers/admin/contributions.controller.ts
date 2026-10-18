/**
 * WaraNusa — Controller admin: kontribusi & moderasi
 * GET /api/admin/contributions | GET /api/admin/contributions/[id]
 * PATCH /api/admin/contributions/[id]/status
 */
import { db } from "@/lib/db";
import { ok, fail, notFound, handleApiError, paginateMeta } from "@/lib/api-response";
import { ALL_STAFF, WRITE_ROLES, type AuthUser } from "@/lib/auth";
import { CONTRIBUTION_STATUSES, type ContributionStatus } from "@/lib/constants";
import { contributionStatusSchema } from "@/server/validators/contribution";
import { serializeContribution, contributionDetailInclude } from "@/server/serializers";
import { uniqueSlug } from "@/server/services/slug";
import { logActivity } from "@/server/services/audit";
import { guard, readJson, parsePagination } from "@/server/services/http";

interface ContributionCtx {
  params: Promise<{ id: string }>;
}

/** Transisi status yang diizinkan */
const ALLOWED_TRANSITIONS: Record<ContributionStatus, ContributionStatus[]> = {
  SUBMITTED: ["IN_REVIEW", "APPROVED", "REJECTED", "NEEDS_REVISION"],
  IN_REVIEW: ["NEEDS_REVISION", "APPROVED", "REJECTED"],
  NEEDS_REVISION: ["IN_REVIEW", "APPROVED", "REJECTED", "SUBMITTED"],
  APPROVED: [], // final
  REJECTED: [], // final
};

/** Mapping status baru -> action ModerationReview */
const ACTION_BY_STATUS: Record<ContributionStatus, string> = {
  SUBMITTED: "SUBMIT", // re-submit setelah revisi
  IN_REVIEW: "START_REVIEW",
  NEEDS_REVISION: "REQUEST_REVISION",
  APPROVED: "APPROVE",
  REJECTED: "REJECT",
};

/** GET /api/admin/contributions — paginated, filter status */
export async function listAdminContributions(req: Request): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const url = new URL(req.url);
    const { page, pageSize, skip, take } = parsePagination(url, 20, 100);
    const status = url.searchParams.get("status")?.trim();

    const where: { status?: string } = {};
    if (status && (CONTRIBUTION_STATUSES as readonly string[]).includes(status)) where.status = status;

    const [total, rows] = await Promise.all([
      db.contribution.count({ where }),
      db.contribution.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: contributionDetailInclude,
      }),
    ]);
    return ok(rows.map((c) => serializeContribution(c)), paginateMeta(page, pageSize, total));
  } catch (e) {
    return handleApiError(e);
  }
}

/** GET /api/admin/contributions/[id] */
export async function getAdminContribution(_req: Request, ctx: ContributionCtx): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;

    const { id } = await ctx.params;
    const contribution = await db.contribution.findUnique({ where: { id }, include: contributionDetailInclude });
    if (!contribution) return notFound("Kontribusi tidak ditemukan.");
    return ok(serializeContribution(contribution));
  } catch (e) {
    return handleApiError(e);
  }
}

/**
 * PATCH /api/admin/contributions/[id]/status
 * Validasi transisi, catat ModerationReview, dan bila APPROVED:
 * buat/perbarui CulturalItem draft (opsional langsung publish oleh WRITE_ROLES).
 */
export async function setContributionStatus(req: Request, ctx: ContributionCtx): Promise<Response> {
  try {
    const g = await guard(ALL_STAFF);
    if (g instanceof Response) return g;
    const user: AuthUser = g;

    const { id } = await ctx.params;
    const contribution = await db.contribution.findUnique({ where: { id } });
    if (!contribution) return notFound("Kontribusi tidak ditemukan.");

    const body = await readJson(req);
    if (body instanceof Response) return body;
    const input = contributionStatusSchema.parse(body);

    const current = contribution.status as ContributionStatus;
    if (!(ALLOWED_TRANSITIONS[current] ?? []).includes(input.status)) {
      return fail(`Transisi status dari ${current} ke ${input.status} tidak diizinkan.`, 409);
    }

    // Pra-syarat pembuatan item saat APPROVED pertama kali
    if (input.status === "APPROVED" && !contribution.createdItemId) {
      const category = await db.category.findUnique({ where: { slug: contribution.categorySlug }, select: { id: true } });
      const region = contribution.regionId
        ? await db.region.findUnique({ where: { id: contribution.regionId }, select: { id: true } })
        : await db.region.findFirst({ select: { id: true } });
      if (!category) return fail("Kategori dari kontribusi tidak tersedia. Perbarui kategori terlebih dahulu.", 409);
      if (!region) return fail("Wilayah belum tersedia. Tambahkan wilayah terlebih dahulu.", 409);
    }

    const updated = await db.contribution.update({
      where: { id },
      data: {
        status: input.status,
        reviewedById: user.id,
        reviews: {
          create: {
            reviewerId: user.id,
            action: ACTION_BY_STATUS[input.status],
            note: input.note ?? null,
          },
        },
      },
      include: contributionDetailInclude,
    });

    await logActivity(
      db,
      user.id,
      input.status === "APPROVED" ? "contribution.approve" : "contribution.review",
      "Contribution",
      id,
      `Meninjau kontribusi "${contribution.title}": ${current} → ${input.status}.`
    );

    if (input.status === "APPROVED") {
      await applyApproval(updated, user, input.publishItemId === true);
    }

    const fresh = await db.contribution.findUnique({ where: { id }, include: contributionDetailInclude });
    return ok(serializeContribution(fresh!));
  } catch (e) {
    return handleApiError(e);
  }
}

/** Konversi kontribusi yang disetujui menjadi objek budaya (buat draft baru atau perbarui item lama) */
async function applyApproval(
  contribution: { id: string; refCode: string; title: string; description: string; categorySlug: string; regionId: string | null; createdItemId: string | null },
  user: AuthUser,
  publish: boolean
): Promise<void> {
  const summary = contribution.description.trim().slice(0, 200);

  if (contribution.createdItemId) {
    // Item sudah ada (dibuat dari persetujuan sebelumnya) — perbarui isi dasar
    const data: { title: string; summary: string; description: string; regionId?: string; status?: string } = {
      title: contribution.title,
      summary,
      description: contribution.description,
    };
    if (contribution.regionId) data.regionId = contribution.regionId;
    if (publish && WRITE_ROLES.includes(user.role)) data.status = "PUBLISHED";
    await db.culturalItem.update({ where: { id: contribution.createdItemId }, data });
    return;
  }

  // Buat objek budaya DRAFT baru dari kontribusi
  const category =
    (await db.category.findUnique({ where: { slug: contribution.categorySlug } })) ??
    (await db.category.findFirst({ orderBy: { sortOrder: "asc" } }));
  const region = contribution.regionId
    ? await db.region.findUnique({ where: { id: contribution.regionId } })
    : await db.region.findFirst({ orderBy: { name: "asc" } });
  if (!category || !region) return; // sudah diverifikasi pada pra-syarat

  const slug = await uniqueSlug(db, "culturalItem", contribution.title);
  const item = await db.culturalItem.create({
    data: {
      slug,
      title: contribution.title,
      summary,
      description: contribution.description,
      status: "DRAFT",
      categoryId: category.id,
      regionId: region.id,
      createdById: user.id,
      contributionId: contribution.id,
    },
  });
  await db.contribution.update({ where: { id: contribution.id }, data: { createdItemId: item.id } });

  if (publish && WRITE_ROLES.includes(user.role)) {
    await db.culturalItem.update({ where: { id: item.id }, data: { status: "PUBLISHED" } });
  }

  await logActivity(
    db,
    user.id,
    "item.create",
    "CulturalItem",
    item.id,
    `Objek budaya "${item.title}" dibuat dari kontribusi ${contribution.refCode}.`
  );
}
