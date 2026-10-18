import { updateAdminSource, deleteAdminSource } from "@/server/controllers/admin/sources.controller";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return updateAdminSource(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return deleteAdminSource(req, { params });
}
