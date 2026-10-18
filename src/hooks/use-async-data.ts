"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api-client";

/**
 * Hook pengambilan data dengan loading/error/retry seragam untuk semua view.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<{ data: T; meta?: unknown }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current();
      if (!mounted.current) return;
      setData(res.data);
      setMeta(res.meta as typeof meta);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof ApiError ? e.message : "Terjadi kesalahan tak terduga.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, deps);

  return { data, meta, loading, error, reload: () => load(true), refetch: load };
}
