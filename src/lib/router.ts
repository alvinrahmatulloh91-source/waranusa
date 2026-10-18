/**
 * WaraNusa — Hash Router SPA
 * Route hanya lewat hash (#/...) agar seluruh aplikasi hidup di path "/".
 * Format: #/katalog?kategori=alat-musik&wilayah=ID-YO
 */
import { useCallback, useEffect, useState } from "react";

export interface Route {
  /** path tanpa leading slash, contoh: "budaya/rumah-gadang", "admin/cultural-items" */
  path: string;
  segments: string[];
  query: Record<string, string>;
  raw: string;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [pathPart, queryPart] = raw.split("?");
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const [k, v] of new URLSearchParams(queryPart).entries()) query[k] = v;
  }
  const segments = pathPart.split("/").filter(Boolean);
  return { path: pathPart, segments, query, raw };
}

export function navigate(to: string, opts?: { replace?: boolean }) {
  const target = to.startsWith("#") ? to : `#${to.startsWith("/") ? to : `/${to}`}`;
  if (opts?.replace) {
    window.history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target.slice(1);
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined" ? { path: "", segments: [], query: {}, raw: "" } : parseHash()
  );
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    // hashchange: perpindahan hash native (<a href="#/…">, location.hash).
    // popstate: navigasi back/forward browser dan patch pushState Next.js —
    // pushState TIDAK memicu hashchange, listener ganda menjaga robustness.
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);
  return route;
}

/** React hook: efek yang dijalankan sekali per perubahan path utama */
export function useRouteKey(route: Route): string {
  return route.path;
}

export function useNavigate() {
  return useCallback((to: string, opts?: { replace?: boolean }) => navigate(to, opts), []);
}

export function buildQuery(base: string, params: Record<string, string | undefined>): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (v) merged[k] = v;
  const s = new URLSearchParams(merged).toString();
  return s ? `#/${base}?${s}` : `#/${base}`;
}
