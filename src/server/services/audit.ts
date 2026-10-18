/**
 * WaraNusa — Audit trail service
 * Mencatat aktivitas admin/staff ke tabel ActivityLog (ala Laravel spatie/activitylog).
 */
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function logActivity(
  client: DbClient,
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  detail?: string
): Promise<void> {
  try {
    await client.activityLog.create({
      data: {
        ...(userId ? { userId } : {}),
        action,
        ...(entityType !== undefined ? { entityType } : {}),
        ...(entityId !== undefined ? { entityId } : {}),
        ...(detail !== undefined ? { detail } : {}),
      },
    });
  } catch (e) {
    // Audit tidak boleh menggagalkan operasi utama
    console.error("[audit] gagal mencatat aktivitas:", e);
  }
}
