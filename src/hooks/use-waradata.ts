'use client'

/**
 * Hook data publik & autentikasi WaraNusa (TanStack Query).
 * Hook khusus panel admin ada di src/hooks/use-admin-data.ts.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ProvinceSummary,
  ProvinceFull,
  CulturalItemFull,
  ContributionRecord,
  Stats,
  CategoryMeta,
  SessionUser,
} from '@/lib/types'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? 'Terjadi kesalahan. Coba lagi.'
    throw new Error(msg)
  }
  return data as T
}

/* ---------- Provinsi & statistik ---------- */

export function useProvinces() {
  return useQuery<ProvinceSummary[]>({
    queryKey: ['provinces'],
    queryFn: async () => {
      const data = await fetchJson<{ provinces: ProvinceSummary[] }>('/api/provinces')
      return data.provinces
    },
    staleTime: 60_000,
  })
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const data = await fetchJson<{ stats: Stats }>('/api/stats')
      return data.stats
    },
    staleTime: 30_000,
  })
}

export function useProvince(slug: string | null) {
  return useQuery<ProvinceFull>({
    queryKey: ['province', slug],
    enabled: !!slug,
    queryFn: async () => {
      const data = await fetchJson<{ province: ProvinceFull }>(`/api/provinces/${slug}`)
      return data.province
    },
  })
}

export function useCategories() {
  return useQuery<CategoryMeta[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await fetchJson<{ categories: CategoryMeta[] }>('/api/categories')
      return data.categories
    },
    staleTime: 60_000,
  })
}

/* ---------- Katalog & arsip ---------- */

export interface ArchiveFilters {
  q?: string
  category?: string
  island?: string
  province?: string
  playable?: boolean
}

export function useArchiveItems(filters: ArchiveFilters) {
  return useQuery<CulturalItemFull[]>({
    queryKey: ['archive', filters],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (filters.q) sp.set('q', filters.q)
      if (filters.category && filters.category !== 'ALL') sp.set('category', filters.category)
      if (filters.island && filters.island !== 'ALL') sp.set('island', filters.island)
      if (filters.province && filters.province !== 'ALL') sp.set('province', filters.province)
      if (filters.playable) sp.set('playable', '1')
      const data = await fetchJson<{ items: CulturalItemFull[] }>(`/api/items?${sp.toString()}`)
      return data.items
    },
    staleTime: 30_000,
  })
}

export function useCulturalItem(id: string | null) {
  return useQuery<CulturalItemFull>({
    queryKey: ['item', id],
    enabled: !!id,
    queryFn: async () => {
      const data = await fetchJson<{ item: CulturalItemFull }>(`/api/items/${id}`)
      return data.item
    },
    retry: false,
  })
}

/* ---------- Autentikasi ---------- */

export function useMe() {
  return useQuery<SessionUser | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const data = await fetchJson<{ user: SessionUser | null }>('/api/auth/me')
      return data.user
    },
    staleTime: 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) =>
      fetchJson<{ user: SessionUser }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data.user)
      void qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) =>
      fetchJson<{ user: SessionUser }>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data.user)
      void qc.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => fetchJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.setQueryData(['me'], null)
      void qc.invalidateQueries({ queryKey: ['me'] })
      void qc.invalidateQueries({ queryKey: ['my-contributions'] })
    },
  })
}

/* ---------- Kontribusi ---------- */

export function useMyContributions() {
  return useQuery<ContributionRecord[]>({
    queryKey: ['my-contributions'],
    queryFn: async () => {
      const data = await fetchJson<{ contributions: ContributionRecord[] }>('/api/my/contributions')
      return data.contributions
    },
    retry: false,
  })
}

export interface ContributionInput {
  provinceId?: string | null
  category: string
  title: string
  content: string
  sourceRef?: string
}

export function useSubmitContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ContributionInput) =>
      fetchJson<{ contribution: ContributionRecord }>('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-contributions'] })
      void qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

