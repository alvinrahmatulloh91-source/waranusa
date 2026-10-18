import { listAdminItems, createAdminItem } from "@/server/controllers/admin/items.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return listAdminItems(req);
}

export async function POST(req: Request) {
  return createAdminItem(req);
}
