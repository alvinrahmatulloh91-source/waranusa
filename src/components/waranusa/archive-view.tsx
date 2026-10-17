'use client'

/**
 * ArchiveView — arsip budaya dengan pencarian & filter.
 */
import { useMemo, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useArchiveItems } from '@/hooks/use-waradata'
import { CATEGORIES, ISLAND_GROUPS } from '@/data/islands'
import { ItemCard } from './item-card'
import { Search, FilterX, Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function ArchiveView() {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [category, setCategory] = useState('ALL')
  const [island, setIsland] = useState('ALL')
  const [playableOnly, setPlayableOnly] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  const filters = useMemo(
    () => ({ q: debouncedQ || undefined, category, island, playable: playableOnly }),
    [debouncedQ, category, island, playableOnly]
  )
  const { data: items, isLoading, isFetching } = useArchiveItems(filters)

  const hasFilter = !!debouncedQ || category !== 'ALL' || island !== 'ALL' || playableOnly

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6"
    >
      {/* Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border shadow-sm">
        { }
        <img
          src="/images/arsip-banner.png"
          alt="Ilustrasi arsip budaya: manuskrip, wayang, dan lontar"
          className="h-40 w-full object-cover sm:h-56"
          width={1344}
          height={768}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center gap-1 p-6 sm:p-10">
          <h1 className="font-display text-3xl font-bold text-white drop-shadow sm:text-4xl">Arsip Budaya</h1>
          <p className="max-w-md text-sm text-white/85 sm:text-base">
            {items?.length ?? '…'} item budaya terdokumentasi lengkap dengan deskripsi, filosofi, dan sumber rujukan.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari rumah adat, tarian, makanan…"
            className="pl-9"
            aria-label="Cari arsip budaya"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filter kategori">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={island} onValueChange={setIsland}>
          <SelectTrigger aria-label="Filter pulau">
            <SelectValue placeholder="Pulau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Pulau</SelectItem>
            {ISLAND_GROUPS.map((g) => (
              <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2">
            <Switch id="playable-only" checked={playableOnly} onCheckedChange={setPlayableOnly} />
            <Label htmlFor="playable-only" className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" /> Ada suara
            </Label>
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-muted-foreground"
              onClick={() => {
                setQ('')
                setCategory('ALL')
                setIsland('ALL')
                setPlayableOnly(false)
              }}
            >
              <FilterX className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Grid hasil */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : (items?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Search className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">Tidak ada hasil ditemukan</p>
          <p className="text-xs text-muted-foreground">Coba kata kunci lain atau hapus filter.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {items?.length} item
            </Badge>
            {isFetching && <span className="text-xs text-muted-foreground">memperbarui…</span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items?.map((item) => <ItemCard key={item.id} item={item} showProvince />)}
          </div>
        </>
      )}
    </motion.section>
  )
}
