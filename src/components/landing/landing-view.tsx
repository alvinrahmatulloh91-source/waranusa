"use client";

/**
 * WaraNusa — LandingView (beranda publik)
 * Karakter editorial: hero 2 kolom, strip statistik nyata, fitur sebagai daftar
 * (bukan grid kartu seragam), sorotan budaya, preview 3D & instrumen, banner kontribusi.
 */
import { useMemo, useState } from "react";
import { HashLink as Link } from "@/components/shared/hash-link";
import { motion, MotionConfig } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Box,
  Compass,
  ImageOff,
  MapPinned,
  Music4,
  Play,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { navigate } from "@/lib/router";
import { useAsyncData } from "@/hooks/use-async-data";
import { useSiteSettings } from "@/lib/settings-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/shared/states";
import { CultureCard } from "@/components/catalog/culture-card";
import ModelViewer from "@/components/three/model-viewer";
import { cn } from "@/lib/utils";

const DEFAULT_ABOUT =
  "WaraNusa adalah platform dokumentasi budaya Indonesia yang transparan sumbernya: jelajahi peta wilayah, katalog objek budaya, model 3D, dan instrumen musik virtual — semuanya terbuka untuk dipelajari dan dikontribusikan siapa pun.";

/** Gambar dengan fallback gradient bila aset belum tersedia */
function HeroImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center rounded-3xl bg-gradient-to-br from-brand-tropic/70 via-brand-gold/60 to-brand-sea/70",
          className
        )}
      >
        <ImageOff className="h-10 w-10 text-white/80" aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}

const FEATURES = [
  {
    icon: Compass,
    title: "Peta Wilayah Budaya",
    desc: "Temukan asal-usul setiap objek pada peta interaktif Nusantara — dari Sumatera hingga Papua — lengkap dengan ringkasan tiap wilayah.",
  },
  {
    icon: BookOpen,
    title: "Dokumentasi Bersumber",
    desc: "Setiap artikel dilengkapi rujukan: buku, jurnal, situs museum, atau arsip — dapat diverifikasi langsung dari halaman objek.",
  },
  {
    icon: Box,
    title: "Pengalaman 3D Interaktif",
    desc: "Putar dan perbesar model tiga dimensi rumah adat dan artefak, dengan titik-titik penjelasan pada bagian pentingnya.",
  },
  {
    icon: Music4,
    title: "Instrumen Musik Virtual",
    desc: "Mainkan replika digital instrumen nusantara langsung dari peramban — cara menyenangkan mengenal nada dan laras.",
  },
] as const;

export default function LandingView() {
  const settings = useSiteSettings((s) => s.settings);
  const aboutShort = settings.aboutShort || DEFAULT_ABOUT;
  const contributionNotice =
    settings.contributionNotice ||
    "Dokumentasi budaya adalah kerja bersama. Kirim tulisan, foto, atau rujukan Anda — tim kurator akan meninjau dan menerbitkannya dengan atribusi atas nama Anda.";

  // ---- Statistik nyata ----
  const stats = useAsyncData(async () => {
    const [itemsRes, regionsRes, categoriesRes] = await Promise.all([
      api.items.list({ pageSize: 1 }),
      api.regions.list(),
      api.categories.list(),
    ]);
    return {
      data: {
        published: itemsRes.meta?.total ?? 0,
        regions: regionsRes.data.length,
        categories: categoriesRes.data.length,
      },
    };
  }, []);

  // ---- Sorotan budaya (featured dulu) ----
  const highlights = useAsyncData(() => api.items.list({ pageSize: 3, sort: "newest" }), []);
  const highlightItems = useMemo(
    () =>
      highlights.data
        ? [...highlights.data].sort((a, b) => Number(b.featured) - Number(a.featured))
        : [],
    [highlights.data]
  );

  // ---- Preview 3D: rumah gadang ----
  const gadang = useAsyncData(() => api.items.detail("rumah-gadang"), []);

  return (
    <MotionConfig reducedMotion="user">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-brand-gradient-soft" aria-labelledby="hero-title">
        {/* pola titik halus di atas gradasi */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(#e1ebe8 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-24">
          {/* Kolom teks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-teal sm:text-xs">
              <span aria-hidden="true" className="h-px w-8 bg-brand-teal/60" />
              Platform Eksplorasi &amp; Pelestarian Budaya Indonesia
            </p>
            <h1
              id="hero-title"
              className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-ink sm:text-5xl lg:text-6xl"
            >
              Kenali Akar,{" "}
              <span className="bg-gradient-to-r from-brand-teal to-brand-sea bg-clip-text text-transparent">
                Jelajahi Budaya
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {aboutShort}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-brand-teal px-7 text-sm font-bold text-white hover:bg-brand-teal/90"
              >
                <Link href="#/jelajah">
                  Jelajahi Nusantara <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-brand-teal/40 px-7 text-sm font-bold text-brand-teal hover:bg-brand-teal/10 hover:text-brand-teal"
              >
                <Link href="#/katalog">Lihat Katalog</Link>
              </Button>
            </div>
          </motion.div>

          {/* Kolom visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative"
          >
            <HeroImage
              src="/uploads/seed/hero-archipelago.png"
              alt="Ilustrasi kepulangan budaya Nusantara — peta Indonesia dengan motif adat"
              className="aspect-[4/3] w-full rounded-3xl shadow-xl shadow-brand-sea/10 lg:aspect-[5/4]"
            />
            {/* Badge melayang */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-3 top-6 flex items-center gap-2 rounded-2xl border border-brand-line bg-card/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:-left-6"
            >
              <MapPinned className="h-5 w-5 text-brand-teal" aria-hidden="true" />
              <span className="text-xs font-bold text-brand-ink sm:text-sm">Peta Interaktif Nusantara</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              className="absolute -right-2 bottom-6 flex items-center gap-2 rounded-2xl border border-brand-line bg-card/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:-right-4"
            >
              <Box className="h-5 w-5 text-brand-orange" aria-hidden="true" />
              <span className="text-xs font-bold text-brand-ink sm:text-sm">Model 3D Budaya</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= STRIP STATISTIK ================= */}
      <section aria-label="Statistik platform" className="border-y border-brand-line bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : stats.error ? (
            <div className="col-span-2 py-4 text-sm text-muted-foreground md:col-span-4">
              Statistik sementara tidak dapat dimuat — konten di bawah tetap tersedia.
            </div>
          ) : (
            stats.data && (
              <>
                <Stat value={stats.data.published} label="Objek budaya terpublikasi" />
                <Stat value={stats.data.regions} label="Wilayah terpetakan" />
                <Stat value={stats.data.categories} label="Kategori budaya" />
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-brand-ink">100%</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-brand-tropic" aria-hidden="true" />
                    Konten bersumber rujukan
                  </p>
                </div>
              </>
            )
          )}
        </div>
      </section>

      {/* ================= FITUR UTAMA (daftar editorial) ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8" aria-labelledby="fitur">
        <SectionHeading
          eyebrow="Apa yang bisa Anda lakukan"
          title="Fitur Utama"
          description="Empat pintu masuk untuk mengenal budaya Indonesia — dirancang untuk pelajar, pendidik, dan siapa pun yang ingin mendokumentasikan akarnya."
        />
        <ul className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.li
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex gap-4 border-t border-brand-line pt-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
                <f.icon className="h-6 w-6 text-brand-teal" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-bold tracking-widest text-brand-gold">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-brand-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* ================= SOROTAN BUDAYA ================= */}
      <section className="bg-brand-soft/60" aria-labelledby="sorotan">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Pilihan kurator"
              title="Sorotan Budaya"
              description="Objek pilihan dari katalog kami — mulai dari arsitektur tradisional hingga seni pertunjukan."
            />
            <Link
              href="#/katalog"
              className="group flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-brand-teal hover:bg-brand-teal/10"
            >
              Lihat semua
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-brand-line bg-card">
                  <Skeleton className="aspect-[4/3] rounded-none" />
                  <div className="space-y-2.5 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            {highlights.error && (
              <p className="col-span-full rounded-2xl border border-dashed border-brand-line bg-card p-6 text-center text-sm text-muted-foreground">
                Sorotan budaya sementara tidak dapat dimuat.{" "}
                <Link href="#/katalog" className="font-bold text-brand-teal underline-offset-2 hover:underline">
                  Buka katalog langsung
                </Link>
              </p>
            )}
            {highlightItems.map((item) => (
              <CultureCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= PENGALAMAN 3D ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8" aria-labelledby="pengalaman3d">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Lebih dari sekadar bacaan"
              title="Pengalaman 3D Interaktif"
              description="Objek budaya didigitalisasi menjadi model tiga dimensi yang bisa diputar, didekati, dan dijelajahi — lengkap dengan titik penjelasan pada bagian penting."
            />
            <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                Seret untuk memutar, gulir untuk memperbesar
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                Klik titik emas untuk membaca info bagian bangunan
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                Tetap berfungsi ringan di perangkat seluler
              </li>
            </ul>
            <Button
              asChild
              className="mt-7 rounded-full bg-brand-sea px-6 font-bold text-white hover:bg-brand-sea/90"
            >
              <Link href="#/budaya/rumah-gadang">
                Buka halaman budaya <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="rounded-3xl border border-brand-line bg-card p-4 shadow-sm sm:p-6">
            {gadang.data ? (
              <ModelViewer item={gadang.data} height={380} autoRotate showHotspots />
            ) : gadang.error ? (
              <div className="flex h-[380px] flex-col items-center justify-center gap-3 rounded-2xl bg-brand-soft text-center">
                <Box className="h-8 w-8 text-brand-teal/60" aria-hidden="true" />
                <p className="max-w-xs text-sm text-muted-foreground">
                  Pratinjau 3D sementara tidak dapat dimuat. Halaman budaya tetap bisa dibuka.
                </p>
              </div>
            ) : (
              <Skeleton className="h-[380px] w-full rounded-2xl" />
            )}
          </div>
        </div>
      </section>

      {/* ================= INSTRUMEN VIRTUAL ================= */}
      <section className="bg-brand-soft/60" aria-labelledby="instrumen">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:gap-14 lg:px-8">
          {/* visual kiri */}
          <div className="relative order-2 lg:order-1">
            <HeroImage
              src="/uploads/seed/gamelan.png"
              alt="Set gamelan Jawa dengan saron dan gong perunggu"
              className="aspect-[4/3] w-full rounded-3xl shadow-lg shadow-brand-sea/10"
            />
            <button
              type="button"
              onClick={() => navigate("/instrumen")}
              aria-label="Coba instrumen musik virtual"
              className="group absolute inset-0 flex items-center justify-center rounded-3xl focus-visible:outline-2 focus-visible:outline-brand-teal"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform duration-300 group-hover:scale-110">
                <Play className="ml-1 h-7 w-7 text-brand-gold" aria-hidden="true" />
              </span>
            </button>
          </div>
          {/* teks kanan */}
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Belajar lewat suara"
              title="Instrumen Virtual"
              description="Coba gamelan saron langsung dari peramban — ketuk bilahnya, dengarkan laras pelog, dan pahami perannya dalam ansambel gamelan Jawa."
            />
            <Button
              asChild
              size="lg"
              className="mt-7 rounded-full bg-brand-gold px-7 font-bold text-brand-ink hover:bg-brand-gold/90"
            >
              <Link href="#/instrumen">
                <Music4 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Mainkan Saron
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ================= AJAKAN BERKONTRIBUSI ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8" aria-labelledby="kontribusi-cta">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-12 text-white sm:px-10 md:py-16"
        >
          {/* dekorasi lingkaran halus */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-white/10" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              Ajakan berkontribusi
            </p>
            <h2 id="kontribusi-cta" className="mt-3 text-2xl font-extrabold leading-snug sm:text-3xl md:text-4xl">
              Punya pengetahuan budaya? Rawat bersama kami.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
              {contributionNotice}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-white px-7 text-sm font-bold text-brand-sea hover:bg-white/90"
              >
                <Link href="#/kontribusi">
                  Kirim Dokumentasi <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <span className="text-xs text-white/70">
                Tinjauan kurator &middot; Atribusi atas nama Anda
              </span>
            </div>
          </div>
        </motion.div>
      </section>
    </MotionConfig>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-extrabold tracking-tight text-brand-ink">
        {new Intl.NumberFormat("id-ID").format(value)}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
