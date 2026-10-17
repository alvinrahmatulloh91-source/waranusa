'use client'

/**
 * Hook data panel pengelola WaraNusa (TanStack Query).
 * Semua endpoint /api/admin/* divalidasi server (sesi + peran) — hook ini
 * hanya membungkus fetch same-origin (cookie httpOnly dikirim otomatis).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AdminItemRecord,
  AdminStats,
  AdminUserRecord,
  CategoryMeta,
  ContributionRecord,
  ContributionStatus,
  ItemSource,
  ItemStatus,
  MediaAssetRecord,
  MediaType,
  ProvinceSummary,
} from '@/lib/types'

export interface AdminMediaParams {
  q?: string
  type?: string
  itemId?: string
  page: number
  pageSize: number
}

export interface AdminMediaPayload {
  title: string
  type: MediaType
  url: string
  license?: string | null
  creator?: string | null
  sourceUrl?: string | null
  caption?: string | null
  itemId?: string | null
  isFeatured?: boolean
}

export interface AdminSourceParams {
  q?: string
  itemId?: string
  license?: string
  page: number
  pageSize: number
}

export interface AdminSourcePayload {
  title: string
  url?: string | null
  publisher?: string | null
  year?: string | null
  license?: string | null
  note?: string | null
  itemId: string
}

/** Record provinsi untuk admin: ringkasan + narasi deskriptif. */
export type AdminProvinceRecord = ProvinceSummary & {
  description: string
  history: string
  traditions: string
}

/** Meta paginasi daftar item admin. */
export interface AdminItemsMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** Parameter filter daftar item admin. */
export interface AdminItemsParams {
  q?: string
  status?: ItemStatus
  province?: string
  category?: string
  page: number
  pageSize: number
}

/** Body untuk POST/PATCH objek budaya (kolom JSON parts/sounds/melody tidak diedit di UI). */
export interface AdminItemPayload {
  name: string
  category: string
  provinceId: string
  shortDesc: string
  description: string
  philosophy?: string
  imageUrl?: string
  model3d?: string
  playable?: boolean
  needsReview?: boolean
  status?: ItemStatus
  sources?: ItemSource[]
}

export interface AdminProvincePayload {
  name: string
  slug?: string
  island: string
  capital: string
  lat: number
  lng: number
  motto: string
  description: string
  history: string
  traditions: string
}

export interface AdminCategoryPayload {
  key: string
  label: string
  description: string
  icon?: string
  image?: string
}

/**
 * fetchAdmin — fetch JSON dengan pesan galat server.
 * Bila respons tidak OK, lempar Error(data.error) agar toast UI
 * menampilkan pesan berbahasa Indonesia dari backend.
 */
async function fetchAdmin<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Terjadi kesalahan pada panel pengelola. Coba lagi.')
  }
  return data as T
}

function jsonBody(payload: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

/* ---------- Statistik dashboard ---------- */

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const data = await fetchAdmin<{ stats: AdminStats }>('/api/admin/stats')
      return data.stats
    },
    retry: false,
    staleTime: 15_000,
  })
}

/* ---------- Objek budaya ---------- */

export function useAdminItems(params: AdminItemsParams) {
  return useQuery<{ items: AdminItemRecord[]; meta: AdminItemsMeta }>({
    queryKey: ['admin', 'items', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params.q) sp.set('q', params.q)
      if (params.status) sp.set('status', params.status)
      if (params.province) sp.set('province', params.province)
      if (params.category) sp.set('category', params.category)
      sp.set('page', String(params.page))
      sp.set('pageSize', String(params.pageSize))
      return fetchAdmin(`/api/admin/items?${sp.toString()}`)
    },
    retry: false,
    staleTime: 10_000,
  })
}

export function useCreateAdminItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminItemPayload) =>
      fetchAdmin<{ item: AdminItemRecord | null }>('/api/admin/items', jsonBody(payload)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'items'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useUpdateAdminItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AdminItemPayload> & { id: string }) =>
      fetchAdmin<{ item: AdminItemRecord | null }>(`/api/admin/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'items'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

/* ---------- Wilayah / provinsi ---------- */

export function useAdminProvinces() {
  return useQuery<AdminProvinceRecord[]>({
    queryKey: ['admin', 'provinces'],
    queryFn: async () => {
      const data = await fetchAdmin<{ provinces: AdminProvinceRecord[] }>('/api/admin/provinces')
      return data.provinces
    },
    retry: false,
    staleTime: 60_000,
  })
}

export function useCreateAdminProvince() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminProvincePayload) =>
      fetchAdmin<{ province: AdminProvinceRecord }>('/api/admin/provinces', jsonBody(payload)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'provinces'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      void qc.invalidateQueries({ queryKey: ['provinces'] })
    },
  })
}

export function useUpdateAdminProvince() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AdminProvincePayload> & { id: string }) =>
      fetchAdmin<{ province: AdminProvinceRecord }>(`/api/admin/provinces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'provinces'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      void qc.invalidateQueries({ queryKey: ['provinces'] })
    },
  })
}

/* ---------- Kategori ---------- */

export function useAdminCategories() {
  return useQuery<CategoryMeta[]>({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const data = await fetchAdmin<{ categories: CategoryMeta[] }>('/api/admin/categories')
      return data.categories
    },
    retry: false,
    staleTime: 60_000,
  })
}

export function useCreateAdminCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminCategoryPayload) =>
      fetchAdmin<{ category: CategoryMeta }>('/api/admin/categories', jsonBody(payload)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      void qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateAdminCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AdminCategoryPayload> & { id: string }) =>
      fetchAdmin<{ category: CategoryMeta }>(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      void qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/* ---------- Kontribusi & moderasi ---------- */

export function useAdminContributions(status?: ContributionStatus) {
  return useQuery<ContributionRecord[]>({
    queryKey: ['admin', 'contributions', status ?? 'ALL'],
    queryFn: async () => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ''
      const data = await fetchAdmin<{ contributions: ContributionRecord[] }>(
        `/api/admin/contributions${qs}`,
      )
      return data.contributions
    },
    retry: false,
    staleTime: 10_000,
  })
}

export function useSetContributionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      status: Exclude<ContributionStatus, 'SUBMITTED'>
      note?: string
      publish?: boolean
    }) =>
      fetchAdmin<{ contribution: ContributionRecord; createdItemId: string | null }>(
        `/api/admin/contributions/${input.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: input.status,
            note: input.note || undefined,
            publish: input.publish,
          }),
        },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'contributions'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'items'] })
      void qc.invalidateQueries({ queryKey: ['my-contributions'] })
    },
  })
}

/* ---------- Pengguna ---------- */

export function useAdminUsers() {
  return useQuery<AdminUserRecord[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const data = await fetchAdmin<{ users: AdminUserRecord[] }>('/api/admin/users')
      return data.users
    },
    retry: false,
    staleTime: 30_000,
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; role: string }) =>
      fetchAdmin<{ user: AdminUserRecord }>(`/api/admin/users/${input.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: input.role }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

/* ---------- Media Assets ---------- */

export function useAdminMedia(params: AdminMediaParams) {
  return useQuery<{ media: MediaAssetRecord[]; meta: AdminItemsMeta }>({
    queryKey: ['admin', 'media', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params.q) sp.set('q', params.q)
      if (params.type) sp.set('type', params.type)
      if (params.itemId) sp.set('itemId', params.itemId)
      sp.set('page', String(params.page))
      sp.set('pageSize', String(params.pageSize))
      return fetchAdmin(`/api/admin/media?${sp.toString()}`)
    },
    retry: false,
    staleTime: 10_000,
  })
}

export function useCreateAdminMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminMediaPayload) =>
      fetchAdmin<{ media: MediaAssetRecord }>('/api/admin/media', jsonBody(payload)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'media'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useUpdateAdminMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AdminMediaPayload> & { id: string }) =>
      fetchAdmin<{ media: MediaAssetRecord }>(`/api/admin/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'media'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useDeleteAdminMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      fetchAdmin<{ ok: boolean; id: string }>(`/api/admin/media/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'media'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

/* ---------- Sources / Referensi ---------- */

export function useAdminSources(params: AdminSourceParams) {
  return useQuery<{ sources: (ItemSource & { culturalItem?: { id: string; name: string; category: string } })[]; meta: AdminItemsMeta }>({
    queryKey: ['admin', 'sources', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params.q) sp.set('q', params.q)
      if (params.itemId) sp.set('itemId', params.itemId)
      if (params.license) sp.set('license', params.license)
      sp.set('page', String(params.page))
      sp.set('pageSize', String(params.pageSize))
      return fetchAdmin(`/api/admin/sources?${sp.toString()}`)
    },
    retry: false,
    staleTime: 10_000,
  })
}

export function useCreateAdminSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: AdminSourcePayload) =>
      fetchAdmin<{ source: ItemSource }>('/api/admin/sources', jsonBody(payload)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'sources'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'items'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useUpdateAdminSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AdminSourcePayload> & { id: string }) =>
      fetchAdmin<{ source: ItemSource }>(`/api/admin/sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'sources'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'items'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useDeleteAdminSource() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      fetchAdmin<{ ok: boolean; id: string }>(`/api/admin/sources/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'sources'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'items'] })
      void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

