import { listAdminUsers, createAdminUser } from "@/server/controllers/admin/users.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return listAdminUsers();
}

export async function POST(req: Request) {
  return createAdminUser(req);
}
