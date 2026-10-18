"use client";

/**
 * WaraNusa — CultureCard
 * Kartu objek budaya dipakai di Katalog, Landing (Sorotan Budaya),
 * dan Konten Terkait pada halaman detail. Seluruh kartu adalah <a> ke #/budaya/[slug].
 */
import { useState } from "react";
import { Eye, ImageOff, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CulturalItem } from "@/lib/types";

export function CultureCard({ item, compact = false }: { item: CulturalItem; compact?: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const cover = item.coverMedia?.url ?? null;
  const showImage = cover !== null && !imgFailed;

  return (
    <a
      href={`#/budaya/${item.slug}`}
      aria-label={`Lihat detail ${item.title}`}
      className={cn(
        "group card-hover block overflow-hidden rounded-2xl border border-brand-line bg-card text-left",
        compact && "rounded-xl"
      )}
    >
      {/* Cover */}
      <div className={cn("relative aspect-[4/3] overflow-hidden bg-brand-soft", compact && "aspect-[16/10]")}>
        {showImage ? (
          <img
            src={cover}
            alt={`Gambar ${item.title}`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft via-[#eaf4f2] to-[#d9e9e6]"
            role="img"
            aria-label={`Sampul belum tersedia untuk ${item.title}`}
          >
            <ImageOff className="h-8 w-8 text-brand-teal/50" aria-hidden="true" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-brand-teal px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
          {item.category.name}
        </span>
      </div>

      {/* Isi */}
      <div className={cn("space-y-1.5 p-4", compact && "p-3.5")}>
        <h3
          className={cn(
            "font-bold leading-snug text-brand-ink transition-colors group-hover:text-brand-teal",
            compact ? "text-sm" : "text-base",
            "line-clamp-1"
          )}
        >
          {item.title}
        </h3>
        <p className={cn("text-sm text-muted-foreground line-clamp-2", compact && "text-xs line-clamp-1")}>
          {item.summary}
        </p>
        <div className={cn("flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground", compact && "pt-0.5")}>
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-orange" aria-hidden="true" />
            <span className="truncate">{item.region.name}</span>
          </span>
          <span
            className="flex shrink-0 items-center gap-1"
            aria-label={`Dilihat ${item.viewCount} kali`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {new Intl.NumberFormat("id-ID").format(item.viewCount)}
          </span>
        </div>
      </div>
    </a>
  );
}
