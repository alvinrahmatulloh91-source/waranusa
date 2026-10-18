import { updateHotspot, deleteHotspot } from "@/server/controllers/admin/hotspots.controller";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; hotspotId: string }> }
) {
  return updateHotspot(req, { params });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; hotspotId: string }> }
) {
  return deleteHotspot(req, { params });
}
