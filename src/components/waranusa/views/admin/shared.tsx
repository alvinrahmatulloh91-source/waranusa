'use client'

/**
 * Komponen & helper bersama untuk tab-tab Panel Pengelola WaraNusa:
 * badge status berwarna, format tanggal Indonesia, panel galat/kosong,
 * serta aturan peran tulis-konten (server tetap otoritas akhir).
 */
import {
  ITEM_STATUS_LABEL,
  CONTRIBUTION_STATUS_LABEL,
  type ContributionStatus,
  type ItemStatus,
  type UserRole,
} from '@/lib/types'
import { CATEGORIES } from '@/data/islands'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react'

/* ---------- Peran ---------- */

/** Peran yang boleh MENGUBAH konten (item/wilayah/kategori). Server tetap memvalidasi. */
export function canManageContent(role?: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'EDITOR'
}

/* ---------- Format tanggal ---------- */

export function formatDateId(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTimeId(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ---------- Label kategori (fallback konstanta bila API belum termuat) ---------- */

export function labelForCategory(key: string, categories?: { key: string; label: string }[]): string {
  const fromApi = categories?.find((c) => c.key === key)
  if (fromApi) return fromApi.label
  return CATEGORIES.find((c) => c.key === key)?.label ?? key
}

/* ---------- Badge status ---------- */

const ITEM_STATUS_CLS: Record<ItemStatus, string> = {
  PUBLISHED:
    'border-emerald-600/30 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300',
  DRAFT: 'border-border bg-muted text-muted-foreground',
  PENDING_REVIEW:
    'border-amber-500/40 bg-amber-100/80 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-300',
  REJECTED:
    'border-red-500/40 bg-red-100/80 text-red-800 dark:border-red-500/40 dark:bg-red-950/60 dark:text-red-300',
  ARCHIVED:
    'border-slate-400/40 bg-slate-200/70 text-slate-700 dark:border-slate-500/40 dark:bg-slate-800/70 dark:text-slate-300',
}

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${ITEM_STATUS_CLS[status] ?? ''}`}>
      {ITEM_STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

const CONTRIBUTION_STATUS_CLS: Record<ContributionStatus, string> = {
  SUBMITTED:
    'border-teal-600/40 bg-teal-100/80 text-teal-800 dark:border-teal-500/40 dark:bg-teal-950/60 dark:text-teal-300',
  UNDER_REVIEW:
    'border-amber-500/40 bg-amber-100/80 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-300',
  APPROVED:
    'border-emerald-600/30 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300',
  REJECTED:
    'border-red-500/40 bg-red-100/80 text-red-800 dark:border-red-500/40 dark:bg-red-950/60 dark:text-red-300',
  NEEDS_REVISION:
    'border-orange-500/40 bg-orange-100/80 text-orange-800 dark:border-orange-500/40 dark:bg-orange-950/60 dark:text-orange-300',
}

export function ContributionStatusBadge({ status }: { status: ContributionStatus }) {
  return (
    <Badge variant="outline" className={`whitespace-nowrap ${CONTRIBUTION_STATUS_CLS[status] ?? ''}`}>
      {CONTRIBUTION_STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

/* ---------- Keadaan galat / kosong ---------- */

export function AdminErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">Gagal memuat data</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={onRetry}>
        <RotateCcw className="h-3.5 w-3.5" /> Coba lagi
      </Button>
    </div>
  )
}

export function AdminEmpty({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{message}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Skeleton baris tabel sederhana. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  )
}
