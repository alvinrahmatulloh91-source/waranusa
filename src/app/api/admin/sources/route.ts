import { listAdminSources, createAdminSource } from "@/server/controllers/admin/sources.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return listAdminSources(req);
}

export async function POST(req: Request) {
  return createAdminSource(req);
}
