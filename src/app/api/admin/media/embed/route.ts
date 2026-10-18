import { createEmbedMedia } from "@/server/controllers/admin/media.controller";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return createEmbedMedia(req);
}
