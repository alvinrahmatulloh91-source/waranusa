'use client'

/**
 * Tab Kontribusi — inti moderasi: antrean kontribusi dengan filter status,
 * catatan AI (bukan keputusan), riwayat tinjauan, dan aksi kurator
 * (Tandai Ditinjau / Setujui+publikasi / Minta Revisi / Tolak).
 */
import { useState } from 'react'
import { useAdminContributions, useAdminCategories, useSetContributionStatus } from '@/hooks/use-admin-data'
import { useToast } from '@/hooks/use-toast'
import { useWaranusa } from '@/store/waranusa'
import {
  canManageContent,
  labelForCategory,
  formatDateTimeId,
  formatDateId,
  ContributionStatusBadge,
  AdminErrorPanel,
  AdminEmpty,
} from './shared'
import { CONTRIBUTION_STATUS_LABEL, ROLE_LABEL, type ContributionStatus, type ContributionRecord, type UserRole } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ToastAction } from '@/components/ui/toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  BadgeCheck,
  Ban,
  Check,
  Clock,
  Eye,
  History,
  Inbox,
  PenLine,
  Sparkles,
  Undo2,
} from 'lucide-react'

type ModerationStatus = Exclude<ContributionStatus, 'SUBMITTED'>

const FILTERS: { value: 'ALL' | ContributionStatus; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'SUBMITTED', label: 'Diajukan' },
  { value: 'UNDER_REVIEW', label: 'Menunggu' },
  { value: 'NEEDS_REVISION', label: 'Perlu Revisi' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
]

/** Status yang masih bisa diaksi kurator (bukan keputusan final). */
const OPEN_STATUSES: ContributionStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION']

function actionLabel(action: string): string {
  const key = action as ContributionStatus
  if (key === 'UNDER_REVIEW') return 'Menandai Ditinjau'
  if (key === 'APPROVED') return 'Menyetujui'
  if (key === 'REJECTED') return 'Menolak'
  if (key === 'NEEDS_REVISION') return 'Meminta Revisi'
  return action
}

export function ContributionsTab({ role }: { role: UserRole }) {
  // Semua peran panel (Kurator/Editor/Administrator) boleh memoderasi; server tetap validasi.
  const canModerate = role !== 'CONTRIBUTOR'
  const { toast } = useToast()
  const openItemDetail = useWaranusa((s) => s.openItemDetail)

  const [filter, setFilter] = useState<'ALL' | ContributionStatus>('ALL')
  const { data: categories } = useAdminCategories()
  const { data: contributions, isLoading, isError, error, refetch } = useAdminContributions(
    filter === 'ALL' ? undefined : filter,
  )
  const statusMut = useSetContributionStatus()

  return (
    <div className="space-y-4">
      {/* Filter status (pill) */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter status kontribusi">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <AdminErrorPanel
          message={error instanceof Error ? error.message : 'Coba lagi nanti.'}
          onRetry={() => void refetch()}
        />
      ) : (contributions?.length ?? 0) === 0 ? (
        <AdminEmpty
          message="Tidak ada kontribusi pada filter ini"
          hint="Pilih filter lain untuk melihat antrean moderasi."
        />
      ) : (
        <div className="space-y-4">
          {(contributions ?? []).map((c) => (
            <ContributionCard
              key={c.id}
              c={c}
              categories={categories}
              role={role}
              canModerate={canModerate}
              busy={statusMut.isPending}
              busyHere={statusMut.isPending && statusMut.variables?.id === c.id}
              onModerate={(status, note, publish) =>
                statusMut.mutate(
                  { id: c.id, status, note: note || undefined, publish },
                  {
                    onSuccess: (data) => {
                      if (data.createdItemId) {
                        toast({
                          title: 'Disetujui & dipublikasikan',
                          description: `Kontribusi "${c.title}" kini tampil di arsip publik.`,
                          action: (
                            <ToastAction
                              altText="Lihat objek budaya yang dibuat"
                              onClick={() => openItemDetail(data.createdItemId as string)}
                            >
                              Lihat objek
                            </ToastAction>
                          ),
                        })
                      } else if (status === 'APPROVED') {
                        toast({
                          title: 'Kontribusi disetujui',
                          description:
                            'Kontribusi tanpa provinsi tidak dapat dipublikasikan otomatis — atur provinsinya terlebih dahulu.',
                        })
                      } else {
                        toast({ title: 'Status kontribusi diperbarui' })
                      }
                    },
                    onError: (e: Error) =>
                      toast({ title: 'Gagal memperbarui status', description: e.message, variant: 'destructive' }),
                  },
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Kartu kontribusi ---------- */

function ContributionCard({
  c,
  categories,
  role,
  canModerate,
  busy,
  busyHere,
  onModerate,
}: {
  c: ContributionRecord
  categories?: { key: string; label: string }[]
  role: UserRole
  canModerate: boolean
  busy: boolean
  busyHere: boolean
  onModerate: (status: ModerationStatus, note: string, publish?: boolean) => void
}) {
  const openItemDetail = useWaranusa((s) => s.openItemDetail)
  const [note, setNote] = useState('')
  const [publish, setPublish] = useState(true)
  const [rejectOpen, setRejectOpen] = useState(false)

  const open = OPEN_STATUSES.includes(c.status)
  const sender = c.user ? `${c.user.name} (${c.user.email})` : c.contributorName

  return (
    <article className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
      {/* Kepala kartu */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">{c.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {labelForCategory(c.category, categories)}
            {c.province?.name ? ` • ${c.province.name}` : ''} • Dikirim {formatDateTimeId(c.createdAt)}
          </p>
        </div>
        <ContributionStatusBadge status={c.status} />
      </div>

      {/* Pengirim & sumber */}
      <div className="mt-2.5 grid gap-1 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Pengirim:</span> {sender}
        </p>
        {c.sourceRef && (
          <p>
            <span className="font-semibold text-foreground">Sumber rujukan:</span> {c.sourceRef}
          </p>
        )}
      </div>

      {/* Isi lengkap (tanpa clamp) */}
      <div className="mt-3 whitespace-pre-line rounded-lg border bg-background p-3 text-sm leading-relaxed text-foreground">
        {c.content}
      </div>

      {/* Catatan AI */}
      {c.aiNote && (
        <div className="mt-3 rounded-lg border-l-4 border-brand-gold bg-muted/60 p-2.5">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3 text-brand-gold" />
            Catatan kurasi otomatis (AI) — bukan keputusan akhir
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.aiNote}</p>
        </div>
      )}

      {/* Riwayat tinjauan */}
      {c.reviews && c.reviews.length > 0 && (
        <div className="mt-3 rounded-lg border border-dashed p-2.5">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <History className="h-3 w-3" /> Riwayat tinjauan
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {c.reviews.map((r) => (
              <li key={r.id} className="text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{actionLabel(r.action)}</span>
                {' — '}
                {r.reviewer?.name ?? 'Sistem'} • {formatDateId(r.createdAt)}
                {r.note ? <span className="italic"> “{r.note}”</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keputusan final */}
      {!open && (
        <div
          className={`mt-3 rounded-lg border p-3 text-xs leading-relaxed ${
            c.status === 'APPROVED'
              ? 'border-emerald-600/30 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-red-500/30 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200'
          }`}
        >
          <p className="flex items-center gap-1.5 font-bold">
            {c.status === 'APPROVED' ? <BadgeCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            Keputusan: {CONTRIBUTION_STATUS_LABEL[c.status]}
            {c.reviewedAt ? <span className="font-normal">• {formatDateId(c.reviewedAt)}</span> : null}
          </p>
          {c.reviewNote && <p className="mt-1">{c.reviewNote}</p>}
          {c.status === 'APPROVED' && c.createdItemId && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 gap-1 border-emerald-600/40 px-2 text-[11px] text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300"
              onClick={() => openItemDetail(c.createdItemId as string)}
            >
              <Eye className="h-3 w-3" /> Lihat objek budaya
            </Button>
          )}
        </div>
      )}

      {/* Area aksi moderasi */}
      {canModerate && open && (
        <div className="mt-4 border-t pt-3">
          {busyHere && <p className="mb-2 text-xs font-medium text-brand-teal">Memperbarui…</p>}
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan peninjauan (opsional)"
            className="mb-2 text-sm"
            disabled={busy}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={busy}
              onClick={() => onModerate('UNDER_REVIEW', note)}
            >
              <Clock className="h-3.5 w-3.5" /> Tandai Ditinjau
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={busy}
              onClick={() => onModerate('APPROVED', note, publish)}
            >
              <Check className="h-3.5 w-3.5" /> Setujui
            </Button>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Checkbox checked={publish} onCheckedChange={(v) => setPublish(v === true)} disabled={busy} />
              Buat objek budaya &amp; publikasikan
            </label>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 border-brand-orange/50 text-brand-orange hover:bg-brand-orange/10 hover:text-brand-orange"
              disabled={busy}
              onClick={() => onModerate('NEEDS_REVISION', note)}
            >
              <Undo2 className="h-3.5 w-3.5" /> Minta Revisi
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={busy}
              onClick={() => setRejectOpen(true)}
            >
              <Ban className="h-3.5 w-3.5" /> Tolak
            </Button>
          </div>
          {!canManageContent(role) && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Peran {ROLE_LABEL[role]} dapat memoderasi kontribusi namun tidak dapat mengubah konten arsip.
            </p>
          )}
        </div>
      )}

      {/* Konfirmasi tolak */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak kontribusi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              “{c.title}” akan ditandai ditolak. Pengirim dapat membaca catatan peninjauanmu sebagai masukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                onModerate('REJECTED', note)
                setRejectOpen(false)
              }}
            >
              Ya, tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
