import { updateAdminRegion, deleteAdminRegion } from "@/server/controllers/admin/regions.controller";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return updateAdminRegion(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return deleteAdminRegion(req, { params });
}
