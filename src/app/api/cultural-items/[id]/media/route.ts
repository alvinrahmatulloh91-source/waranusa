import { itemMedia } from "@/server/controllers/public.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return itemMedia(req, { params });
}
