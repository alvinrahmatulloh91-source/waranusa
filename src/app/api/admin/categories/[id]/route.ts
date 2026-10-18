import { updateAdminCategory, deleteAdminCategory } from "@/server/controllers/admin/categories.controller";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return updateAdminCategory(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return deleteAdminCategory(req, { params });
}
