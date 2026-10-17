'use client'

/**
 * DetailView — halaman detail objek budaya (view 'budaya'):
 * - Media: viewer 3D interaktif / ilustrasi + atribusi ilustrasi AI
 * - Tentang, filosofi & makna, bagian & makna, sumber & atribusi
 * - Objek terkait dari kategori yang sama
 */
import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useArchiveItems, useCategories, useCulturalItem } from '@/hooks/use-waradata'
import { AI_ILLUSTRATION_NOTE, CATEGORY_MAP, ISLAND_MAP } from '@/data/islands'
import { useWaranusa } from '@/store/waranusa'
import { ItemCard } from '../item-card'
import ThreeViewer from '../three-viewer'
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Box,
  ExternalLink,
  Lightbulb,
  MapPin,
  Music4,
  Puzzle,
  SearchX,
  TriangleAlert,
  Volume2,
} from 'lucide-react'
import { motion } from 'framer-motion'

export function DetailView() {
  const detailItemId = useWaranusa((s) => s.detailItemId)
  const setView = useWaranusa((s) => s.setView)
  const openInstrument = useWaranusa((s) => s.openInstrument)
  const { data: item, isLoading, error } = useCulturalItem(detailItemId)
  const { data: categories } = useCategories()

  // Gulir ke atas setiap kali item berubah
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [detailItemId])

  const catLabel = (key: string) =>
    categories?.find((c) => c.key === key)?.label ?? CATEGORY_MAP[key]?.label ?? key

  if (isLoading) return <DetailSkeleton />

  if (!item) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SearchX className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="font-display text-xl font-bold text-foreground">Objek budaya tidak ditemukan</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {error instanceof Error
              ? error.message
              : 'Objek mungkin telah diarsipkan atau tautan tidak valid. Jelajahi katalog untuk menemukan objek lainnya.'}
          </p>
          <Button
            className="mt-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setView('katalog')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali ke Katalog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
    >
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 gap-1.5 text-muted-foreground"
        onClick={() => setView('katalog')}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali ke katalog
      </Button>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">{catLabel(item.category)}</Badge>
          <Badge variant="outline" className="border-primary/30 text-primary">
            <MapPin className="h-3 w-3" aria-hidden />
            {item.province
              ? `${item.province.name} • ${ISLAND_MAP[item.province.island]?.label ?? 'Indonesia'}`
              : 'Indonesia'}
          </Badge>
          {item.needsReview && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <TriangleAlert className="h-3 w-3" aria-hidden /> Sumber perlu dilengkapi
            </Badge>
          )}
          {item.model3d && (
            <Badge variant="outline" className="gap-1 border-brand-gold/50 bg-brand-gold/10 text-stone-700 dark:text-brand-gold">
              <Box className="h-3 w-3" aria-hidden /> Model 3D
            </Badge>
          )}
          {item.playable && (
            <Badge variant="outline" className="gap-1 border-brand-green/40 bg-brand-green/10 text-brand-green dark:text-brand-green">
              <Volume2 className="h-3 w-3" aria-hidden /> Bisa dimainkan
            </Badge>
          )}
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">{item.name}</h1>
        {item.shortDesc && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{item.shortDesc}</p>
        )}
      </header>

      {/* Media: 3D / ilustrasi */}
      <figure className="mt-6 space-y-1.5">
        {item.model3d ? (
          <Tabs defaultValue="model" className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="model" className="gap-1.5">
                <Box className="h-3.5 w-3.5" aria-hidden /> Model 3D Interaktif
              </TabsTrigger>
              <TabsTrigger value="ilustrasi">Ilustrasi</TabsTrigger>
            </TabsList>
            <TabsContent value="model">
              <ThreeViewer
                model3d={item.model3d}
                parts={item.parts}
                sounds={item.sounds}
                melody={item.melody}
                playable={item.playable}
              />
            </TabsContent>
            <TabsContent value="ilustrasi">
              <div className="overflow-hidden rounded-xl border shadow-sm">
                <img
                  src={item.imageUrl ?? CATEGORY_MAP[item.category]?.image ?? '/images/arsip-banner.png'}
                  alt={`Ilustrasi ${item.name}`}
                  className="h-64 w-full object-cover sm:h-80"
                  width={1152}
                  height={864}
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="overflow-hidden rounded-xl border shadow-sm">
            <img
              src={item.imageUrl ?? CATEGORY_MAP[item.category]?.image ?? '/images/arsip-banner.png'}
              alt={`Ilustrasi ${item.name}`}
              className="h-64 w-full object-cover sm:h-80"
              width={1152}
              height={864}
            />
          </div>
        )}
        <p className="text-[11px] italic text-muted-foreground">{AI_ILLUSTRATION_NOTE}</p>
      </figure>

      {/* CTA instrumen virtual */}
      {item.playable && (
        <div className="mt-6 rounded-2xl border border-brand-gold/40 bg-brand-gold/10 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                Mainkan {item.name} secara virtual
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Bunyikan pad nada, dengarkan melodi demo, dan atur volume langsung dari peramban.
              </p>
            </div>
            <Button
              className="shrink-0 gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              onClick={() => openInstrument(item.id)}
            >
              <Music4 className="h-4 w-4" aria-hidden /> Coba Instrumen Virtual
            </Button>
          </div>
        </div>
      )}

      {/* Tentang */}
      <section className="mt-8">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <BookOpen className="h-4 w-4" aria-hidden /> Tentang
        </h2>
        <p className="text-sm leading-relaxed text-foreground sm:text-[15px]">{item.description}</p>
      </section>

      {/* Filosofi */}
      <section className="mt-6 rounded-2xl border border-brand-gold/40 bg-brand-gold/10 p-4 sm:p-5">
        <h2 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-foreground">
          <Lightbulb className="h-4 w-4 text-brand-orange" aria-hidden /> Filosofi &amp; Makna
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">{item.philosophy}</p>
      </section>

      {/* Bagian & makna */}
      {item.parts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            <Puzzle className="h-4 w-4" aria-hidden /> Bagian &amp; Makna ({item.parts.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {item.parts.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-3.5 shadow-sm">
                <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                    aria-hidden
                  />
                  {p.name}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">{p.function}</p>
                {p.philosophy && (
                  <p className="mt-1.5 text-xs italic leading-relaxed text-foreground/80">{p.philosophy}</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs italic text-muted-foreground">
            Tip: klik penanda berwarna pada model 3D untuk memfokuskan setiap bagian.
          </p>
        </section>
      )}

      {/* Sumber & atribusi */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <BookMarked className="h-4 w-4" aria-hidden /> Sumber &amp; Atribusi
        </h2>
        {item.sources.length > 0 ? (
          <ul className="space-y-2.5">
            {item.sources.map((s, i) => (
              <li key={s.id ?? i} className="rounded-xl border bg-card p-3.5 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {s.title} <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{s.title}</span>
                  )}
                  {s.license && (
                    <Badge variant="outline" className="border-brand-teal/40 px-1.5 py-0 text-[10px] text-primary">
                      {s.license}
                    </Badge>
                  )}
                </div>
                {(s.publisher || s.year) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[s.publisher, s.year].filter(Boolean).join(' • ')}
                  </p>
                )}
                {s.note && <p className="mt-1 text-xs italic text-muted-foreground">{s.note}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-amber-500/40 bg-amber-50 p-4 dark:bg-amber-950/30">
            <p className="flex items-start gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Sumber belum dilengkapi. Konten sedang menunggu peninjauan kurator.
            </p>
            {item.needsReview && (
              <Badge className="mt-2 border-amber-500/40 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" variant="outline">
                Sumber perlu dilengkapi
              </Badge>
            )}
          </div>
        )}
      </section>

      {/* Objek terkait */}
      <RelatedItems category={item.category} excludeId={item.id} />
    </motion.article>
  )
}

/** Objek lain dari kategori yang sama — disembunyikan bila tidak ada. */
function RelatedItems({ category, excludeId }: { category: string; excludeId: string }) {
  const { data: items, isLoading } = useArchiveItems({ category })
  const related = (items ?? []).filter((it) => it.id !== excludeId).slice(0, 4)

  if (isLoading) {
    return (
      <section className="mt-8">
        <Skeleton className="mb-3 h-5 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </section>
    )
  }
  if (related.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Objek Terkait</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((it) => (
          <ItemCard key={it.id} item={it} showProvince />
        ))}
      </div>
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-9 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
