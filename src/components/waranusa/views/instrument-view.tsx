'use client'

/**
 * InstrumentView — pengalaman instrumen virtual (view 'instrumen'):
 * - Daftar instrumen bisa dimainkan (kiri) + viewer 3D & pad nada (kanan)
 * - Kontrol volume Web Audio, panduan interaksi, ringkasan budaya
 */
import { useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { useArchiveItems } from '@/hooks/use-waradata'
import { instrumentAudio } from '@/lib/instrument-audio'
import { AI_ILLUSTRATION_NOTE, CATEGORY_MAP } from '@/data/islands'
import { useWaranusa } from '@/store/waranusa'
import ThreeViewer from '../three-viewer'
import {
  ArrowRight,
  ChevronRight,
  Hand,
  MapPin,
  MousePointerClick,
  Music4,
  RefreshCw,
  Rotate3d,
  TriangleAlert,
  Volume2,
  ZoomIn,
} from 'lucide-react'
import { motion } from 'framer-motion'

export function InstrumentView() {
  const { data: items, isLoading, error, refetch } = useArchiveItems({ playable: true })
  const instrumentItemId = useWaranusa((s) => s.instrumentItemId)
  const openItemDetail = useWaranusa((s) => s.openItemDetail)
  const openInstrument = useWaranusa((s) => s.openInstrument)
  const setView = useWaranusa((s) => s.setView)
  const [volume, setVolume] = useState(55)

  const selected = useMemo(
    () => items?.find((it) => it.id === instrumentItemId) ?? items?.[0],
    [items, instrumentItemId],
  )

  const handleVolume = (v: number) => {
    setVolume(v)
    instrumentAudio.setVolume(v / 100)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <Skeleton className="h-[420px] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-[420px] rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-card p-8 text-center">
          <TriangleAlert className="h-8 w-8 text-destructive" aria-hidden />
          <h1 className="font-display text-lg font-bold text-foreground">Gagal memuat instrumen</h1>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'}
          </p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed bg-card p-8 text-center">
          <Music4 className="h-8 w-8 text-muted-foreground/50" aria-hidden />
          <h1 className="font-display text-xl font-bold text-foreground">Belum ada instrumen virtual</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Saat ini belum ada alat musik yang bisa dimainkan. Cek kembali nanti atau jelajahi katalog budaya.
          </p>
          <Button className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setView('katalog')}>
            Buka Katalog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
    >
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Instrumen Virtual Nusantara</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {items.length} alat musik tradisional siap dimainkan — klik nada, putar model 3D, dan dengarkan melodi demo.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Daftar instrumen */}
        <aside className="h-fit rounded-2xl border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Daftar Instrumen</h2>
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {items.length}
            </Badge>
          </div>
          <div className="wn-scroll max-h-[420px] space-y-1 overflow-y-auto pr-1" role="listbox" aria-label="Pilih instrumen">
            {items.map((it) => {
              const active = selected?.id === it.id
              return (
                <button
                  key={it.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => openInstrument(it.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{it.name}</span>
                    <span className={`block truncate text-xs ${active ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {it.province?.name ?? 'Indonesia'}
                    </span>
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>
        </aside>

        {/* Panel instrumen terpilih */}
        {selected && (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{selected.name}</h2>
                {selected.province && (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    <MapPin className="h-3 w-3" aria-hidden /> {selected.province.name}
                  </Badge>
                )}
                {selected.region && (
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {selected.region}
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{selected.shortDesc}</p>
            </div>

            {selected.model3d ? (
              <ThreeViewer
                model3d={selected.model3d}
                parts={selected.parts}
                sounds={selected.sounds}
                melody={selected.melody}
                playable={selected.playable}
              />
            ) : (
              <figure className="space-y-1.5">
                <div className="overflow-hidden rounded-xl border shadow-sm">
                  <img
                    src={selected.imageUrl ?? CATEGORY_MAP[selected.category]?.image ?? '/images/alat-musik.png'}
                    alt={`Ilustrasi ${selected.name}`}
                    className="h-64 w-full object-cover sm:h-80"
                    width={1152}
                    height={864}
                  />
                </div>
                <p className="text-[11px] italic text-muted-foreground">{AI_ILLUSTRATION_NOTE}</p>
              </figure>
            )}

            {/* Kontrol volume */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <Label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Volume2 className="h-4 w-4 text-primary" aria-hidden /> Volume
                </Label>
                <span className="text-xs font-medium text-muted-foreground">{volume}%</span>
              </div>
              <Slider
                className="mt-3"
                value={[volume]}
                onValueChange={(vals) => handleVolume(Array.isArray(vals) ? vals[0] : vals)}
                min={0}
                max={100}
                step={1}
                aria-label="Volume instrumen"
              />
            </div>

            {/* Simulasi busur virtual / gesekan rebab */}
            <VirtualBowSection />

            {/* Cara berinteraksi */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Hand className="h-4 w-4" aria-hidden /> Cara Berinteraksi
              </h3>
              <ul className="mt-2.5 grid gap-2.5 text-sm text-foreground sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Klik pad nada atau penanda bagian model untuk membunyikan dan memfokuskan bagian.
                </li>
                <li className="flex items-start gap-2">
                  <Rotate3d className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Seret kanvas untuk memutar model hingga 360 derajat.
                </li>
                <li className="flex items-start gap-2">
                  <ZoomIn className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Gulir untuk memperbesar atau memperkecil tampilan.
                </li>
                <li className="flex items-start gap-2">
                  <Music4 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Tekan tombol &ldquo;Contoh Suara&rdquo; untuk mendengarkan melodi demo.
                </li>
              </ul>
            </div>

            {/* Catatan transparansi audio */}
            <div className="rounded-2xl border border-brand-gold/40 bg-brand-gold/5 p-3.5">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" aria-hidden />
                Suara merupakan sintesis demonstrasi Web Audio API — bukan rekaman autentik instrumen.
              </p>
            </div>

            {/* Ringkasan budaya */}
            <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tentang Instrumen</h3>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-foreground">{selected.description}</p>
              {selected.philosophy && (
                <p className="mt-2 line-clamp-2 text-sm italic leading-relaxed text-muted-foreground">
                  {selected.philosophy}
                </p>
              )}
              <Button
                variant="outline"
                className="mt-3.5 gap-1.5 border-primary/40 text-primary hover:bg-accent"
                onClick={() => openItemDetail(selected.id)}
              >
                Lihat Detail Budaya <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  )
}

function VirtualBowSection() {
  const [bowFreq, setBowFreq] = useState(262)
  const [strokeIntensity, setStrokeIntensity] = useState(1.0)
  const [isBowing, setIsBowing] = useState(false)
  const lastXRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(Date.now())

  const BOW_NOTES = [
    { label: 'Dawai 1 (Nem)', freq: 220, note: '6' },
    { label: 'Dawai 2 (Barang)', freq: 262, note: '1' },
    { label: 'Dawai 3 (Gulu)', freq: 294, note: '2' },
    { label: 'Dawai 4 (Pelog)', freq: 330, note: '3' },
  ]

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsBowing(true)
    lastXRef.current = e.clientX
    lastTimeRef.current = Date.now()
    instrumentAudio.bow(bowFreq, 0.9)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isBowing || lastXRef.current === null) return
    const now = Date.now()
    const dt = Math.max(16, now - lastTimeRef.current)
    const dx = Math.abs(e.clientX - lastXRef.current)
    const speed = (dx / dt) * 100 // kecepatan gerakan piksel
    const intensity = Math.min(2.0, Math.max(0.4, speed / 15))
    setStrokeIntensity(intensity)
    if (dx > 4) {
      instrumentAudio.bow(bowFreq, intensity)
      lastXRef.current = e.clientX
      lastTimeRef.current = now
    }
  }

  const handlePointerUp = () => {
    setIsBowing(false)
    lastXRef.current = null
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs">
              🎻
            </span>
            Simulasi Gerakan Busur Virtual (Rebab / Dawai Gesek)
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tarik atau seret busur ke kiri & kanan. Kecepatan tarikan memengaruhi dinamika dan resonansi dawai.
          </p>
        </div>
        <Badge variant="outline" className="border-brand-teal/40 text-[11px] text-brand-teal">
          Dinamika Gesekan: {(strokeIntensity * 100).toFixed(0)}%
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {BOW_NOTES.map((n) => (
          <Button
            key={n.freq}
            size="sm"
            variant={bowFreq === n.freq ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => {
              setBowFreq(n.freq)
              instrumentAudio.bow(n.freq, strokeIntensity)
            }}
          >
            {n.label}
          </Button>
        ))}
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="mt-3.5 relative flex h-16 w-full cursor-ew-resize select-none items-center justify-center rounded-xl border border-dashed border-primary/40 bg-gradient-to-r from-muted via-accent/30 to-muted touch-none"
      >
        <span className="text-xs font-semibold text-primary">
          {isBowing ? '⚡ Menggesek Dawai Rebab…' : '↔ Geser kursor atau sentuh di sini untuk menggesek busur'}
        </span>
        <div
          className="absolute inset-y-1 w-2.5 rounded-full bg-brand-gold shadow transition-all pointer-events-none"
          style={{
            left: `${Math.min(95, Math.max(5, strokeIntensity * 45))}%`,
            opacity: isBowing ? 1 : 0.5,
          }}
        />
      </div>
    </div>
  )
}
