'use client'

/**
 * Tab Dashboard — ringkasan CMS: kartu statistik, hitungan kontribusi
 * per status, kontribusi terbaru, dan objek terbaru (klik → detail).
 */
import { useAdminStats } from '@/hooks/use-admin-data'
import { useWaranusa } from '@/store/waranusa'
import { labelForCategory, ContributionStatusBadge, ItemStatusBadge, AdminErrorPanel, formatDateId } from './shared'
import type { ContributionStatus } from '@/lib/types'
import {
  Archive,
  Box,
  BookOpen,
  FileClock,
  Hourglass,
  MapPin,
  PlayCircle,
  Shapes,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const CONTRIB_ORDER: ContributionStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'REJECTED']

interface StatCardDef {
  label: string
  value: number
  icon: LucideIcon
  accent: string
}

function StatCard({ label, value, icon: Icon, accent }: StatCardDef) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-foreground sm:text-xl">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function StatsTab() {
  const { data: stats, isLoading, isError, error, refetch } = useAdminStats()
  const openItemDetail = useWaranusa((s) => s.openItemDetail)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return <AdminErrorPanel message={error instanceof Error ? error.message : 'Coba lagi nanti.'} onRetry={() => void refetch()} />
  }

  const statCards: StatCardDef[] = [
    { label: 'Objek Terpublikasi', value: stats.items.published, icon: BookOpen, accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300' },
    { label: 'Draft', value: stats.items.draft, icon: FileClock, accent: 'bg-brand-gold/20 text-brand-gold dark:text-brand-gold' },
    { label: 'Menunggu Tinjauan', value: stats.items.pendingReview, icon: Hourglass, accent: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300' },
    { label: 'Diarsipkan', value: stats.items.archived, icon: Archive, accent: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    { label: 'Bisa Dimainkan', value: stats.items.playable, icon: PlayCircle, accent: 'bg-brand-orange/15 text-brand-orange dark:text-brand-orange' },
    { label: 'Model 3D', value: stats.items.models3d, icon: Box, accent: 'bg-brand-ocean/10 text-brand-ocean dark:text-brand-ocean' },
    { label: 'Provinsi', value: stats.provinces, icon: MapPin, accent: 'bg-brand-teal/10 text-brand-teal dark:text-brand-teal' },
    { label: 'Kategori', value: stats.categories, icon: Shapes, accent: 'bg-brand-green/10 text-brand-green dark:text-brand-green' },
    { label: 'Pengguna', value: stats.users, icon: Users, accent: 'bg-accent text-accent-foreground' },
  ]

  return (
    <div className="space-y-4">
      {/* Kartu statistik utama */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Ringkasan kontribusi per status */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Kontribusi Komunitas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Total <span className="font-bold text-foreground">{stats.contributions.total}</span> kontribusi masuk.
          </p>
          <div className="flex flex-wrap gap-2">
            {CONTRIB_ORDER.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs"
              >
                <ContributionStatusBadge status={s} />
                <span className="font-bold text-foreground">
                  {s === 'SUBMITTED'
                    ? stats.contributions.submitted
                    : s === 'UNDER_REVIEW'
                      ? stats.contributions.underReview
                      : s === 'APPROVED'
                        ? stats.contributions.approved
                        : s === 'REJECTED'
                          ? stats.contributions.rejected
                          : stats.contributions.needsRevision}
                </span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dua daftar terbaru */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Kontribusi Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="wn-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
            {stats.recentContributions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada kontribusi.</p>
            )}
            {stats.recentContributions.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-2 rounded-lg border bg-background p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{c.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {labelForCategory(c.category)}
                    {c.province?.name ? ` • ${c.province.name}` : ''} • {formatDateId(c.createdAt)}
                  </p>
                </div>
                <ContributionStatusBadge status={c.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Objek Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="wn-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
            {stats.recentItems.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada objek budaya.</p>
            )}
            {stats.recentItems.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => openItemDetail(it.id)}
                className="flex w-full items-start justify-between gap-2 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{it.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {labelForCategory(it.category)}
                    {it.provinceName ? ` • ${it.provinceName}` : ''} • {formatDateId(it.updatedAt)}
                  </p>
                </div>
                <ItemStatusBadge status={it.status} />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
