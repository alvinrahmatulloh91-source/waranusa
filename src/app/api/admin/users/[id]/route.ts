import { updateAdminUser } from "@/server/controllers/admin/users.controller";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return updateAdminUser(req, { params });
}
