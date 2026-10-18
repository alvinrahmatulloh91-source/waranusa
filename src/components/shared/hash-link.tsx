"use client";

import * as React from "react";

type HashLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

/**
 * WaraNusa — HashLink
 *
 * Link khusus untuk rute hash SPA (#/…).
 *
 * Mengapa BUKAN next/link?
 * Router App Router mencegat klik <Link href="#/…"> lalu berpindah via
 * history.pushState — API itu TIDAK memicu event "hashchange", sehingga
 * useRoute() tidak pernah tahu rute berubah dan tampilan SPA tidak berganti
 * (gejala: "navbar tidak berfungsi").
 *
 * <a> asli mengubah window.location.hash → event hashchange terpicu →
 * router hash memperbarui view. Kompatibel dengan Radix Slot (Button asChild).
 */
export const HashLink = React.forwardRef<HTMLAnchorElement, HashLinkProps>(
  function HashLink({ href, onClick, ...props }, ref) {
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        // Klik ulang ke hash yang sama tidak memicu hashchange —
        // picu pembaruan manual agar klik tetap merespons (scroll ke atas).
        const target = href.startsWith("#") ? href.slice(1) : href;
        if (window.location.hash.replace(/^#/, "") === target) {
          e.preventDefault();
          window.dispatchEvent(new HashChangeEvent("hashchange"));
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
      },
      [href, onClick]
    );
    return <a ref={ref} href={href} onClick={handleClick} {...props} />;
  }
);
