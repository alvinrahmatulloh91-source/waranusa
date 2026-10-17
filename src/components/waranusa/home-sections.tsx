'use client'

/**
 * HomeSections — section pendukung halaman utama (view 'jelajah'):
 * - FeaturedCulture : sorotan budaya pilihan (prioritas 3D / playable)
 * - ExperienceSection: panel pengalaman 3D & instrumen virtual
 * - ContributeSection: ajakan kontribusi dokumentasi budaya
 */
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useArchiveItems } from '@/hooks/use-waradata'
import { useWaranusa } from '@/store/waranusa'
import { ItemCard } from './item-card'
import {
  ArrowRight,
  HandHeart,
  Map,
  MousePointerClick,
  Music4,
  Rotate3d,
} from 'lucide-react'
import { motion } from 'framer-motion'

/** Sorotan 4 objek budaya — item dengan model 3D / playable diprioritaskan. */
export function FeaturedCulture() {
  const { data: items, isLoading } = useArchiveItems({})
  const setView = useWaranusa((s) => s.setView)

  const featured = useMemo(() => {
    const list = items ?? []
    return [...list]
      .sort(
        (a, b) =>
          Number(!!(b.model3d || b.playable)) - Number(!!(a.model3d || a.playable)),
      )
      .slice(0, 4)
  }, [items])

  if (!isLoading && featured.length === 0) return null

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="outline" className="mb-2 border-primary/30 bg-primary/5 text-primary">
            Pilihan Kurasi
          </Badge>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Sorotan Budaya Pilihan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Objek budaya dengan model 3D interaktif dan instrumen yang bisa dimainkan.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-1.5 border-primary/40 text-primary hover:bg-accent"
          onClick={() => setView('katalog')}
        >
          Lihat Semua di Katalog <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((item) => (
            <ItemCard key={item.id} item={item} showProvince />
          ))}
        </div>
      )}
    </section>
  )
}

/** Dua panel: penjelasan pengalaman 3D & instrumen virtual + visual alat musik. */
export function ExperienceSection() {
  const setView = useWaranusa((s) => s.setView)

  const points = [
    {
      icon: Rotate3d,
      title: 'Putar 360 derajat',
      desc: 'Amati setiap sudut rumah adat dan alat musik langsung dari peramban.',
    },
    {
      icon: MousePointerClick,
      title: 'Penanda setiap bagian',
      desc: 'Pelajari fungsi tiap bagian lewat penanda interaktif pada model 3D.',
    },
    {
      icon: Music4,
      title: 'Mainkan nadanya',
      desc: 'Bunyikan pad nada instrumen dan dengarkan melodi demo sintetis.',
    },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <Badge variant="outline" className="mb-2 border-brand-gold/50 bg-brand-gold/10 text-stone-700 dark:text-brand-gold">
            Pengalaman Interaktif
          </Badge>
          <h2 className="font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            Pengalaman 3D &amp; Instrumen Virtual
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Lebih dari sekadar membaca — dekati warisan budaya lewat model tiga dimensi dan suara.
          </p>
          <ul className="mt-5 space-y-3">
            {points.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3 rounded-xl border bg-card p-3.5 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-bold text-foreground">{title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="gap-2 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              onClick={() => setView('instrumen')}
            >
              <Music4 className="h-4 w-4" aria-hidden /> Buka Instrumen Virtual
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-primary/40 text-primary hover:bg-accent"
              onClick={() => setView('katalog')}
            >
              <Map className="h-4 w-4" aria-hidden /> Jelajahi Katalog
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-brand-gold/25 via-transparent to-primary/15" aria-hidden />
          <div className="relative overflow-hidden rounded-3xl border-4 border-card shadow-lg">
            <img
              src="/images/alat-musik.png"
              alt="Kolase ilustrasi alat musik tradisional Indonesia: gamelan, angklung, dan sasando"
              className="h-64 w-full object-cover sm:h-80"
              width={1152}
              height={864}
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4">
              <p className="text-sm font-medium text-white drop-shadow">
                Gamelan, angklung, sasando — bunyikan langsung dari peramban Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Panel ajakan kontribusi dengan gradasi teal → biru laut. */
export function ContributeSection() {
  const setView = useWaranusa((s) => s.setView)

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-brand-ocean p-6 shadow-md sm:p-10"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-14 left-1/4 h-40 w-40 rounded-full bg-brand-gold/20" aria-hidden />
        <div className="relative max-w-2xl">
          <Badge variant="outline" className="mb-3 border-white/40 bg-white/10 text-white">
            <HandHeart className="h-3.5 w-3.5" aria-hidden /> Untuk Komunitas
          </Badge>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Kontribusikan Dokumentasi Budaya
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">
            Bagikan pengetahuan budaya daerah Anda — kisah, filosofi, atau sumber rujukan yang belum terdokumentasi.
            Setiap kiriman ditinjau kurator sebelum dipublikasikan agar arsip tetap kredibel dan bermanfaat.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              className="gap-2 bg-white text-[#0f5f5d] shadow-sm hover:bg-white/90"
              onClick={() => setView('kontribusi')}
            >
              Mulai Berkontribusi <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <p className="text-xs text-white/70">Gratis — cukup buat akun untuk mulai mengirim.</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
