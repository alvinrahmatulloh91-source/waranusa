'use client'

/**
 * KatalogView — katalog budaya Indonesia (view 'katalog'):
 * - Panel header gradasi teal → biru laut
 * - Filter: pencarian (debounce), kategori, provinsi, gugus pulau
 * - Grid kartu + pagination sisi klien (12 item per halaman)
 */
import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useArchiveItems, useCategories, useProvinces } from '@/hooks/use-waradata'
import { CATEGORIES, ISLAND_GROUPS } from '@/data/islands'
import { ItemCard } from '../item-card'
import { ChevronLeft, ChevronRight, FilterX, Search, TriangleAlert } from 'lucide-react'
import { motion } from 'framer-motion'

const PAGE_SIZE = 12

export function KatalogView() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [category, setCategory] = useState('ALL')
  const [province, setProvince] = useState('ALL')
  const [island, setIsland] = useState('ALL')
  const [page, setPage] = useState(1)

  // Debounce pencarian 350 ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  // Setiap perubahan filter mengembalikan daftar ke halaman 1
  const changeQ = (v: string) => {
    setQ(v)
    setPage(1)
  }
  const changeCategory = (v: string) => {
    setCategory(v)
    setPage(1)
  }
  const changeProvince = (v: string) => {
    setProvince(v)
    setPage(1)
  }
  const changeIsland = (v: string) => {
    setIsland(v)
    setPage(1)
  }

  const filters = useMemo(
    () => ({ q: debouncedQ || undefined, category, province, island }),
    [debouncedQ, category, province, island],
  )
  const { data: items, isLoading, error, refetch } = useArchiveItems(filters)
  const { data: provinces } = useProvinces()
  const { data: categories } = useCategories()

  const catOptions = useMemo(
    () =>
      categories?.map((c) => ({ key: c.key, label: c.label })) ??
      CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
    [categories],
  )

  const list = items ?? []
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const hasFilter = !!debouncedQ || category !== 'ALL' || province !== 'ALL' || island !== 'ALL'

  const resetFilters = () => {
    setQ('')
    setCategory('ALL')
    setProvince('ALL')
    setIsland('ALL')
    setPage(1)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
    >
      {/* Panel header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-brand-ocean p-6 shadow-md sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-gold/20" aria-hidden />
        <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Katalog Budaya Indonesia</h1>
        <p className="mt-1.5 max-w-xl text-sm text-white/85 sm:text-base">
          {isLoading
            ? 'Memuat katalog budaya nusantara…'
            : `${total} objek budaya terpublikasi — rumah adat, pakaian, alat musik, tarian, hingga kuliner daerah.`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => changeQ(e.target.value)}
            placeholder="Cari rumah adat, gamelan, tarian…"
            className="pl-9"
            aria-label="Cari katalog budaya"
          />
        </div>
        <Select value={category} onValueChange={changeCategory}>
          <SelectTrigger aria-label="Filter kategori">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {catOptions.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={province} onValueChange={changeProvince}>
          <SelectTrigger aria-label="Filter provinsi">
            <SelectValue placeholder="Provinsi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Provinsi</SelectItem>
            {(provinces ?? []).map((p) => (
              <SelectItem key={p.slug} value={p.slug}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={island} onValueChange={changeIsland}>
          <SelectTrigger aria-label="Filter gugus pulau">
            <SelectValue placeholder="Pulau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Gugus Pulau</SelectItem>
            {ISLAND_GROUPS.map((g) => (
              <SelectItem key={g.key} value={g.key}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1 text-muted-foreground"
            onClick={resetFilters}
            aria-label="Reset semua filter"
          >
            <FilterX className="h-3.5 w-3.5" aria-hidden /> Reset
          </Button>
        )}
      </div>

      {/* Hasil */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-card py-14 text-center">
          <TriangleAlert className="h-8 w-8 text-destructive" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Gagal memuat katalog</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'}
          </p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void refetch()}>
            Coba Lagi
          </Button>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <Search className="h-8 w-8 text-muted-foreground/50" aria-hidden />
          <p className="text-sm font-medium text-foreground">Tidak ada objek budaya yang cocok</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Coba kata kunci lain, misalnya &ldquo;gamelan&rdquo; atau &ldquo;joglo&rdquo;, atau longgarkan filter
            kategori, provinsi, dan pulau.
          </p>
          {hasFilter && (
            <Button variant="ghost" size="sm" className="mt-1 gap-1 text-muted-foreground" onClick={resetFilters}>
              <FilterX className="h-3.5 w-3.5" aria-hidden /> Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((item) => (
              <ItemCard key={item.id} item={item} showProvince />
            ))}
          </div>

          {/* Pagination sisi klien */}
          <nav aria-label="Navigasi halaman katalog" className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Berikutnya <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Halaman {safePage} dari {totalPages} • {total} item
            </p>
          </nav>
        </>
      )}
    </motion.section>
  )
}
