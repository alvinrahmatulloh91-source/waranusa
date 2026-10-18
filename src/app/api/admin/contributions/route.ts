import { listAdminContributions } from "@/server/controllers/admin/contributions.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return listAdminContributions(req);
}
