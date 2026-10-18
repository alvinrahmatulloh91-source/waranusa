"use client";

/**
 * WaraNusa — CultureDetailView (#/budaya/[slug])
 * Halaman objek budaya: header, model 3D, tab konten (deskripsi/sejarah/makna/sumber),
 * galeri dengan dialog, audio, dan konten terkait. 404 ditangani dengan EmptyState.
 */
import { useEffect, useState } from "react";
import {
  Archive,
  ArrowLeft,
  BookMarked,
  BookOpen,
  Box,
  CalendarClock,
  ExternalLink,
  Eye,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  ImageOff,
  Landmark,
  MapPin,
  MousePointerClick,
  Share2,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ApiError, api } from "@/lib/api-client";
import { isEmbedModel } from "@/lib/media-embed";
import { PROCEDURAL_MODELS, labelSourceType, type SourceType } from "@/lib/constants";
import type { CulturalItem, MediaAsset } from "@/lib/types";
import { useAsyncData } from "@/hooks/use-async-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, Loader } from "@/components/shared/states";
import { CultureCard } from "@/components/catalog/culture-card";
import ModelViewer from "@/components/three/model-viewer";
import { toast } from "sonner";

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(iso));

const SOURCE_ICON: Record<SourceType, LucideIcon> = {
  BOOK: BookMarked,
  JOURNAL: BookOpen,
  WEBSITE: Globe,
  MUSEUM: Landmark,
  ARCHIVE: Archive,
  OTHER: FolderOpen,
};

interface DetailState {
  loading: boolean;
  error: string | null;
  status: number;
  item: CulturalItem | null;
}

/** Hook kecil: butuh akses status HTTP (untuk 404) yang tidak diekspos useAsyncData */
function useItemDetail(slug: string) {
  const [state, setState] = useState<DetailState>({ loading: true, error: null, status: 0, item: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => setState((s) => ({ ...s, loading: true, error: null, item: null })), 0);
    api.items
      .detail(slug)
      .then(({ data }) => {
        if (alive) setState({ loading: false, error: null, status: 200, item: data });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setState({
          loading: false,
          error: e instanceof Error ? e.message : "Gagal memuat objek budaya.",
          status: e instanceof ApiError ? e.status : 0,
          item: null,
        });
      });
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [slug, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

export default function CultureDetailView({ route }: { route: { segments: string[] } }) {
  const slug = route.segments[1] ?? "";
  const detail = useItemDetail(slug);
  const { item } = detail;

  const [activeImage, setActiveImage] = useState<MediaAsset | null>(null);

  const hasModel =
    !!item && (!!item.modelMedia || (PROCEDURAL_MODELS as readonly string[]).includes(slug));

  const handleShare = async () => {
    if (!item) return;
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: item.title, text: item.summary, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Tautan disalin ke papan klip.");
    } catch (err) {
      // Pembatalan share oleh pengguna bukan error — abaikan diam-diam
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Tautan disalin ke papan klip.");
      } catch {
        toast.error("Tidak dapat menyalin tautan di peramban ini.");
      }
    }
  };

  // ================= LOADING / ERROR =================
  if (detail.loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Loader label="Memuat objek budaya…" />
      </div>
    );
  }

  if (detail.error || !item) {
    if (detail.status === 404) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-20">
          <EmptyState
            icon={ImageOff}
            title="Objek budaya tidak ditemukan"
            message={`Objek dengan alamat "${slug}" tidak tersedia atau belum diterbitkan.`}
            action={
              <Button asChild className="min-h-[44px] rounded-full bg-brand-teal font-bold text-white hover:bg-brand-teal/90">
                <a href="#/katalog">
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Kembali ke Katalog
                </a>
              </Button>
            }
          />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ErrorState title="Gagal memuat objek budaya" message={detail.error ?? undefined} onRetry={detail.reload} />
      </div>
    );
  }

  // ================= KONTEN =================
  const paragraphs = item.description.split(/\n{2,}/).filter(Boolean);

  return (
    <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="#/">Beranda</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="#/katalog">Katalog</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href={`#/katalog?kategori=${item.category.slug}`}>{item.category.name}</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-40 truncate sm:max-w-64">{item.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ============ HEADER ============ */}
      <header className="mt-6 grid gap-8 lg:grid-cols-5 lg:gap-12">
        <div className="lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-brand-teal font-semibold text-white hover:bg-brand-teal">
              {item.category.name}
            </Badge>
            <Badge variant="outline" className="gap-1 border-brand-line font-semibold text-brand-sea">
              <MapPin className="h-3.5 w-3.5 text-brand-orange" aria-hidden="true" />
              {item.region.name}
            </Badge>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-4xl">
            {item.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{item.summary}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-brand-teal" aria-hidden="true" />
              Dilihat {new Intl.NumberFormat("id-ID").format(item.viewCount)} kali
            </span>
            <span aria-hidden="true">&middot;</span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-brand-sea" aria-hidden="true" />
              Diperbarui {fmtDate(item.updatedAt)}
            </span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleShare}
              className="min-h-[44px] rounded-full border-brand-teal/40 font-bold text-brand-teal hover:bg-brand-teal/10 hover:text-brand-teal"
            >
              <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Bagikan
            </Button>
            <Button asChild variant="ghost" className="min-h-[44px] rounded-full font-bold text-muted-foreground">
              <a href="#/katalog">
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Kembali ke Katalog
              </a>
            </Button>
          </div>
        </div>

        {/* Cover */}
        <CoverImage item={item} />
      </header>

      {/* ============ MODEL 3D ============ */}
      <section className="mt-12" aria-labelledby="model-3d">
        {hasModel ? (
          <Card className="overflow-hidden rounded-3xl border-brand-line">
            <CardHeader className="pb-3">
              <CardTitle id="model-3d" className="flex items-center gap-2 text-lg text-brand-ink">
                <Box className="h-5 w-5 text-brand-teal" aria-hidden="true" />
                Model 3D Interaktif
              </CardTitle>
              {isEmbedModel(item.modelMedia) ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MousePointerClick className="h-3.5 w-3.5 text-brand-gold" aria-hidden="true" />
                  Gunakan kontrol viewer untuk memutar &amp; zoom &middot; Klik chip nama bagian untuk info
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MousePointerClick className="h-3.5 w-3.5 text-brand-gold" aria-hidden="true" />
                  Seret untuk memutar &middot; Scroll untuk zoom &middot; Klik titik emas untuk info bagian
                </p>
              )}
            </CardHeader>
            <CardContent>
              <ModelViewer item={item} height={460} showHotspots />
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-start gap-4 rounded-3xl border border-dashed border-brand-line bg-brand-soft/60 p-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card">
              <Box className="h-5 w-5 text-brand-teal/70" aria-hidden="true" />
            </span>
            <div>
              <h2 id="model-3d" className="font-bold text-brand-ink">
                Model 3D untuk objek ini belum tersedia
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Digitalisasi tiga dimensi dilakukan bertahap. Model akan ditambahkan begitu proses
                pemindaian dan pemodelan objek ini selesai.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ============ TAB KONTEN ============ */}
      <section className="mt-12" aria-label="Konten objek budaya">
        <Tabs defaultValue="deskripsi">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-brand-soft p-1.5">
            <TabsTrigger value="deskripsi" className="min-h-[40px] rounded-xl font-semibold">
              Deskripsi
            </TabsTrigger>
            <TabsTrigger value="sejarah" className="min-h-[40px] rounded-xl font-semibold">
              Sejarah &amp; Konteks
            </TabsTrigger>
            <TabsTrigger value="makna" className="min-h-[40px] rounded-xl font-semibold">
              Makna &amp; Fungsi
            </TabsTrigger>
            <TabsTrigger value="sumber" className="min-h-[40px] rounded-xl font-semibold">
              Sumber &amp; Atribusi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deskripsi" className="mt-4">
            <Card className="rounded-3xl border-brand-line">
              <CardContent className="space-y-4 p-6">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => (
                    <p key={i} className="leading-relaxed text-foreground/90">
                      {p}
                    </p>
                  ))
                ) : (
                  <TabEmpty text="Deskripsi belum tersedia." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sejarah" className="mt-4">
            <Card className="rounded-3xl border-brand-line">
              <CardContent className="p-6">
                {item.history ? (
                  <div className="space-y-4">
                    {item.history.split(/\n{2,}/).map((p, i) => (
                      <p key={i} className="leading-relaxed text-foreground/90">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : (
                  <TabEmpty text="Bagian sejarah & konteks belum tersedia untuk objek ini." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="makna" className="mt-4">
            <Card className="rounded-3xl border-brand-line">
              <CardContent className="p-6">
                {item.meaning ? (
                  <div className="space-y-4">
                    {item.meaning.split(/\n{2,}/).map((p, i) => (
                      <p key={i} className="leading-relaxed text-foreground/90">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : (
                  <TabEmpty text="Bagian makna & fungsi belum tersedia untuk objek ini." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sumber" className="mt-4">
            <Card className="rounded-3xl border-brand-line">
              <CardContent className="p-6">
                {item.sources && item.sources.length > 0 ? (
                  <ul className="space-y-4">
                    {item.sources.map((s) => {
                      const Icon = SOURCE_ICON[s.sourceType] ?? FolderOpen;
                      return (
                        <li key={s.id} className="rounded-2xl border border-brand-line p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                              <Icon className="h-5 w-5 text-brand-sea" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-brand-ink">{s.title}</h3>
                                <Badge variant="secondary" className="text-[11px] font-semibold">
                                  {labelSourceType(s.sourceType)}
                                </Badge>
                              </div>
                              {s.creator && (
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                  Penyusun: {s.creator}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {s.url && (
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 font-semibold text-brand-teal underline-offset-2 hover:underline"
                                  >
                                    Buka sumber <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                  </a>
                                )}
                                {s.accessDate && <span>Diakses {fmtDate(s.accessDate)}</span>}
                                {s.license && <span>Lisensi: {s.license}</span>}
                              </div>
                              {s.attribution && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  <strong className="font-semibold text-foreground/80">Atribusi:</strong>{" "}
                                  {s.attribution}
                                </p>
                              )}
                              {s.verificationNote && (
                                <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs text-muted-foreground">
                                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-tropic" aria-hidden="true" />
                                  {s.verificationNote}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <TabEmpty text="Sumber belum tercatat untuk objek ini. Lihat halaman Arsip Budaya untuk perpustakaan sumber menyeluruh." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* ============ AUDIO ============ */}
      <section className="mt-12" aria-labelledby="audio-judul">
        <h2 id="audio-judul" className="text-xl font-extrabold text-brand-ink">
          Rekaman Audio
        </h2>
        {item.audioMedia ? (
          <Card className="mt-4 rounded-3xl border-brand-line">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-bold text-brand-ink">
                  <Volume2 className="h-5 w-5 text-brand-teal" aria-hidden="true" />
                  {item.audioMedia.name}
                </p>
                {item.audioMedia.license && (
                  <Badge variant="secondary" className="text-[11px] font-semibold">
                    {item.audioMedia.license}
                  </Badge>
                )}
              </div>
              <audio controls preload="none" src={item.audioMedia.url} className="mt-4 w-full">
                Peramban Anda tidak mendukung pemutar audio.
              </audio>
              {item.audioMedia.attribution && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Atribusi: {item.audioMedia.attribution}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-brand-line bg-brand-soft/60 px-5 py-4 text-sm text-muted-foreground">
            Rekaman audio untuk objek ini belum tersedia.
          </p>
        )}
      </section>

      {/* ============ GALERI ============ */}
      {item.gallery && item.gallery.length > 0 && (
        <section className="mt-12" aria-labelledby="galeri-judul">
          <h2 id="galeri-judul" className="text-xl font-extrabold text-brand-ink">
            Galeri
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {item.gallery.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveImage(g)}
                aria-label={`Perbesar foto: ${g.name}`}
                className="group aspect-square overflow-hidden rounded-2xl border border-brand-line focus-visible:outline-2 focus-visible:outline-brand-teal"
              >
                <img
                  src={g.url}
                  alt={g.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============ KONTEN TERKAIT ============ */}
      <section className="mt-14" aria-labelledby="terkait-judul">
        <h2 id="terkait-judul" className="text-xl font-extrabold text-brand-ink">
          Konten Terkait
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Objek lain dalam kategori {item.category.name}.
        </p>
        <RelatedItems categorySlug={item.category.slug} currentId={item.id} />
      </section>

      {/* Dialog gambar besar */}
      <Dialog open={!!activeImage} onOpenChange={(open) => !open && setActiveImage(null)}>
        <DialogContent className="max-w-3xl p-3 sm:p-4">
          <DialogTitle className="sr-only">{activeImage?.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Tampilan perbesar foto galeri {activeImage?.name}
          </DialogDescription>
          {activeImage && (
            <figure className="space-y-2">
              <img
                src={activeImage.url}
                alt={activeImage.name}
                className="max-h-[75vh] w-full rounded-xl object-contain"
              />
              <figcaption className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                <span>{activeImage.name}</span>
                {activeImage.license && <span>Lisensi: {activeImage.license}</span>}
              </figcaption>
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </article>
  );
}

/** Cover besar di kanan header dengan fallback gradient */
function CoverImage({ item }: { item: CulturalItem }) {
  const [failed, setFailed] = useState(false);
  const cover = item.coverMedia?.url ?? null;
  return (
    <div className="lg:col-span-2">
      {cover && !failed ? (
        <img
          src={cover}
          alt={`Foto utama ${item.title}`}
          onError={() => setFailed(true)}
          className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lg shadow-brand-sea/10"
        />
      ) : (
        <div
          role="img"
          aria-label={`Sampul belum tersedia untuk ${item.title}`}
          className="flex aspect-[4/3] w-full items-center justify-center rounded-3xl bg-gradient-to-br from-brand-soft via-[#e8f2f0] to-[#d8e8e4] shadow-inner"
        >
          <ImageIcon className="h-12 w-12 text-brand-teal/50" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

function TabEmpty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-line bg-brand-soft/50 px-4 py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

/** Kartu terkait: kategori sama, maksimal 3, gulir horizontal */
function RelatedItems({ categorySlug, currentId }: { categorySlug: string; currentId: string }) {
  const related = useAsyncData(
    () => api.items.list({ categorySlug, pageSize: 4 }),
    [categorySlug]
  );
  const items = (related.data ?? []).filter((it) => it.id !== currentId).slice(0, 3);

  if (related.loading) {
    return (
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-64 shrink-0 animate-pulse overflow-hidden rounded-2xl border border-brand-line bg-card"
            aria-hidden="true"
          >
            <div className="aspect-[4/3] bg-muted" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (related.error) {
    return (
      <ErrorState
        title="Konten terkait gagal dimuat"
        message={related.error}
        onRetry={related.reload}
        className="mt-4"
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="Belum ada konten terkait"
        message="Objek lain dalam kategori ini akan tampil di sini."
        className="mt-4"
      />
    );
  }
  return (
    <div className="nice-scroll mt-4 flex gap-4 overflow-x-auto pb-3">
      {items.map((it) => (
        <div key={it.id} className="w-64 shrink-0 sm:w-72">
          <CultureCard item={it} compact />
        </div>
      ))}
    </div>
  );
}
