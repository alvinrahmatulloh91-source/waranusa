'use client'

/**
 * SiteFooter — footer sticky (mt-auto) berisi identitas brand, tautan
 * penting, dan keterangan transparansi aset.
 */
import Image from 'next/image'
import { Map, LibraryBig, Music4, Archive, HandHeart, ShieldCheck } from 'lucide-react'
import { ISLAND_GROUPS } from '@/data/islands'
import { useWaranusa, type MainView } from '@/store/waranusa'

const LINKS: { key: MainView; label: string; icon: typeof Map }[] = [
  { key: 'jelajah', label: 'Peta Interaktif', icon: Map },
  { key: 'katalog', label: 'Katalog Budaya', icon: LibraryBig },
  { key: 'instrumen', label: 'Instrumen Virtual', icon: Music4 },
  { key: 'arsip', label: 'Arsip Budaya', icon: Archive },
  { key: 'kontribusi', label: 'Kontribusi', icon: HandHeart },
]

export function SiteFooter() {
  const setView = useWaranusa((s) => s.setView)

  return (
    <footer className="mt-auto border-t border-border/70 bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        {/* Identitas */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/brand/emblem.png"
              alt="Logo WaraNusa"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-cover ring-1 ring-border"
            />
            <div className="leading-tight">
              <p className="font-display text-lg font-bold text-foreground">WaraNusa</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Platform Eksplorasi &amp; Pelestarian Budaya Indonesia
              </p>
            </div>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Menjelajah kebudayaan Nusantara lewat peta interaktif, visualisasi 3D, instrumen musik
            virtual, dan arsip yang disertai sumber — agar warisan budaya mudah dikenali dan dilestarikan.
          </p>
        </div>

        {/* Tautan */}
        <nav aria-label="Tautan footer">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Jelajahi</p>
          <ul className="space-y-2">
            {LINKS.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  onClick={() => {
                    setView(key)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Icon className="h-3.5 w-3.5 text-primary/70" /> {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Transparansi */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Transparansi Aset</p>
          <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li>
              Peta bersifat <span className="font-medium text-foreground/80">ilustratif</span>, bukan batas
              administratif resmi.
            </li>
            <li>
              Gambar pada katalog adalah <span className="font-medium text-foreground/80">ilustrasi generatif AI</span>{' '}
              untuk demonstrasi, bukan foto artefak asli.
            </li>
            <li>
              Suara instrumen adalah <span className="font-medium text-foreground/80">sintesis demonstrasi</span> (Web
              Audio), bukan rekaman autentik.
            </li>
            <li className="flex items-start gap-1.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Konten komunitas hanya tayang setelah melewati peninjauan pengelola.
            </li>
          </ul>
        </div>
      </div>

      {/* Bar bawah */}
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 sm:flex-row sm:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} WaraNusa • Dibangun untuk pendidikan budaya
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {ISLAND_GROUPS.map((g) => (
              <li key={g.key} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} aria-hidden />
                {g.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
