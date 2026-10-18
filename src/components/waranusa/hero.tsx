'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useStats } from '@/hooks/use-waradata'
import { useWaranusa } from '@/store/waranusa'
import { Map, Music4, Boxes, Volume2, Landmark, Sparkles } from 'lucide-react'

export function Hero() {
  const { data: stats } = useStats()
  const setView = useWaranusa((s) => s.setView)

  const scrollToExplorer = () => {
    document.getElementById('jelajah')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="wn-batik relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-accent/60 via-background to-background">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col items-start gap-5">
          <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 px-3 py-1 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Platform Eksplorasi &amp; Pelestarian Budaya Indonesia
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            Kenali Akar,{' '}
            <span className="relative inline-block text-primary">
              Jelajahi Budaya.
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden>
                <path d="M2 7 Q 50 1 100 6 T 198 4" fill="none" stroke="#F2B544" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Telusuri katalog budaya 18 provinsi, amati rumah adat dan alat musik dalam visual 3D 360°,
            mainkan instrumen virtual langsung dari peramban, dan baca arsip yang bersumbernya jelas.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2 bg-primary text-primary-foreground shadow-md hover:bg-primary/90" onClick={scrollToExplorer}>
              <Map className="h-4.5 w-4.5" /> Jelajahi Nusantara
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-accent" onClick={() => setView('instrumen')}>
              <Music4 className="h-4.5 w-4.5" /> Coba Instrumen Virtual
            </Button>
          </div>

          <dl className="mt-2 grid w-full max-w-lg grid-cols-3 gap-3">
            {[
              { label: 'Provinsi', value: stats?.provinces, icon: Landmark },
              { label: 'Item Budaya', value: stats?.items, icon: Boxes },
              { label: 'Bisa Dimainkan', value: stats?.playable, icon: Volume2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border bg-card/80 p-3 text-center shadow-sm backdrop-blur">
                <Icon className="mx-auto mb-1.5 h-4.5 w-4.5 text-primary" aria-hidden />
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl font-bold text-foreground">
                  {value === undefined ? <Skeleton className="mx-auto h-7 w-10" /> : value}
                </dd>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-tr from-primary/15 via-transparent to-accent/60" aria-hidden />
          <div className="wn-float relative overflow-hidden rounded-3xl border-4 border-card shadow-2xl">
            { }
            <img
              src="/images/hero-archipelago.png"
              alt="Kolase ilustrasi warisan budaya Indonesia: joglo, wayang, gamelan, dan kepulauan"
              className="h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
              width={1344}
              height={768}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4">
              <p className="text-sm font-medium text-white drop-shadow">
                &ldquo;Bhinneka Tunggal Ika — berbeda-beda tetapi tetap satu&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
