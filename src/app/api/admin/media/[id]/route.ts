import { getAdminMedia, updateAdminMedia, deleteAdminMedia } from "@/server/controllers/admin/media.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return getAdminMedia(req, { params });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return updateAdminMedia(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return deleteAdminMedia(req, { params });
}
