/**
 * WaraNusa — API Client (browser-side)
 * Sumber kebenaran kontrak REST: semua view HANYA memanggil method di sini.
 * Backend (route handlers) wajib memenuhi kontrak ini.
 */
import type {
  AdminItemQuery,
  AdminStats,
  ActivityEntry,
  ApiOk,
  Category,
  CategoryInput,
  Contribution,
  ContributionInput,
  ContributionStatusInput,
  CulturalItem,
  Hotspot,
  ItemInput,
  ItemQuery,
  MediaAsset,
  MediaInput,
  PageMeta,
  Region,
  RegionInput,
  Source,
  User,
  UserInput,
} from "./types";
import type { ContributionStatus } from "./constants";

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

/**
 * Hook global untuk 401 di luar endpoint /auth/* (sesi mati di tengah aktivitas).
 * Dipasang oleh auth-store: membersihkan state login + mengarahkan ke halaman masuk,
 * alih-alih membiarkan CMS menampilkan dashboard penuh galat.
 */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

async function request<T>(path: string, init?: RequestInit): Promise<{ data: T; meta?: PageMeta }> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: "same-origin",
      headers: init?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError("Tidak dapat menghubungi server. Periksa koneksi Anda.", 0);
  }
  if (res.status === 401 && !path.startsWith("/auth/") && unauthorizedHandler) {
    unauthorizedHandler();
  }
  const json = (await res.json().catch(() => null)) as (ApiOk<T> & { error?: never }) | { error: { message: string; fields?: Record<string, string> } } | null;
  if (!res.ok || !json || "error" in json) {
    const errObj = json && "error" in json && json.error ? json.error : null;
    const msg = errObj?.message ?? `Permintaan gagal (${res.status}).`;
    const fields = errObj?.fields;
    throw new ApiError(msg, res.status, fields);
  }
  return { data: json.data, meta: json.meta };
}

const qs = (params: Record<string, string | number | undefined | null>) => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
};

// ============ AUTH ============
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<User>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
    me: () => request<User | null>("/auth/me"),
  },

  // ============ PUBLIK ============
  regions: {
    list: () => request<Region[]>("/regions"),
  },
  categories: {
    list: () => request<Category[]>("/categories"),
  },
  items: {
    list: (q: ItemQuery = {}) =>
      request<CulturalItem[]>(
        `/cultural-items${qs({
          page: q.page, pageSize: q.pageSize, search: q.search,
          category: q.categorySlug, region: q.regionCode, sort: q.sort,
        })}`
      ),
    detail: (slugOrId: string) => request<CulturalItem>(`/cultural-items/${slugOrId}`),
    sources: (id: string) => request<Source[]>(`/cultural-items/${id}/sources`),
    media: (id: string) => request<MediaAsset[]>(`/cultural-items/${id}/media`),
  },
  sources: {
    list: (q: { search?: string; type?: string } = {}) =>
      request<Source[]>(`/sources${qs({ search: q.search, type: q.type })}`),
  },
  contributions: {
    create: (payload: ContributionInput) =>
      request<{ contribution: Contribution }>("/contributions", { method: "POST", body: JSON.stringify(payload) }),
    track: (refCode: string, email: string) =>
      request<Contribution>(`/contributions/track${qs({ refCode, email })}`),
    my: () => request<Contribution[]>("/my/contributions"),
  },

  // ============ ADMIN / CMS ============
  admin: {
    stats: () => request<AdminStats>("/admin/stats"),
    activity: (q: { page?: number; pageSize?: number } = {}) =>
      request<ActivityEntry[]>(`/admin/activity${qs({ page: q.page, pageSize: q.pageSize })}`),

    items: {
      list: (q: AdminItemQuery = {}) =>
        request<CulturalItem[]>(
          `/admin/cultural-items${qs({
            page: q.page, pageSize: q.pageSize, search: q.search, category: q.categorySlug,
            region: q.regionCode, status: q.status === "ALL" ? undefined : q.status, featured: q.featured, sort: q.sort,
          })}`
        ),
      detail: (id: string) => request<CulturalItem>(`/admin/cultural-items/${id}`),
      create: (payload: ItemInput) =>
        request<CulturalItem>("/admin/cultural-items", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: string, payload: Partial<ItemInput>) =>
        request<CulturalItem>(`/admin/cultural-items/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
      delete: (id: string) => request<{ ok: boolean }>(`/admin/cultural-items/${id}`, { method: "DELETE" }),
    },

    regions: {
      list: () => request<Region[]>("/admin/regions"),
      create: (payload: RegionInput) =>
        request<Region>("/admin/regions", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: string, payload: Partial<RegionInput>) =>
        request<Region>(`/admin/regions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
      delete: (id: string) => request<{ ok: boolean }>(`/admin/regions/${id}`, { method: "DELETE" }),
    },

    categories: {
      list: () => request<Category[]>("/admin/categories"),
      create: (payload: CategoryInput) =>
        request<Category>("/admin/categories", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: string, payload: Partial<CategoryInput>) =>
        request<Category>(`/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
      delete: (id: string) => request<{ ok: boolean }>(`/admin/categories/${id}`, { method: "DELETE" }),
    },

    media: {
      list: (q: { page?: number; pageSize?: number; type?: string; search?: string; status?: string } = {}) =>
        request<MediaAsset[]>(`/admin/media${qs({ page: q.page, pageSize: q.pageSize, type: q.type, search: q.search, status: q.status })}`),
      detail: (id: string) => request<MediaAsset>(`/admin/media/${id}`),
      upload: (file: File, meta: MediaInput, onProgress?: (pct: number) => void) =>
        new Promise<{ data: MediaAsset }>((resolve, reject) => {
          const form = new FormData();
          form.append("file", file);
          for (const [k, v] of Object.entries(meta)) if (v !== undefined && v !== null) form.append(k, String(v));
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${BASE}/admin/media`);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            try {
              const json = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) resolve({ data: json.data });
              else reject(new ApiError(json?.error?.message ?? `Upload gagal (${xhr.status}).`, xhr.status, json?.error?.fields));
            } catch {
              reject(new ApiError(`Upload gagal (${xhr.status}).`, xhr.status));
            }
          };
          xhr.onerror = () => reject(new ApiError("Koneksi terputus saat mengunggah.", 0));
          xhr.withCredentials = true;
          xhr.send(form);
        }),
      update: (id: string, payload: Partial<MediaInput> & { status?: string }) =>
        request<MediaAsset>(`/admin/media/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
      /** Daftarkan model 3D embed eksternal (Sketchfab) tanpa berkas */
      embed: (payload: { name: string; embedUrl: string; description?: string; license?: string; attribution?: string }) =>
        request<MediaAsset>("/admin/media/embed", { method: "POST", body: JSON.stringify(payload) }),
      delete: (id: string) => request<{ ok: boolean }>(`/admin/media/${id}`, { method: "DELETE" }),
    },

    sources: {
      list: (q: { search?: string; type?: string; itemId?: string } = {}) =>
        request<Source[]>(`/admin/sources${qs({ search: q.search, type: q.type, itemId: q.itemId })}`),
      create: (payload: Omit<Source, "id" | "createdAt">) =>
        request<Source>("/admin/sources", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: string, payload: Partial<Omit<Source, "id" | "createdAt">>) =>
        request<Source>(`/admin/sources/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
      delete: (id: string) => request<{ ok: boolean }>(`/admin/sources/${id}`, { method: "DELETE" }),
    },

    contributions: {
      list: (q: { status?: string; page?: number; pageSize?: number } = {}) =>
        request<Contribution[]>(`/admin/contributions${qs({ status: q.status, page: q.page, pageSize: q.pageSize })}`),
      detail: (id: string) => request<Contribution>(`/admin/contributions/${id}`),
      setStatus: (id: string, payload: ContributionStatusInput) =>
        request<Contribution>(`/admin/contributions/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
    },

    users: {
      list: () => request<User[]>("/admin/users"),
      create: (payload: UserInput) =>
        request<User>("/admin/users", { method: "POST", body: JSON.stringify(payload) }),
      update: (id: string, payload: Partial<UserInput>) =>
        request<User>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    },

    settings: {
      get: () => request<Record<string, string>>("/admin/settings"),
      update: (payload: Record<string, string>) =>
        request<Record<string, string>>("/admin/settings", { method: "PUT", body: JSON.stringify(payload) }),
    },

    hotspots: {
      create: (itemId: string, payload: Omit<Hotspot, "id" | "itemId" | "createdAt">) =>
        request<Hotspot>(`/admin/cultural-items/${itemId}/hotspots`, { method: "POST", body: JSON.stringify(payload) }),
      update: (itemId: string, hotspotId: string, payload: Partial<Omit<Hotspot, "id" | "itemId" | "createdAt">>) =>
        request<Hotspot>(`/admin/cultural-items/${itemId}/hotspots/${hotspotId}`, { method: "PATCH", body: JSON.stringify(payload) }),
      delete: (itemId: string, hotspotId: string) =>
        request<{ ok: boolean }>(`/admin/cultural-items/${itemId}/hotspots/${hotspotId}`, { method: "DELETE" }),
    },
  },
};

// ============ Helper status (untuk badge dsb) ============
export const contributionStatusColor = (s: ContributionStatus): string =>
  ({
    SUBMITTED: "bg-amber-100 text-amber-800 border-amber-200",
    IN_REVIEW: "bg-sky-100 text-sky-800 border-sky-200",
    NEEDS_REVISION: "bg-orange-100 text-orange-800 border-orange-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  }[s] ?? "bg-slate-100 text-slate-700 border-slate-200");

export const itemStatusColor = (s: string): string =>
  ({
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    PUBLISHED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ARCHIVED: "bg-stone-100 text-stone-600 border-stone-200",
  }[s] ?? "bg-slate-100 text-slate-700 border-slate-200");
