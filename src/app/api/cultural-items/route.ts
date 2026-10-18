import { listItems } from "@/server/controllers/public.controller";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return listItems(req);
}
