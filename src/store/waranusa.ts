'use client'

import { create } from 'zustand'

/**
 * Router SPA WaraNusa (satu route "/" — navigasi via state).
 * 'budaya' memerlukan detailItemId, 'instrumen' memerlukan instrumentItemId.
 */
export type MainView =
  | 'jelajah' // landing + peta interaktif (+ province view)
  | 'katalog' // katalog budaya (filter + pagination)
  | 'budaya' // detail objek budaya
  | 'instrumen' // pengalaman instrumen virtual
  | 'arsip' // arsip budaya (penekanan metadata & sumber)
  | 'kontribusi' // formulir kontribusi (perlu login)
  | 'riwayat' // riwayat kontribusi saya (perlu login)
  | 'masuk' // masuk / daftar
  | 'admin' // panel admin CMS (perlu role)

interface WaraNusaState {
  view: MainView
  setView: (v: MainView) => void
  island: string | null
  setIsland: (key: string | null) => void
  provinceSlug: string | null
  openProvince: (slug: string) => void
  closeProvince: () => void
  detailItemId: string | null
  openItemDetail: (id: string) => void
  closeItemDetail: () => void
  instrumentItemId: string | null
  openInstrument: (id: string) => void
  closeInstrument: () => void
  /** View tujuan setelah login sukses (mis. kontribusi). */
  loginRedirect: MainView | null
  setLoginRedirect: (v: MainView | null) => void
}

export const useWaranusa = create<WaraNusaState>((set) => ({
  view: 'jelajah',
  setView: (view) => set({ view, provinceSlug: null, detailItemId: null }),
  island: null,
  setIsland: (island) => set({ island }),
  provinceSlug: null,
  openProvince: (provinceSlug) => set({ provinceSlug, view: 'jelajah', detailItemId: null }),
  closeProvince: () => set({ provinceSlug: null }),
  detailItemId: null,
  openItemDetail: (detailItemId) => set({ detailItemId, view: 'budaya', provinceSlug: null }),
  closeItemDetail: () => set({ detailItemId: null, view: 'jelajah' }),
  instrumentItemId: null,
  openInstrument: (instrumentItemId) =>
    set({ instrumentItemId, view: 'instrumen', provinceSlug: null, detailItemId: null }),
  closeInstrument: () => set({ instrumentItemId: null, view: 'jelajah' }),
  loginRedirect: null,
  setLoginRedirect: (loginRedirect) => set({ loginRedirect }),
}))
