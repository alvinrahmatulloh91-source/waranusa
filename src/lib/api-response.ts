/**
 * WaraNusa — Pembantu respons API ala Laravel
 * Bentuk respons konsisten: { data, meta? } | { error: { message, fields? } }
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, meta?: unknown, status = 200) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json(
    { error: { message, ...(fields ? { fields } : {}) } },
    { status }
  );
}

export const unauthorized = (msg = "Autentikasi diperlukan.") => fail(msg, 401);
export const forbidden = (msg = "Anda tidak memiliki izin untuk aksi ini.") => fail(msg, 403);
export const notFound = (msg = "Data tidak ditemukan.") => fail(msg, 404);

/** Menangkap ZodError -> 422 dengan daftar field, error lain -> 500 tanpa bocor detail internal */
export function handleApiError(e: unknown) {
  if (e instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of e.issues) {
      const key = issue.path.join(".") || "_";
      if (!fields[key]) fields[key] = issue.message;
    }
    return fail("Data yang dikirim tidak valid.", 422, fields);
  }
  console.error("[API Error]", e);
  return fail("Terjadi kesalahan pada server. Silakan coba lagi.", 500);
}

export function paginateMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
