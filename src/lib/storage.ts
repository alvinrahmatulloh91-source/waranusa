/**
 * WaraNusa — Penyimpanan media (server-only)
 * File disimpan di <project>/uploads/media (DI LUAR folder public) dan hanya
 * diakses lewat endpoint GET /api/media/file/[...path] agar dapat divalidasi.
 * Validasi memakai magic bytes, bukan sekadar ekstensi.
 */
import { mkdir, writeFile, unlink, stat, readFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { MediaType } from "@/lib/constants";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

interface Signature {
  offset: number;
  bytes: number[];
  mask?: number[];
}

const SIGNATURES: Record<string, Signature[]> = {
  "image/png": [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }],
  "image/jpeg": [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  "image/gif": [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }],
  "image/webp": [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], },
    // RIFF....WEBP dicek lewat fungsi khusus di bawah
  ],
  "audio/mpeg": [
    { offset: 0, bytes: [0x49, 0x44, 0x33] }, // ID3
    { offset: 0, bytes: [0xff, 0xfb] }, // MPEG frame sync
    { offset: 0, bytes: [0xff, 0xf3] },
    { offset: 0, bytes: [0xff, 0xf2] },
  ],
  "audio/wav": [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }],
  "audio/ogg": [{ offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }], // OggS
  "audio/mp4": [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }], // ftyp
  "model/gltf-binary": [{ offset: 0, bytes: [0x67, 0x6c, 0x54, 0x46] }], // "glTF"
};

function matchSignature(buf: Buffer, sig: Signature): boolean {
  if (buf.length < sig.offset + sig.bytes.length) return false;
  for (let i = 0; i < sig.bytes.length; i++) {
    const mask = sig.mask?.[i] ?? 0xff;
    if ((buf[sig.offset + i] & mask) !== sig.bytes[i]) return false;
  }
  return true;
}

function detectImageWebp(buf: Buffer): boolean {
  return buf.length > 12 && buf.slice(8, 12).toString("ascii") === "WEBP";
}
function detectWav(buf: Buffer): boolean {
  return buf.length > 12 && buf.slice(8, 12).toString("ascii") === "WAVE";
}

export interface UploadValidation {
  ok: boolean;
  mimeType?: string;
  format?: string;
  error?: string;
}

/**
 * Validasi file terhadap tipe media yang diizinkan.
 * - cek ukuran
 * - cek magic bytes (untuk .gltf JSON: parse JSON & pastikan buffer tertanam data:)
 */
export function validateUpload(
  fileName: string,
  buffer: Buffer,
  mediaType: MediaType
): UploadValidation {
  const ext = path.extname(fileName).toLowerCase().replace(".", "");
  const max = MAX_UPLOAD_BYTES[mediaType];
  if (buffer.length === 0) return { ok: false, error: "File kosong." };
  if (buffer.length > max) {
    return { ok: false, error: `Ukuran file melebihi batas ${Math.round(max / 1024 / 1024)} MB untuk tipe ${mediaType}.` };
  }

  const allowed = ALLOWED_EXT[mediaType] ?? [];
  if (!allowed.includes(ext)) {
    return { ok: false, error: `Ekstensi .${ext} tidak diizinkan untuk tipe ${mediaType}. Diizinkan: ${allowed.join(", ")}` };
  }

  // Model GLTF (JSON): harus tertanam (data URI) atau GLB disarankan
  if (ext === "gltf") {
    try {
      const json = JSON.parse(buffer.toString("utf8"));
      const buffers: Array<{ uri?: string }> = json.buffers ?? [];
      if (buffers.length === 0) return { ok: false, error: "GLTF tanpa buffer." };
      for (const b of buffers) {
        if (b.uri && !b.uri.startsWith("data:")) {
          return { ok: false, error: "File .gltf harus dengan buffer TERTANAM (embedded data URI) atau gunakan format .glb. File eksternal (.bin/tekstur terpisah) belum didukung." };
        }
      }
      return { ok: true, mimeType: "model/gltf+json", format: ext };
    } catch {
      return { ok: false, error: "File .gltf bukan JSON valid." };
    }
  }

  const candidates = EXT_MIME[ext] ?? [];
  let matched: string | undefined;
  for (const mime of candidates) {
    if (mime === "image/webp" && detectImageWebp(buffer)) { matched = mime; break; }
    if (mime === "audio/wav" && detectWav(buffer)) { matched = mime; break; }
    const sigs = SIGNATURES[mime];
    if (sigs?.some((s) => matchSignature(buffer, s))) { matched = mime; break; }
  }
  if (!matched) {
    return { ok: false, error: "Isi file tidak cocok dengan format yang diizinkan (verifikasi magic bytes gagal)." };
  }
  return { ok: true, mimeType: matched, format: ext };
}

const EXT_MIME: Record<string, string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg"], jpeg: ["image/jpeg"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  mp3: ["audio/mpeg"],
  wav: ["audio/wav"],
  ogg: ["audio/ogg"], oga: ["audio/ogg"],
  m4a: ["audio/mp4"],
  glb: ["model/gltf-binary"],
  gltf: ["model/gltf+json"],
};

const ALLOWED_EXT: Record<MediaType, string[]> = {
  IMAGE: ["png", "jpg", "jpeg", "gif", "webp"],
  AUDIO: ["mp3", "wav", "ogg", "oga", "m4a"],
  MODEL_3D: ["glb", "gltf"],
  TEXTURE: ["png", "jpg", "jpeg", "webp"],
  THUMBNAIL: ["png", "jpg", "jpeg", "webp"],
};

/** Simpan file valid ke storage; mengembalikan path relatif */
export async function saveUploadFile(
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dir = path.join(UPLOAD_ROOT, "media", yyyy, mm);
  await mkdir(dir, { recursive: true });
  const safeBase = path
    .basename(fileName, path.extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .slice(0, 60) || "file";
  const ext = path.extname(fileName).toLowerCase();
  const name = `${safeBase}-${randomBytes(6).toString("hex")}${ext}`;
  const rel = path.posix.join("media", yyyy, mm, name);
  await writeFile(path.join(UPLOAD_ROOT, rel), buffer);
  return rel;
}

export async function deleteUploadFile(relPath: string): Promise<void> {
  // cegah path traversal
  const resolved = path.resolve(UPLOAD_ROOT, relPath);
  if (!resolved.startsWith(UPLOAD_ROOT)) return;
  try { await unlink(resolved); } catch { /* sudah tidak ada */ }
}

export async function readUploadFile(relPath: string): Promise<Buffer | null> {
  const resolved = path.resolve(UPLOAD_ROOT, relPath);
  if (!resolved.startsWith(UPLOAD_ROOT)) return null;
  try {
    await stat(resolved);
    return await readFile(resolved);
  } catch {
    return null;
  }
}

export function mimeFromPath(relPath: string): string {
  const ext = path.extname(relPath).toLowerCase().replace(".", "");
  return EXT_MIME[ext]?.[0] ?? "application/octet-stream";
}

/** URL konsumsi media: seed -> static public, upload -> API route */
export function mediaUrl(storagePath: string): string {
  if (storagePath.startsWith("seed/")) return `/uploads/${storagePath}`;
  return `/api/media/file/${storagePath}`;
}
