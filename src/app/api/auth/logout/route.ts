import { logout } from "@/server/controllers/auth.controller";

export const dynamic = "force-dynamic";

export async function POST() {
  return logout();
}
