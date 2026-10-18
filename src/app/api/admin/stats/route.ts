import { stats } from "@/server/controllers/admin/stats.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return stats();
}
