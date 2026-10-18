"use client";

import { HashLink as Link } from "@/components/shared/hash-link";
import { cn } from "@/lib/utils";

/**
 * Logo WaraNusa — komponen sementara yang mudah diganti aset final.
 * Bila file logo asli tersedia, cukup ganti bagian <svg> dengan <Image/>.
 * Ejaan: WARANUSA — tagline: Platform Eksplorasi & Pelestarian Budaya Indonesia.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id="wn-brand-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#48A66A" />
          <stop offset="0.35" stopColor="#F2B544" />
          <stop offset="0.7" stopColor="#F28C38" />
          <stop offset="1" stopColor="#1261A0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#fff" stroke="#E1EBE8" />
      <path
        fill="url(#wn-brand-g)"
        d="M32 6a26 26 0 0 1 0 52 20 20 0 0 1 0-40 14 14 0 0 1 0 28 8 8 0 0 1 0-16 3 3 0 0 1 0 6 2 2 0 0 0 0-4 7 7 0 0 0 0 14 11 11 0 0 0 0-22 17 17 0 0 0 0 34 23 23 0 0 0 0-46z"
      />
    </svg>
  );
}

export function BrandLogo({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <Link href="#/" className="flex items-center gap-2.5 group" aria-label="WaraNusa — beranda">
      <BrandMark className="h-9 w-9 transition-transform duration-300 group-hover:rotate-12" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-extrabold tracking-tight text-[1.15rem]",
              dark ? "text-white" : "text-brand-ink"
            )}
          >
            WARA<span className="text-brand-teal">NUSA</span>
          </span>
          <span className={cn("text-[0.55rem] font-semibold tracking-[0.14em] uppercase", dark ? "text-white/70" : "text-muted-foreground")}>
            Eksplorasi &amp; Pelestarian Budaya
          </span>
        </span>
      )}
    </Link>
  );
}
