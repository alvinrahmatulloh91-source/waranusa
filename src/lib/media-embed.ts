/**
 * WaraNusa — Util aset model 3D embed eksternal (Sketchfab).
 * Murni fungsi string — aman dipakai di client & server.
 *
 * Aturan keamanan:
 * - Hanya host sketchfab.com (/www.) yang diizinkan (allowlist), protocol https.
 * - ID model Sketchfab adalah 32 karakter heksadesimal.
 * - Menerima URL embed maupun URL halaman model, dinormalkan ke URL embed resmi.
 */

const MODEL_ID_RE = /([0-9a-fA-F]{32})/;

export interface NormalizedEmbed {
  ok: true;
  modelId: string;
  embedUrl: string;
  pageUrl: string;
}

export function normalizeSketchfabEmbed(input: string): NormalizedEmbed | { ok: false; error: string } {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, error: "URL Sketchfab wajib diisi." };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "URL tidak valid. Tempel tautan model atau embed Sketchfab." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "URL Sketchfab harus menggunakan https." };
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "sketchfab.com" && host !== "www.sketchfab.com") {
    return { ok: false, error: "Hanya URL model dari sketchfab.com yang didukung." };
  }

  const match = parsed.pathname.match(MODEL_ID_RE) ?? parsed.pathname.match(MODEL_ID_RE);
  const modelId = match?.[1] ?? null;
  if (!modelId) {
    return { ok: false, error: "ID model Sketchfab tidak ditemukan pada URL tersebut." };
  }

  return {
    ok: true,
    modelId,
    embedUrl: `https://sketchfab.com/models/${modelId}/embed`,
    pageUrl: `https://sketchfab.com/3d-models/${modelId}`,
  };
}

/** Aset MODEL_3D berupa embed eksternal? (menentukan render iframe vs WebGL) */
export function isEmbedModel(asset: { type: string; embedUrl?: string | null } | null | undefined): boolean {
  return !!asset && asset.type === "MODEL_3D" && typeof asset.embedUrl === "string" && asset.embedUrl.length > 0;
}

/** Derive URL halaman model dari URL embed (untuk tautan atribusi). */
export function sketchfabPageUrl(embedUrl: string): string {
  const m = embedUrl.match(/sketchfab\.com\/models\/([0-9a-fA-F]{32})/);
  return m ? `https://sketchfab.com/3d-models/${m[1]}` : embedUrl;
}
