import { getAdminItem, updateAdminItem, deleteAdminItem } from "@/server/controllers/admin/items.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return getAdminItem(req, { params });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return updateAdminItem(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return deleteAdminItem(req, { params });
}
