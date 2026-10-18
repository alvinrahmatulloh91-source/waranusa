import { createHotspot } from "@/server/controllers/admin/hotspots.controller";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return createHotspot(req, { params });
}
