'use client'

/**
 * MyContributionsView — riwayat kontribusi milik pengguna yang sedang masuk.
 * Menampilkan status moderasi, catatan kurator, catatan kurasi otomatis (AI),
 * riwayat tinjauan (audit), serta tautan ke objek budaya hasil publikasi.
 */
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useWaranusa } from '@/store/waranusa'
import { useMyContributions, useCategories } from '@/hooks/use-waradata'
import {
  CONTRIBUTION_STATUS_LABEL,
  type ContributionRecord,
  type ContributionStatus,
} from '@/lib/types'
import {
  AlertTriangle,
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  History,
  Inbox,
  Lock,
  LogIn,
  RefreshCw,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'

/** Kelas warna badge per status kontribusi. */
const STATUS_BADGE_CLASS: Record<ContributionStatus, string> = {
  SUBMITTED: 'border-teal-600/50 bg-teal-50/70 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  UNDER_REVIEW: 'border-amber-500/50 bg-amber-50/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  APPROVED: 'border-emerald-600/50 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  REJECTED: 'border-red-500/50 bg-red-50/80 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  NEEDS_REVISION: 'border-orange-500/50 bg-orange-50/80 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function MyContributionsView() {
  const setView = useWaranusa((s) => s.setView)
  const setLoginRedirect = useWaranusa((s) => s.setLoginRedirect)
  const openItemDetail = useWaranusa((s) => s.openItemDetail)
  const { data: contributions, isLoading, error, refetch, isRefetching } = useMyContributions()
  const { data: categories } = useCategories()

  const categoryLabel = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of categories ?? []) map.set(c.key, c.label)
    return map
  }, [categories])

  // Urutkan terbaru dulu (API sudah desc, dijaga defensif).
  const sorted = useMemo(
    () =>
      [...(contributions ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [contributions],
  )

  const goKontribusi = () => {
    setView('kontribusi')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goMasuk = () => {
    setLoginRedirect('riwayat')
    setView('masuk')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* --- Gate: belum masuk (401 atau memang anonim) --- */
  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <GateCard onMasuk={goMasuk} />
      </section>
    )
  }

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Kepala halaman + refresh */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Riwayat Kontribusi Saya</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau status peninjauan dan keputusan kurator atas kiriman budaya Anda.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Muat ulang daftar kontribusi"
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4${isRefetching ? ' animate-spin' : ''}`} aria-hidden />
          Muat Ulang
        </Button>
      </div>

      {/* Sedang memuat */}
      {isLoading && (
        <div className="grid gap-4" aria-busy="true" aria-label="Memuat riwayat kontribusi">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Kosong */}
      {!isLoading && sorted.length === 0 && (
        <Card className="rounded-2xl border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="h-7 w-7" aria-hidden />
            </span>
            <p className="font-display text-xl font-semibold text-foreground">Belum ada kontribusi</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Bagikan pengetahuan budaya daerah Anda dan bantu melestarikan warisan Nusantara bersama komunitas.
            </p>
            <Button onClick={goKontribusi} className="mt-1 gap-2">
              <History className="h-4 w-4" aria-hidden /> Kirim Kontribusi Pertama
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Daftar kontribusi */}
      {!isLoading && sorted.length > 0 && (
        <div className="grid gap-4">
          {sorted.map((c) => (
            <ContributionCard
              key={c.id}
              c={c}
              categoryLabel={categoryLabel.get(c.category) ?? c.category}
              onOpenItem={(id) => {
                openItemDetail(id)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onKontribusi={goKontribusi}
            />
          ))}
        </div>
      )}
    </motion.section>
  )
}

/* ---------- Kartu gate login (dipakai saat 401) ---------- */

function GateCard({ onMasuk }: { onMasuk: () => void }) {
  return (
    <Card className="mx-auto max-w-xl rounded-2xl shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" aria-hidden />
        </span>
        <p className="font-display text-2xl font-semibold text-foreground">Masuk untuk Melihat Riwayat</p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Riwayat kontribusi bersifat pribadi. Masuk dengan akun Anda untuk memantau status kiriman,
          catatan kurator, dan keputusan peninjauan.
        </p>
        <Button onClick={onMasuk} className="mt-1 gap-2">
          <LogIn className="h-4 w-4" aria-hidden /> Masuk / Daftar
        </Button>
      </CardContent>
    </Card>
  )
}

/* ---------- Kartu satu kontribusi ---------- */

function ContributionCard({
  c,
  categoryLabel,
  onOpenItem,
  onKontribusi,
}: {
  c: ContributionRecord
  categoryLabel: string
  onOpenItem: (id: string) => void
  onKontribusi: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const panjang = c.content.length > 180
  const reviews = [...(c.reviews ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="grid gap-2.5">
        {/* Baris meta atas */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={`gap-1 ${STATUS_BADGE_CLASS[c.status] ?? ''}`}>
            <UserRoundCheck className="h-3 w-3" aria-hidden />
            {CONTRIBUTION_STATUS_LABEL[c.status] ?? c.status}
          </Badge>
          <Badge variant="secondary">{categoryLabel}</Badge>
          {c.province?.name && (
            <span className="text-xs text-muted-foreground">{c.province.name}</span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
        </div>

        {/* Banner perlu revisi */}
        {c.status === 'NEEDS_REVISION' && (
          <div
            className="flex items-start gap-2 rounded-xl border border-orange-500/40 bg-orange-50/70 p-2.5 text-xs leading-relaxed text-orange-800 dark:bg-orange-950/30 dark:text-orange-200"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Kurator meminta revisi — silakan kirim ulang kontribusi yang diperbaiki melalui formulir.
          </div>
        )}

        {/* Judul + isi */}
        <h2 className="font-display text-lg font-semibold leading-snug text-foreground">{c.title}</h2>
        <p className={`text-sm leading-relaxed text-muted-foreground${panjang && !expanded ? ' line-clamp-3' : ''}`}>
          {c.content}
        </p>
        {panjang && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex w-fit items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            {expanded ? (
              <>
                Sembunyikan <ChevronUp className="h-3.5 w-3.5" aria-hidden />
              </>
            ) : (
              <>
                Baca selengkapnya <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              </>
            )}
          </button>
        )}

        {/* Sumber referensi */}
        {c.sourceRef && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Sumber: </span>
            {c.sourceRef}
          </p>
        )}

        {/* Catatan kurator manusia */}
        {c.reviewNote && (
          <blockquote className="rounded-r-lg border-l-2 border-primary/40 bg-muted/60 p-3">
            <p className="text-xs font-semibold text-foreground">Catatan kurator:</p>
            <p className="mt-0.5 text-sm italic leading-relaxed text-muted-foreground">{c.reviewNote}</p>
          </blockquote>
        )}

        {/* Catatan kurasi otomatis (AI) */}
        {c.aiNote && (
          <div className="rounded-xl bg-muted/40 p-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Catatan kurasi otomatis (AI) — bukan keputusan akhir:
            </p>
            <p className="mt-0.5 text-xs italic text-muted-foreground">{c.aiNote}</p>
          </div>
        )}

        {/* Timeline tinjauan */}
        {reviews.length > 0 && (
          <div className="rounded-xl border p-3">
            <p className="text-xs font-semibold text-foreground">Riwayat Tinjauan</p>
            <ol className="mt-2 grid gap-2.5">
              {reviews.map((r) => (
                <li key={r.id} className="relative flex gap-2.5 pl-1">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/60" aria-hidden />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
                      <span className="font-semibold text-foreground">
                        {CONTRIBUTION_STATUS_LABEL[r.action as ContributionStatus] ?? r.action}
                      </span>
                      <span className="text-muted-foreground">
                        oleh {r.reviewer?.name ?? 'Kurator'} — {formatDate(r.createdAt)}
                      </span>
                    </p>
                    {r.note && (
                      <p className="mt-0.5 text-xs italic leading-relaxed text-muted-foreground">{r.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Hasil publikasi */}
        {c.createdItemId && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50/60 p-2.5 dark:bg-emerald-950/20">
            <p className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-200">
              <BookOpenCheck className="h-4 w-4 shrink-0" aria-hidden />
              Kontribusi ini telah dipublikasikan sebagai objek budaya di katalog.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 shrink-0 gap-1 border-emerald-600/40 px-2.5 text-xs text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300"
              onClick={() => onOpenItem(c.createdItemId as string)}
            >
              <ExternalLink className="h-3 w-3" aria-hidden /> Lihat di Katalog
            </Button>
          </div>
        )}

        {(c.reviewNote || c.aiNote || c.createdItemId || reviews.length > 0) && <Separator className="mt-1" />}
        <p className="text-[11px] text-muted-foreground">
          Diajukan oleh {c.contributorName}
          {c.reviewedAt ? ` — keputusan terakhir ${formatDate(c.reviewedAt)}` : ' — menunggu keputusan kurator'}
        </p>
        {c.status === 'NEEDS_REVISION' && (
          <Button size="sm" variant="outline" onClick={onKontribusi} className="w-fit gap-1.5">
            <History className="h-3.5 w-3.5" aria-hidden /> Kirim Revisi melalui Formulir
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
