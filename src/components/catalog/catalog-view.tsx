"use client";

/**
 * WaraNusa — CatalogView (#/katalog)
 * Toolbar filter (search debounce 350ms, kategori, wilayah, urutan) dengan state
 * yang sepenuhnya disinkronkan ke query URL: ?q=&kategori=&wilayah=&sort=&page=
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterX, SearchX, SlidersHorizontal } from "lucide-react";
import type { Route } from "@/lib/router";
import { buildQuery, navigate } from "@/lib/router";
import { api } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, SectionHeading } from "@/components/shared/states";
import { CultureCard } from "@/components/catalog/culture-card";

const PAGE_SIZE = 12;
const SORTS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "popular", label: "Terpopuler" },
  { value: "title", label: "Judul A–Z" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

interface CatalogState {
  q: string;
  kategori: string;
  wilayah: string;
  sort: SortKey;
  page: number;
}

function readRoute(route: Route): CatalogState {
  const sort = SORTS.some((s) => s.value === route.query.sort)
    ? (route.query.sort as SortKey)
    : "newest";
  return {
    q: route.query.q ?? "",
    kategori: route.query.kategori ?? "",
    wilayah: route.query.wilayah ?? "",
    sort,
    page: Math.max(1, Number(route.query.page) || 1),
  };
}

export default function CatalogView({ route }: { route: Route }) {
  const state = readRoute(route);

  // ---- Filter data referensi ----
  const categoriesQ = useAsyncData(() => api.categories.list(), []);
  const regionsQ = useAsyncData(() => api.regions.list(), []);

  // ---- Daftar objek ----
  const itemsQ = useAsyncData(
    () =>
      api.items.list({
        search: state.q || undefined,
        categorySlug: state.kategori || undefined,
        regionCode: state.wilayah || undefined,
        sort: state.sort,
        page: state.page,
        pageSize: PAGE_SIZE,
      }),
    [state.q, state.kategori, state.wilayah, state.sort, state.page]
  );

  // ---- Pembaruan URL (replace agar riwayat tidak menumpuk) ----
  const updateQuery = useCallback(
    (patch: Partial<CatalogState>) => {
      const next = { ...state, ...patch };
      navigate(
        buildQuery("katalog", {
          q: next.q || undefined,
          kategori: next.kategori || undefined,
          wilayah: next.wilayah || undefined,
          sort: next.sort !== "newest" ? next.sort : undefined,
          page: next.page > 1 ? String(next.page) : undefined,
        }),
        { replace: true }
      );
    },
    [state]
  );

  // ---- Search input dengan debounce 350ms ----
  const [searchInput, setSearchInput] = useState(state.q);
  useEffect(() => {
    const t = setTimeout(() => setSearchInput(state.q), 0);
    return () => clearTimeout(t);
  }, [state.q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim() !== state.q) {
        updateQuery({ q: searchInput.trim() || "", page: 1 });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, state.q, updateQuery]);

  const hasActiveFilter =
    !!state.q || !!state.kategori || !!state.wilayah || state.sort !== "newest";

  const resetFilter = () => {
    setSearchInput("");
    navigate(buildQuery("katalog", {}), { replace: true });
  };

  // ---- Info rentang tampil ----
  const rangeInfo = useMemo(() => {
    const meta = itemsQ.meta;
    if (!meta || meta.total === 0) return null;
    const start = (meta.page - 1) * meta.pageSize + 1;
    const end = Math.min(meta.page * meta.pageSize, meta.total);
    return `Menampilkan ${start}–${end} dari ${meta.total} objek`;
  }, [itemsQ.meta]);

  const meta = itemsQ.meta;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? state.page;

  const goToPage = (p: number) => {
    updateQuery({ page: Math.min(Math.max(1, p), totalPages) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Nomor halaman ringkas dengan elipsis */
  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const push = (p: number | "ellipsis") => {
      if (!pages.includes(p)) pages.push(p);
    };
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return pages;
    }
    push(1);
    if (currentPage > 3) push("ellipsis");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) push(i);
    if (currentPage < totalPages - 2) push("ellipsis");
    push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <SectionHeading
        eyebrow="Katalog"
        title="Objek Budaya Nusantara"
        description="Telusuri dokumentasi budaya berdasarkan kata kunci, kategori, dan wilayah asal."
      />

      {/* ============ TOOLBAR ============ */}
      <div className="sticky top-16 z-30 mt-6 rounded-2xl border border-brand-line bg-card/95 p-4 shadow-sm backdrop-blur">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1 lg:col-start-1">
            <Label htmlFor="katalog-search" className="sr-only">
              Cari objek budaya
            </Label>
            <div className="relative">
              <SlidersHorizontal
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="katalog-search"
                type="search"
                placeholder="Cari judul, mis. batik…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="min-h-[44px] pl-9"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-kategori" className="sr-only">
              Filter kategori
            </Label>
            <Select
              value={state.kategori || "all"}
              onValueChange={(v) => updateQuery({ kategori: v === "all" ? "" : v, page: 1 })}
            >
              <SelectTrigger id="filter-kategori" className="min-h-[44px] w-full" aria-label="Filter kategori">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {(categoriesQ.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Wilayah */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-wilayah" className="sr-only">
              Filter wilayah
            </Label>
            <Select
              value={state.wilayah || "all"}
              onValueChange={(v) => updateQuery({ wilayah: v === "all" ? "" : v, page: 1 })}
            >
              <SelectTrigger id="filter-wilayah" className="min-h-[44px] w-full" aria-label="Filter wilayah">
                <SelectValue placeholder="Semua Wilayah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Wilayah</SelectItem>
                {(regionsQ.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.code}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Urutan */}
          <div className="space-y-1.5">
            <Label htmlFor="filter-sort" className="sr-only">
              Urutkan
            </Label>
            <Select value={state.sort} onValueChange={(v) => updateQuery({ sort: v as SortKey, page: 1 })}>
              <SelectTrigger id="filter-sort" className="min-h-[44px] w-full" aria-label="Urutkan hasil">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Info rentang + reset */}
      {(rangeInfo || hasActiveFilter) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p aria-live="polite">{rangeInfo ?? "Memfilter hasil…"}</p>
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilter}
              className="min-h-[44px] rounded-full text-brand-sea hover:bg-brand-sea/10 hover:text-brand-sea"
            >
              <FilterX className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Reset filter
            </Button>
          )}
        </div>
      )}

      {/* ============ GRID HASIL ============ */}
      <div className="mt-6" aria-live="polite">
        {itemsQ.loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-brand-line bg-card">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-2.5 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : itemsQ.error ? (
          <ErrorState title="Katalog tidak dapat dimuat" message={itemsQ.error} onRetry={itemsQ.reload} />
        ) : (itemsQ.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Tidak ada objek budaya yang cocok"
            message="Coba ubah kata kunci atau longgarkan filter kategori/wilayah."
            action={
              hasActiveFilter && (
                <Button onClick={resetFilter} className="min-h-[44px] rounded-full bg-brand-teal font-bold text-white hover:bg-brand-teal/90">
                  <FilterX className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Reset semua filter
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {itemsQ.data!.map((item) => (
              <CultureCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* ============ PAGINATION ============ */}
      {!itemsQ.loading && !itemsQ.error && totalPages > 1 && (
        <div className="mt-10 space-y-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-label="Halaman sebelumnya"
                  className={cnPaginationDisabled(currentPage <= 1)}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) goToPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {pageNumbers.map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === currentPage}
                      aria-label={`Ke halaman ${p}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (p !== currentPage) goToPage(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-label="Halaman berikutnya"
                  className={cnPaginationDisabled(currentPage >= totalPages)}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) goToPage(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <p className="text-center text-xs text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </p>
        </div>
      )}
    </div>
  );
}

function cnPaginationDisabled(disabled: boolean): string {
  return disabled ? "pointer-events-none opacity-40" : "";
}
