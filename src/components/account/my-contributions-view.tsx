"use client";

/**
 * WaraNusa — MyContributionsView (#/kontribusi-saya)
 * Daftar kontribusi milik pengguna yang sedang masuk. 401 → dialihkan ke #/masuk.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { HandHeart, History, LogIn, Send, UserCircle2 } from "lucide-react";
import type { Route } from "@/lib/router";
import { navigate } from "@/lib/router";
import { ApiError, api, contributionStatusColor } from "@/lib/api-client";
import type { Contribution } from "@/lib/types";
import { labelContributionStatus } from "@/lib/constants";
import { useAuth } from "@/lib/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, SectionHeading } from "@/components/shared/states";
import { cn } from "@/lib/utils";

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(iso));

export default function MyContributionsView(_props: { route: Route }) {
  const user = useAuth((s) => s.user);

  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api.contributions
      .my()
      .then(({ data }) => {
        if (!alive) return;
        setItems(data);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) {
          navigate("/masuk", { replace: true });
          return;
        }
        setError(e instanceof ApiError ? e.message : "Gagal memuat kontribusi Anda.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const cleanupRef = useRef<null | (() => void)>(null);
  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      cleanupRef.current = load();
    }, 0);
    return () => {
      clearTimeout(t);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [user, tick, load]);

  const reload = () => setTick((t) => t + 1);

  // ---------- Belum masuk ----------
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={LogIn}
          title="Masuk untuk melihat kontribusi Anda"
          message="Riwayat kontribusi terhubung dengan akun Anda agar status peninjauan selalu bisa dipantau."
          action={
            <Button asChild className="min-h-[44px] rounded-full bg-brand-teal font-bold text-white hover:bg-brand-teal/90">
              <a href="#/masuk">
                <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Masuk sekarang
              </a>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Akun saya"
          title="Kontribusi Saya"
          description={`Semua dokumentasi yang Anda kirim atas nama ${user.name} beserta status peninjauannya.`}
        />
        <Button
          asChild
          className="min-h-[44px] rounded-full bg-brand-teal font-bold text-white hover:bg-brand-teal/90"
        >
          <a href="#/kontribusi">
            <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Kirim Kontribusi Baru
          </a>
        </Button>
      </div>

      <div className="mt-8" aria-live="polite">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-3xl" aria-hidden="true" />
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Gagal memuat kontribusi" message={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title="Belum ada kontribusi"
            message="Ceritakan objek budaya yang Anda kenal — kontribusi pertama Anda bisa secepat 5 menit."
            action={
              <Button asChild className="min-h-[44px] rounded-full bg-brand-gold font-bold text-brand-ink hover:bg-brand-gold/90">
                <a href="#/kontribusi">
                  <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Mulai Kontribusi
                </a>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((c) => {
              const latestReview = [...(c.reviews ?? [])].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0];
              return (
                <li key={c.id}>
                  <Card className="card-hover h-full rounded-3xl border-brand-line">
                    <CardContent className="flex h-full flex-col gap-3 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="font-bold leading-snug text-brand-ink">{c.title}</h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Kode <span className="font-mono font-bold text-brand-teal">{c.refCode}</span>
                            {" "}· Diajukan {fmtDate(c.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("shrink-0 px-2.5 py-1 text-[11px] font-bold", contributionStatusColor(c.status))}
                        >
                          {labelContributionStatus(c.status)}
                        </Badge>
                      </div>

                      <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>

                      {latestReview && (
                        <div className="mt-auto rounded-xl bg-brand-soft px-3.5 py-3">
                          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <History className="h-3.5 w-3.5" aria-hidden="true" />
                            Catatan peninjau terakhir
                          </p>
                          <p className="mt-1 text-sm text-foreground/85">
                            {latestReview.note ?? "Sedang diproses tim kurator."}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {latestReview.reviewer ? `oleh ${latestReview.reviewer.name} · ` : ""}
                            {fmtDate(latestReview.createdAt)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <UserCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Masuk sebagai {user.name} ({user.email})
      </p>
    </div>
  );
}
