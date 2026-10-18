import { getAdminContribution } from "@/server/controllers/admin/contributions.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return getAdminContribution(req, { params });
}
