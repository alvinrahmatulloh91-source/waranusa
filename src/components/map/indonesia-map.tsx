"use client";

/**
 * WaraNusa — Peta sebaran wilayah budaya (Leaflet / react-leaflet v5).
 *
 * - CLIENT-ONLY: react-leaflet di-import secara DINAMIS di dalam useEffect
 *   (setelah mount) sehingga evaluasi modul leaflet tidak pernah terjadi saat
 *   SSR/prerender — aman dari error `window is not defined`.
 * - ScrollWheelZoom nonaktif secara default dan baru diaktifkan setelah peta
 *   diklik (agar scroll halaman tidak terjebak di dalam peta), lalu nonaktif
 *   lagi saat kursor keluar dari peta.
 * - Penanda: CircleMarker (titik koordinat wilayah, BUKAN batas administratif).
 * - CATATAN TIPE: @types/leaflet belum terpasang di lingkungan ini sehingga
 *   tipe bawaan react-leaflet (yang mengekstend tipe `leaflet`) terdegradasi.
 *   Prop komponen dideklarasikan lokal & presisi di bawah (tanpa `any`) agar
 *   file ini tetap type-safe baik dengan maupun tanpa @types/leaflet.
 */

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

import type { Region } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------- Tipe lokal minimal untuk react-leaflet (tanpa `any`) ----------

interface LeafletMapLike {
  fitBounds(bounds: [[number, number], [number, number]]): void;
  scrollWheelZoom: { enable(): void; disable(): void };
  on(type: string, fn: () => void): void;
  off(type: string, fn: () => void): void;
  remove(): void;
}

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  zoomControl?: boolean;
  attributionControl?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

interface TileLayerProps {
  url: string;
  attribution?: string;
}

interface CircleMarkerProps {
  center: [number, number];
  radius?: number;
  pathOptions?: {
    color?: string;
    weight?: number;
    fillColor?: string;
    fillOpacity?: number;
  };
  eventHandlers?: {
    click?: (event?: unknown) => void;
  };
  children?: React.ReactNode;
}

interface TooltipProps {
  direction?: "top" | "bottom" | "left" | "right" | "center" | "auto";
  permanent?: boolean;
  offset?: [number, number];
  className?: string;
  children?: React.ReactNode;
}

type ReactLeafletModule = typeof import("react-leaflet");

interface LeafletComponents {
  MapContainer: React.ForwardRefExoticComponent<
    MapContainerProps & React.RefAttributes<LeafletMapLike>
  >;
  TileLayer: React.FC<TileLayerProps>;
  CircleMarker: React.FC<CircleMarkerProps>;
  Tooltip: React.FC<TooltipProps>;
}

/** Ambil komponen terkanal (channel) react-leaflet dengan tipe lokal presisi. */
function pickComponents(mod: ReactLeafletModule): LeafletComponents {
  return {
    MapContainer: mod.MapContainer as unknown as LeafletComponents["MapContainer"],
    TileLayer: mod.TileLayer as unknown as LeafletComponents["TileLayer"],
    CircleMarker: mod.CircleMarker as unknown as LeafletComponents["CircleMarker"],
    Tooltip: mod.Tooltip as unknown as LeafletComponents["Tooltip"],
  };
}

// ---------- Konstanta peta ----------

/** Bounds kasar kepulauan Indonesia. */
const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [-11, 95],
  [6, 141],
];

// Tile OpenStreetMap standar (gratis, tanpa API key). CARTO light_all kini
// menuntut API key sehingga tidak dipakai.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const BRAND_TEAL = "#159D9A";
const BRAND_GOLD = "#F2B544";

export interface IndonesiaMapProps {
  regions: Region[];
  selectedId?: string | null;
  onSelect: (r: Region) => void;
  className?: string;
}

export default function IndonesiaMap({
  regions,
  selectedId,
  onSelect,
  className,
}: IndonesiaMapProps) {
  const [mounted, setMounted] = React.useState(false);
  const [rl, setRl] = React.useState<ReactLeafletModule | null>(null);
  const [map, setMap] = React.useState<LeafletMapLike | null>(null);

  // Gate mount + import react-leaflet hanya di sisi klien.
  React.useEffect(() => {
    let alive = true;
    setMounted(true);
    import("react-leaflet")
      .then((mod) => {
        if (alive) setRl(mod);
      })
      .catch(() => {
        // Gagal memuat react-leaflet — skeleton tetap tampil.
      });
    return () => {
      alive = false;
    };
  }, []);

  // FitBounds Indonesia sekali saat peta siap + kebijakan scroll-wheel zoom.
  React.useEffect(() => {
    if (!map) return;
    map.fitBounds(INDONESIA_BOUNDS);
    const enableScroll = () => {
      map.scrollWheelZoom.enable();
    };
    const disableScroll = () => {
      map.scrollWheelZoom.disable();
    };
    map.on("click", enableScroll);
    map.on("mouseout", disableScroll);
    return () => {
      map.off("click", enableScroll);
      map.off("mouseout", disableScroll);
    };
  }, [map]);

  const ready = mounted && rl !== null;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative z-0 h-[320px] w-full overflow-hidden rounded-xl border border-brand-line bg-brand-soft sm:h-[420px] lg:h-[520px]">
        {!ready ? (
          /* Skeleton sebelum peta siap (hindari SSR error leaflet) */
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-brand-soft">
            <span className="h-10 w-10 animate-pulse rounded-full bg-brand-teal/25" aria-hidden />
            <p className="text-xs text-muted-foreground">Memuat peta…</p>
          </div>
        ) : regions.length === 0 ? (
          /* Empty state di dalam area peta */
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
            <MapPin className="h-8 w-8 text-brand-teal/60" aria-hidden />
            <p className="text-sm font-semibold text-brand-ink">Belum ada wilayah</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Data wilayah budaya belum tersedia untuk ditampilkan di peta.
            </p>
          </div>
        ) : (
          (() => {
            const { MapContainer, TileLayer, CircleMarker, Tooltip } = pickComponents(rl);
            return (
              <MapContainer
                center={[-2.5, 118]}
                zoom={5}
                scrollWheelZoom={false}
                zoomControl
                attributionControl
                className="h-full w-full"
                style={{ width: "100%", height: "100%" }}
                ref={(instance) => {
                  setMap(instance);
                }}
              >
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                {regions.map((region) => {
                  const isSelected = region.id === selectedId;
                  return (
                    <CircleMarker
                      key={region.id}
                      center={[region.lat, region.lng]}
                      radius={isSelected ? 12 : 9}
                      pathOptions={{
                        color: "#FFFFFF",
                        weight: 3,
                        fillColor: isSelected ? BRAND_GOLD : BRAND_TEAL,
                        fillOpacity: 0.95,
                      }}
                      eventHandlers={{
                        click: () => onSelect(region),
                      }}
                    >
                      <Tooltip
                        direction="top"
                        permanent
                        offset={[0, -6]}
                        className="region-tooltip font-semibold"
                      >
                        {region.name}
                      </Tooltip>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            );
          })()
        )}
      </div>

      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Sumber peta dasar: OpenStreetMap &amp; CARTO — penanda menunjukkan titik koordinat wilayah
        (bukan batas administratif).
      </p>
    </div>
  );
}
