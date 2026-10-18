import { login } from "@/server/controllers/auth.controller";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return login(req);
}
