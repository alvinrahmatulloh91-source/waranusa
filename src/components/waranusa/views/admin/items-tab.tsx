'use client'

/**
 * Tab Objek Budaya — daftar seluruh item (semua status) dengan pencarian,
 * filter status/provinsi/kategori, paginasi, aksi cepat status, dan dialog
 * tambah/edit. Peran Kurator (REVIEWER) bersifat baca-saja untuk konten.
 */
import { useEffect, useState } from 'react'
import { useAdminItems, useAdminProvinces, useAdminCategories, useUpdateAdminItem } from '@/hooks/use-admin-data'
import { useToast } from '@/hooks/use-toast'
import {
  canManageContent,
  labelForCategory,
  formatDateId,
  ItemStatusBadge,
  AdminErrorPanel,
  AdminEmpty,
  TableSkeleton,
} from './shared'
import { ItemFormDialog } from './item-form-dialog'
import type { AdminItemRecord, ItemStatus, UserRole } from '@/lib/types'
import { ITEM_STATUSES, ITEM_STATUS_LABEL } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Archive,
  Ban,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileClock,
  FileWarning,
  MoreVertical,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'

const PAGE_SIZE = 10

export function ItemsTab({ role }: { role: UserRole }) {
  const canWrite = canManageContent(role)
  const { toast } = useToast()

  // Filter + pencarian (debounce 350 ms)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [province, setProvince] = useState('ALL')
  const [category, setCategory] = useState('ALL')
  const [page, setPage] = useState(1)

  const [dialogItem, setDialogItem] = useState<AdminItemRecord | 'new' | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ item: AdminItemRecord; action: 'ARCHIVED' | 'REJECTED' } | null>(null)

  // Debounce pencarian 350 ms; reset halaman dilakukan di callback timer
  // dan pada handler filter (bukan langsung di body effect).
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  const changeStatus = (v: string) => {
    setStatus(v)
    setPage(1)
  }
  const changeProvince = (v: string) => {
    setProvince(v)
    setPage(1)
  }
  const changeCategory = (v: string) => {
    setCategory(v)
    setPage(1)
  }

  const itemsQuery = useAdminItems({
    q: debouncedQ || undefined,
    status: status === 'ALL' ? undefined : (status as ItemStatus),
    province: province === 'ALL' ? undefined : province,
    category: category === 'ALL' ? undefined : category,
    page,
    pageSize: PAGE_SIZE,
  })
  const { data: provinces } = useAdminProvinces()
  const { data: categories } = useAdminCategories()
  const updateMut = useUpdateAdminItem()

  const items = itemsQuery.data?.items ?? []
  const meta = itemsQuery.data?.meta

  const quickStatus = (item: AdminItemRecord, next: ItemStatus) => {
    updateMut.mutate(
      { id: item.id, status: next },
      {
        onSuccess: () =>
          toast({
            title: 'Status diperbarui',
            description: `"${item.name}" kini ${ITEM_STATUS_LABEL[next].toLowerCase()}.`,
          }),
        onError: (e: Error) =>
          toast({ title: 'Gagal memperbarui status', description: e.message, variant: 'destructive' }),
      },
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: cari + filter + tambah */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama objek budaya…"
            className="pl-8"
            aria-label="Cari objek budaya"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
          <Select value={status} onValueChange={changeStatus}>
            <SelectTrigger aria-label="Filter status" className="w-full lg:w-[168px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              {ITEM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ITEM_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={province} onValueChange={changeProvince}>
            <SelectTrigger aria-label="Filter provinsi" className="w-full lg:w-[168px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="ALL">Semua Provinsi</SelectItem>
              {(provinces ?? []).map((p) => (
                <SelectItem key={p.id} value={p.slug}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={changeCategory}>
            <SelectTrigger aria-label="Filter kategori" className="col-span-2 w-full sm:col-span-1 lg:w-[168px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canWrite && (
          <Button className="gap-1.5" onClick={() => setDialogItem('new')}>
            <Plus className="h-4 w-4" /> Tambah Objek
          </Button>
        )}
      </div>

      {itemsQuery.isLoading ? (
        <div className="rounded-xl border p-4">
          <TableSkeleton rows={6} />
        </div>
      ) : itemsQuery.isError ? (
        <AdminErrorPanel
          message={itemsQuery.error instanceof Error ? itemsQuery.error.message : 'Coba lagi nanti.'}
          onRetry={() => void itemsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <AdminEmpty
          message="Tidak ada objek yang cocok"
          hint="Ubah kata kunci atau reset filter untuk melihat daftar objek lain."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="min-w-52">Nama</TableHead>
                <TableHead className="min-w-36">Kategori</TableHead>
                <TableHead className="min-w-32">Provinsi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="min-w-28">Diperbarui</TableHead>
                {canWrite && <TableHead className="w-12 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    <div className="flex max-w-[280px] flex-col items-start gap-1">
                      <span className="truncate font-medium text-foreground">{it.name}</span>
                      {it.needsReview && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-500/40 bg-amber-100/70 text-[10px] text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        >
                          <FileWarning className="h-3 w-3" /> perlu tinjauan
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {labelForCategory(it.category, categories)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{it.province?.name ?? '-'}</TableCell>
                  <TableCell>
                    <ItemStatusBadge status={it.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateId(it.updatedAt)}
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Aksi untuk ${it.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setDialogItem(it)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={it.status === 'PUBLISHED' || updateMut.isPending}
                            onClick={() => quickStatus(it, 'PUBLISHED')}
                          >
                            <BookOpen className="h-4 w-4" /> Publikasikan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={it.status === 'DRAFT' || updateMut.isPending}
                            onClick={() => quickStatus(it, 'DRAFT')}
                          >
                            <FileClock className="h-4 w-4" /> Jadikan Draft
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={it.status === 'ARCHIVED' || updateMut.isPending}
                            onClick={() => setConfirmAction({ item: it, action: 'ARCHIVED' })}
                          >
                            <Archive className="h-4 w-4" /> Arsipkan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={it.status === 'REJECTED' || updateMut.isPending}
                            className="text-red-600 focus:text-red-700"
                            onClick={() => setConfirmAction({ item: it, action: 'REJECTED' })}
                          >
                            <Ban className="h-4 w-4" /> Tolak
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginasi ringkas */}
      {meta && meta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Halaman {meta.page} dari {meta.totalPages} • {meta.total} objek
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page <= 1 || itemsQuery.isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={page >= meta.totalPages || itemsQuery.isLoading}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog tambah/edit — key memaksa form segar per item target */}
      {dialogItem !== null && (
        <ItemFormDialog
          key={dialogItem === 'new' ? 'new' : dialogItem.id}
          open
          item={dialogItem === 'new' ? null : dialogItem}
          onClose={() => setDialogItem(null)}
        />
      )}

      {/* Konfirmasi arsip / tolak */}
      <AlertDialog open={confirmAction !== null} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === 'ARCHIVED' ? 'Arsipkan objek ini?' : 'Tolak objek ini?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === 'ARCHIVED'
                ? `"${confirmAction?.item.name}" akan disembunyikan dari arsip publik namun datanya tetap tersimpan dan dapat dipublikasikan kembali.`
                : `"${confirmAction?.item.name}" akan ditandai ditolak dan tidak tampil di arsip publik. Tindakan ini tetap tercatat.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmAction?.action === 'REJECTED'
                  ? 'bg-destructive text-white hover:bg-destructive/90'
                  : ''
              }
              onClick={() => {
                if (confirmAction) quickStatus(confirmAction.item, confirmAction.action)
                setConfirmAction(null)
              }}
            >
              Ya, lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
