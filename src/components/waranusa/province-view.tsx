'use client'

/**
 * ProvinceView — halaman detail provinsi:
 - Ringkasan, tab per kategori budaya, sejarah & tradisi, kontribusi komunitas
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useProvince } from '@/hooks/use-waradata'
import { ISLAND_MAP, CATEGORY_MAP, CATEGORIES } from '@/data/islands'
import { useWaranusa } from '@/store/waranusa'
import { ItemCard } from './item-card'
import { ArrowLeft, Landmark, History, ScrollText, Users, BadgeCheck, Hourglass, XCircle, MapPin, Quote } from 'lucide-react'
import { motion } from 'framer-motion'

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: typeof BadgeCheck }> = {
  APPROVED: { label: 'Disetujui', cls: 'border-emerald-600/40 bg-emerald-50 text-emerald-700', icon: BadgeCheck },
  PENDING: { label: 'Menunggu Tinjauan', cls: 'border-amber-500/40 bg-amber-50 text-amber-700', icon: Hourglass },
  REJECTED: { label: 'Ditolak', cls: 'border-red-500/40 bg-red-50 text-red-700', icon: XCircle },
}

export function ProvinceView() {
  const { provinceSlug, closeProvince } = useWaranusa()
  const { data: province, isLoading } = useProvince(provinceSlug)
  const [tab, setTab] = useState<string>('RUMAH_ADAT')

  if (!provinceSlug) return null

  if (isLoading || !province) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const islandMeta = ISLAND_MAP[province.island]
  const byCategory = (key: string) => province.items.filter((i) => i.category === key)
  const playableCount = province.items.filter((i) => i.playable).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6"
    >
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1.5 text-muted-foreground" onClick={closeProvince}>
        <ArrowLeft className="h-4 w-4" /> Kembali ke peta
      </Button>

      {/* Header provinsi */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-15"
          style={{ backgroundColor: islandMeta?.color }}
          aria-hidden
        />
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1.5" style={{ backgroundColor: islandMeta?.color }}>
            <Landmark className="h-3 w-3" /> {islandMeta?.label}
          </Badge>
          <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
            <MapPin className="h-3 w-3" /> Ibu kota: {province.capital}
          </Badge>
          {playableCount > 0 && (
            <Badge variant="outline" className="border-emerald-600/40 bg-emerald-50 text-emerald-700">
              {playableCount} instrumen virtual
            </Badge>
          )}
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {province.name}
        </h1>
        <p className="mt-1 font-display text-sm italic text-primary">“{province.motto}”</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {province.description}
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="wn-scroll mb-6 overflow-x-auto pb-1">
          <TabsList className="h-11 w-max bg-muted/70 p-1">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.key} value={c.key} className="gap-1.5 px-3.5 text-[13px] font-medium">
                {c.label}
                <span className="rounded-full bg-background px-1.5 text-[10px] font-bold text-muted-foreground">
                  {byCategory(c.key).length}
                </span>
              </TabsTrigger>
            ))}
            <TabsTrigger value="sejarah" className="gap-1.5 px-3.5 text-[13px] font-medium">
              <History className="h-3.5 w-3.5" /> Sejarah & Tradisi
            </TabsTrigger>
            <TabsTrigger value="komunitas" className="gap-1.5 px-3.5 text-[13px] font-medium">
              <Users className="h-3.5 w-3.5" /> Komunitas
              <span className="rounded-full bg-background px-1.5 text-[10px] font-bold text-muted-foreground">
                {province.contributions.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {CATEGORIES.map((c) => (
          <TabsContent key={c.key} value={c.key} className="mt-0 focus-visible:outline-none">
            <p className="mb-4 text-sm text-muted-foreground">{c.desc} di {province.name}:</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {byCategory(c.key).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>
        ))}

        <TabsContent value="sejarah" className="mt-0 focus-visible:outline-none">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="p-5">
                <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <History className="h-4 w-4" />
                  </span>
                  Sejarah
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{province.history}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="p-5">
                <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ScrollText className="h-4 w-4" />
                  </span>
                  Tradisi
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{province.traditions}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="komunitas" className="mt-0 focus-visible:outline-none">
          {province.contributions.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <Users className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">Belum ada kontribusi terpublikasi</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Jadilah yang pertama menambahkan informasi budaya {province.name} lewat halaman Kontribusi.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {province.contributions.map((c) => {
                const s = STATUS_BADGE[c.status]
                return (
                  <Card key={c.id} className="shadow-sm">
                    <CardContent className="p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={s.cls}>
                          <s.icon className="mr-1 h-3 w-3" /> {s.label}
                        </Badge>
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">
                          {CATEGORY_MAP[c.category]?.label ?? c.category}
                        </Badge>
                      </div>
                      <h4 className="font-display text-base font-bold text-foreground">{c.title}</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.content}</p>
                      <Separator2 />
                      <p className="text-xs text-muted-foreground">
                        Oleh <span className="font-semibold text-foreground">{c.contributorName}</span>
                        {c.sourceRef ? ` • Sumber: ${c.sourceRef}` : ''}
                      </p>
                      {c.reviewNote && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                          <Quote className="mt-0.5 h-3 w-3 shrink-0" /> {c.reviewNote}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function Separator2() {
  return <div className="my-3 border-t border-border/60" />
}
