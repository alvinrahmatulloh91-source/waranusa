import { serveMediaFile } from "@/server/controllers/media-file.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return serveMediaFile(req, { params });
}
