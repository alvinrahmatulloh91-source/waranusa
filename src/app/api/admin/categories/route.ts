import { listAdminCategories, createAdminCategory } from "@/server/controllers/admin/categories.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return listAdminCategories();
}

export async function POST(req: Request) {
  return createAdminCategory(req);
}
