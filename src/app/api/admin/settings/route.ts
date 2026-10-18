import { getAdminSettings, updateAdminSettings } from "@/server/controllers/admin/settings.controller";

export const dynamic = "force-dynamic";

export async function GET() {
  return getAdminSettings();
}

export async function PUT(req: Request) {
  return updateAdminSettings(req);
}
