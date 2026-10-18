'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProvinces } from '@/hooks/use-waradata'
import { ISLAND_GROUPS, ISLAND_MAP } from '@/data/islands'
import { useWaranusa } from '@/store/waranusa'
import { IndonesiaMap } from './indonesia-map'
import {
  MapPin,
  X,
  ChevronRight,
  Landmark,
  Users,
  AlertTriangle,
  RotateCcw,
  Compass,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function MapExplorer() {
  const { data: provinces, isLoading, error, refetch } = useProvinces()
  const { island, setIsland, openProvince, setView } = useWaranusa()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const visible = (provinces ?? []).filter((p) => !island || p.island === island)
  const selectedProv = provinces?.find((p) => p.slug === selectedSlug)

  const handleSelectProvince = (slug: string) => {
    setSelectedSlug(slug)
  }

  return (
    <section id="jelajah" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Peta Budaya Indonesia
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Pilih gugus pulau untuk memfilter, lalu ketuk penanda provinsi pada peta untuk melihat
          ringkasan budaya, rumah adat, busana tradisional, instrumen musik, dan sejarah lokal.
        </p>
      </div>

      {/* Filter pulau */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button
          variant={island === null ? 'default' : 'outline'}
          size="sm"
          className={cn('h-9 rounded-full', island === null ? 'bg-primary text-primary-foreground' : 'bg-card')}
          onClick={() => {
            setIsland(null)
            setSelectedSlug(null)
          }}
        >
          <MapPin className="h-3.5 w-3.5" /> Semua Pulau
        </Button>
        {ISLAND_GROUPS.map((g) => (
          <Button
            key={g.key}
            variant={island === g.key ? 'default' : 'outline'}
            size="sm"
            className={cn('h-9 rounded-full', island === g.key ? 'text-white' : 'bg-card text-foreground')}
            style={island === g.key ? { backgroundColor: g.color, borderColor: g.color } : undefined}
            onClick={() => {
              setIsland(island === g.key ? null : g.key)
              setSelectedSlug(null)
            }}
            aria-pressed={island === g.key}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: island === g.key ? '#fff' : g.color }}
              aria-hidden
            />
            {g.label}
          </Button>
        ))}
      </div>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5 p-8 text-center shadow-sm">
          <CardContent className="flex flex-col items-center justify-center space-y-3 p-0">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="font-display text-lg font-bold text-foreground">
              Gagal Memuat Data Peta Nusantara
            </h3>
            <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
              Terjadi kendala saat mengambil data wilayah dan sebaran budaya. Silakan periksa koneksi dan coba muat ulang.
            </p>
            <Button
              onClick={() => void refetch()}
              variant="outline"
              size="sm"
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Coba Muat Ulang
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-4">
            {isLoading ? (
              <Skeleton className="h-[320px] w-full rounded-2xl sm:h-[420px]" />
            ) : (
              <IndonesiaMap
                provinces={provinces ?? []}
                island={island}
                selectedProvince={selectedSlug}
                onSelectIsland={setIsland}
                onSelectProvince={handleSelectProvince}
              />
            )}

            {/* Panel Ringkasan Wilayah Terpilih */}
            <AnimatePresence mode="wait">
              {selectedProv ? (
                <motion.div
                  key={selectedProv.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-2xl border border-primary/30 bg-card p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          style={{ backgroundColor: ISLAND_MAP[selectedProv.island]?.color }}
                          className="text-white text-xs"
                        >
                          {ISLAND_MAP[selectedProv.island]?.label ?? 'Nusantara'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Ibu kota: {selectedProv.capital}
                        </Badge>
                        <Badge variant="secondary" className="text-xs text-brand-teal">
                          {selectedProv.itemCount} Objek Budaya Terdata
                        </Badge>
                      </div>
                      <h3 className="font-display text-xl font-bold text-foreground">
                        Provinsi {selectedProv.name}
                      </h3>
                      <p className="text-xs text-muted-foreground italic">
                        &ldquo;{selectedProv.motto}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setView('katalog')}
                        className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-accent"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Buka Katalog
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openProvince(selectedProv.slug)}
                        className="gap-1.5 text-xs bg-primary text-primary-foreground shadow-sm"
                      >
                        <Compass className="h-3.5 w-3.5" /> Profil Wilayah <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : island && ISLAND_MAP[island] ? (
                <motion.div
                  key={island}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div>
                    <p className="font-display text-lg font-bold" style={{ color: ISLAND_MAP[island].color }}>
                      {ISLAND_MAP[island].label}
                    </p>
                    <p className="text-sm text-muted-foreground">{ISLAND_MAP[island].desc}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setIsland(null)}
                    aria-label="Hapus filter pulau"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <p className="text-[11px] text-muted-foreground italic text-center sm:text-left">
              * Peta interaktif bergaya stilasi visual Nusantara untuk penjelajahan budaya (bukan batas administratif resmi).
            </p>
          </div>

          {/* Panel daftar provinsi */}
          <Card className="h-fit shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Provinsi {island ? `• ${ISLAND_MAP[island]?.label}` : ''}
                </h3>
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  {visible.length}
                </Badge>
              </div>
              <div className="wn-scroll max-h-[440px] space-y-2 overflow-y-auto pr-1">
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                {visible.map((p) => {
                  const g = ISLAND_MAP[p.island]
                  const isSelected = selectedSlug === p.slug
                  return (
                    <button
                      key={p.slug}
                      onClick={() => handleSelectProvince(p.slug)}
                      onDoubleClick={() => openProvince(p.slug)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all hover:border-border hover:bg-accent/60 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring',
                        isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent bg-background'
                      )}
                      aria-label={`Pilih provinsi ${p.name}`}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                        style={{ backgroundColor: g.color }}
                      >
                        <Landmark className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{p.name}</span>
                        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{p.itemCount} item budaya</span>
                          {p.communityCount > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-700">
                              <Users className="h-3 w-3" /> {p.communityCount}
                            </span>
                          )}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </button>
                  )
                })}
                {!isLoading && visible.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada provinsi pada filter ini.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}
