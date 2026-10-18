/**
 * WaraNusa — Controller penyajian berkas media upload
 * GET /api/media/file/[...path] — hanya path di bawah "media/"
 */
import { NextResponse } from "next/server";
import { notFound, handleApiError } from "@/lib/api-response";
import { readUploadFile, mimeFromPath } from "@/lib/storage";

export async function serveMediaFile(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  try {
    const { path: segments } = await ctx.params;
    const rel = (segments ?? []).join("/");
    if (!rel.startsWith("media/") || rel.includes("..")) {
      return notFound("Berkas tidak ditemukan.");
    }
    const buf = await readUploadFile(rel);
    if (!buf) return notFound("Berkas tidak ditemukan.");
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mimeFromPath(rel),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
