"use client";

/**
 * WaraNusa — ArchiveView (#/arsip)
 * Arsip Budaya & Sumber: transparansi rujukan seluruh platform.
 * Search debounce + filter tipe sumber + tautan ke objek budaya terkait.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BookMarked,
  BookOpen,
  CalendarDays,
  ExternalLink,
  FolderOpen,
  Globe,
  Landmark,
  Library,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Source } from "@/lib/types";
import { SOURCE_TYPES, labelSourceType, type SourceType } from "@/lib/constants";
import { useAsyncData } from "@/hooks/use-async-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, SectionHeading } from "@/components/shared/states";

/** Serializer publik /api/sources menambahkan info item terkait (opsional) */
type ArchiveSource = Source & { itemTitle?: string | null; itemSlug?: string | null };

const TYPE_ICON: Record<SourceType, LucideIcon> = {
  BOOK: BookMarked,
  JOURNAL: BookOpen,
  WEBSITE: Globe,
  MUSEUM: Landmark,
  ARCHIVE: Archive,
  OTHER: FolderOpen,
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(iso));

export default function ArchiveView() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Debounce pencarian 350ms; reset ke halaman 1
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const sourcesQ = useAsyncData(
    () =>
      api.sources.list({
        search: search || undefined,
        type: type === "all" ? undefined : type,
      }),
    [search, type]
  );

  // Pagination sederhana di sisi klien bila meta tidak disertakan backend
  const CLIENT_PAGE_SIZE = 10;
  const allSources = (sourcesQ.data ?? []) as ArchiveSource[];
  const meta = sourcesQ.meta;
  const usingServerMeta = !!meta && meta.totalPages > 1;

  const pagedSources = useMemo(() => {
    if (usingServerMeta) return allSources;
    const start = (page - 1) * CLIENT_PAGE_SIZE;
    return allSources.slice(start, start + CLIENT_PAGE_SIZE);
  }, [allSources, page, usingServerMeta]);

  const totalPages = usingServerMeta ? meta!.totalPages : Math.max(1, Math.ceil(allSources.length / CLIENT_PAGE_SIZE));

  const resetFilter = () => {
    setSearchInput("");
    setType("all");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <SectionHeading
        eyebrow="Transparansi"
        title="Arsip Budaya & Sumber"
        description="Seluruh objek budaya di WaraNusa bersumber dari rujukan yang dapat diverifikasi — buku, jurnal, situs museum, hingga arsip digital."
      />

      {/* ============ TOOLBAR ============ */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="arsip-search" className="sr-only">
            Cari sumber
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="arsip-search"
              type="search"
              placeholder="Cari judul sumber, penyusun…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-h-[44px] pl-9"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="arsip-type" className="sr-only">
            Filter tipe sumber
          </Label>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          >
            <SelectTrigger id="arsip-type" className="min-h-[44px] w-full" aria-label="Filter tipe sumber">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {SOURCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {labelSourceType(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(searchInput || type !== "all") && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={resetFilter}
              className="min-h-[44px] rounded-full font-bold text-brand-sea hover:bg-brand-sea/10 hover:text-brand-sea"
            >
              Reset filter
            </Button>
          </div>
        )}
      </div>

      {/* ============ DAFTAR SUMBER ============ */}
      <div className="mt-6" aria-live="polite">
        {sourcesQ.loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" aria-hidden="true" />
            ))}
          </div>
        ) : sourcesQ.error ? (
          <ErrorState title="Arsip tidak dapat dimuat" message={sourcesQ.error} onRetry={sourcesQ.reload} />
        ) : pagedSources.length === 0 ? (
          <EmptyState
            icon={Library}
            title="Tidak ada sumber yang cocok"
            message="Coba kata kunci lain atau pilih tipe sumber berbeda."
            action={
              (searchInput || type !== "all") && (
                <Button onClick={resetFilter} className="min-h-[44px] rounded-full bg-brand-teal font-bold text-white hover:bg-brand-teal/90">
                  Reset filter
                </Button>
              )
            }
          />
        ) : (
          <ul className="space-y-3">
            {pagedSources.map((s) => {
              const Icon = TYPE_ICON[s.sourceType] ?? FolderOpen;
              return (
                <li
                  key={s.id}
                  className="card-hover rounded-2xl border border-brand-line bg-card p-4 sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
                      <Icon className="h-5 w-5 text-brand-sea" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-brand-ink">{s.title}</h2>
                        <Badge variant="secondary" className="text-[11px] font-semibold">
                          {labelSourceType(s.sourceType)}
                        </Badge>
                      </div>
                      {s.creator && (
                        <p className="mt-0.5 text-sm text-muted-foreground">Penyusun: {s.creator}</p>
                      )}

                      {/* Objek budaya terkait */}
                      {s.itemSlug && (
                        <a
                          href={`#/budaya/${s.itemSlug}`}
                          className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-teal transition-colors hover:bg-brand-teal hover:text-white"
                        >
                          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            Objek terkait: {s.itemTitle ?? s.itemSlug}
                          </span>
                        </a>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-brand-teal underline-offset-2 hover:underline"
                          >
                            Buka sumber <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        )}
                        {s.accessDate && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" aria-hidden="true" />
                            Diakses {fmtDate(s.accessDate)}
                          </span>
                        )}
                        {s.license && <span>Lisensi: {s.license}</span>}
                      </div>

                      {s.verificationNote && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs text-muted-foreground">
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-tropic" aria-hidden="true" />
                          <span>
                            <strong className="font-semibold text-foreground/80">Catatan verifikasi:</strong>{" "}
                            {s.verificationNote}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ============ PAGINATION SEDERHANA ============ */}
      {!sourcesQ.loading && !sourcesQ.error && totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Navigasi halaman arsip">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="min-h-[44px] rounded-full"
            aria-label="Halaman sebelumnya"
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="min-h-[44px] rounded-full"
            aria-label="Halaman berikutnya"
          >
            Berikutnya
          </Button>
        </nav>
      )}
    </div>
  );
}
