import { me } from "@/server/controllers/auth.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return me();
}
