import { setContributionStatus } from "@/server/controllers/admin/contributions.controller";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return setContributionStatus(req, { params });
}
