import { myContributions } from "@/server/controllers/contribution.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return myContributions();
}
