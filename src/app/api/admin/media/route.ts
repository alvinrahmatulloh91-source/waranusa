import { listAdminMedia, uploadMedia } from "@/server/controllers/admin/media.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return listAdminMedia(req);
}

export async function POST(req: Request) {
  return uploadMedia(req);
}
