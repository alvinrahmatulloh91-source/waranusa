import { createContribution } from "@/server/controllers/contribution.controller";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return createContribution(req);
}
