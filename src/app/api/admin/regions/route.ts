import { listAdminRegions, createAdminRegion } from "@/server/controllers/admin/regions.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return listAdminRegions();
}

export async function POST(req: Request) {
  return createAdminRegion(req);
}
