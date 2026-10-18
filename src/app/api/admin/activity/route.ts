import { activity } from "@/server/controllers/admin/stats.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return activity(req);
}
