import { trackContribution } from "@/server/controllers/contribution.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return trackContribution(req);
}
