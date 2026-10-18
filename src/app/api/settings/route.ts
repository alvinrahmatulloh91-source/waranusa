import { getSettings } from "@/server/controllers/public.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return getSettings();
}
