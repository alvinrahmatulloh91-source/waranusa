"use client";

/**
 * WaraNusa — ExploreView (#/jelajah)
 * Peta interaktif wilayah budaya (kiri) + panel detail wilayah (kanan).
 * Wilayah terpilih disinkronkan dengan query URL ?region=CODE.
 */
import { useMemo } from "react";
import { Building2, MapPin, MoveRight, Pin } from "lucide-react";
import type { Route } from "@/lib/router";
import { buildQuery, navigate } from "@/lib/router";
import { api } from "@/lib/api-client";
import type { Region } from "@/lib/types";
import { useAsyncData } from "@/hooks/use-async-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, SectionHeading } from "@/components/shared/states";
import IndonesiaMap from "@/components/map/indonesia-map";
import { cn } from "@/lib/utils";

export default function ExploreView({ route }: { route: Route }) {
  const regionsQ = useAsyncData(() => api.regions.list(), []);
  const regions = regionsQ.data ?? [];

  // Wilayah terpilih diturunkan dari URL (?region=CODE) agar dapat dibagikan
  const selected = useMemo(
    () => regions.find((r) => r.code === route.query.region) ?? null,
    [regions, route.query.region]
  );

  const selectRegion = (r: Region) => {
    navigate(buildQuery("jelajah", { region: r.code }), { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <SectionHeading
        eyebrow="Peta Interaktif"
        title="Jelajahi Wilayah Budaya"
        description="Klik penanda pada peta untuk mengenal wilayah dan objek budayanya."
      />
      <p className="mt-3 flex max-w-2xl items-start gap-2 text-xs text-muted-foreground">
        <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-teal" aria-hidden="true" />
        Peta berbasis Leaflet + OpenStreetMap. Penanda menunjukkan titik koordinat wilayah,
        bukan batas administratif.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* ============ PETA ============ */}
        <div className="lg:col-span-8">
          {regionsQ.loading ? (
            <Skeleton className="h-[320px] w-full rounded-3xl lg:h-[560px]" aria-hidden="true" />
          ) : regionsQ.error ? (
            <ErrorState
              title="Peta tidak dapat dimuat"
              message={regionsQ.error}
              onRetry={regionsQ.reload}
              className="lg:h-[560px]"
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-brand-line shadow-sm">
              <IndonesiaMap
                regions={regions}
                selectedId={selected?.id ?? null}
                onSelect={selectRegion}
                className="h-[320px] w-full lg:h-[560px]"
              />
            </div>
          )}

          {/* Escape hatch mobile: chips wilayah selalu terlihat di bawah peta */}
          {!regionsQ.loading && !regionsQ.error && (
            <div className="mt-4 lg:hidden" aria-label="Daftar wilayah (versi sentuh)">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Atau pilih wilayah:
              </p>
              <div className="flex flex-wrap gap-2">
                {regions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRegion(r)}
                    aria-pressed={selected?.id === r.id}
                    className={cn(
                      "min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                      selected?.id === r.id
                        ? "border-brand-teal bg-brand-teal text-white"
                        : "border-brand-line bg-card text-foreground/80 hover:border-brand-teal/50 hover:text-brand-teal"
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============ PANEL DETAIL ============ */}
        <aside className="lg:col-span-4" aria-label="Detail wilayah">
          {selected ? (
            <Card className="overflow-hidden rounded-3xl border-brand-line">
              <div className="bg-brand-gradient px-6 py-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                  {selected.islandGroup.replaceAll("_", " ")}
                </p>
                <h2 className="mt-1 text-xl font-extrabold">{selected.name}</h2>
                {selected.capital && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/85">
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Ibu kota: {selected.capital}
                  </p>
                )}
              </div>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm font-semibold text-brand-ink">{selected.summary}</p>
                {selected.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selected.description}
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-brand-orange" aria-hidden="true" />
                  <span>
                    <strong className="font-bold text-brand-ink">
                      {selected.itemCount ?? 0}
                    </strong>{" "}
                    objek budaya terdokumentasi
                  </span>
                </p>
                <Button
                  asChild
                  className="w-full min-h-[44px] rounded-full bg-brand-teal font-bold text-white hover:bg-brand-teal/90"
                >
                  <a href={buildQuery("katalog", { region: selected.code })}>
                    Lihat objek budaya wilayah ini
                    <MoveRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={MapPin}
              title="Pilih penanda wilayah pada peta"
              message="Detail wilayah, ringkasan, dan jumlah objek budaya akan tampil di sini."
            />
          )}

          {/* Chips wilayah selalu tersedia di panel kanan (desktop) */}
          {!regionsQ.loading && !regionsQ.error && (
            <div className="mt-5 hidden lg:block">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Semua wilayah
              </p>
              <div className="flex flex-wrap gap-2">
                {regions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectRegion(r)}
                    aria-pressed={selected?.id === r.id}
                    className={cn(
                      "min-h-[36px] rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      selected?.id === r.id
                        ? "border-brand-teal bg-brand-teal text-white"
                        : "border-brand-line bg-card text-foreground/75 hover:border-brand-teal/50 hover:text-brand-teal"
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
