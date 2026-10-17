'use client'

/**
 * SourcesTab — pengelolaan referensi dan atribusi (/admin/sources):
 * - Kelola sumber buku, jurnal, registri WBTb, dan lisensi referensi.
 * - Hubungkan sumber dengan objek budaya terkait.
 */
import { useState } from 'react'
import {
  useAdminSources,
  useCreateAdminSource,
  useUpdateAdminSource,
  useDeleteAdminSource,
  useAdminItems,
} from '@/hooks/use-admin-data'
import type { ItemSource, UserRole } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  BookMarked,
  BookOpen,
  ExternalLink,
  Library,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

export function SourcesTab({ role }: { role: UserRole }) {
  const { toast } = useToast()
  const canEdit = role === 'SUPER_ADMIN' || role === 'EDITOR'

  const [q, setQ] = useState('')
  const [selectedItem, setSelectedItem] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAdminSources({
    q: q.trim() || undefined,
    itemId: selectedItem === 'ALL' ? undefined : selectedItem,
    page,
    pageSize: 20,
  })

  // Daftar item budaya untuk memilih relasi
  const { data: itemsData } = useAdminItems({ page: 1, pageSize: 100 })
  const culturalItems = itemsData?.items ?? []

  // Mutasi
  const createMut = useCreateAdminSource()
  const updateMut = useUpdateAdminSource()
  const deleteMut = useDeleteAdminSource()

  // Modal dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<ItemSource | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formPublisher, setFormPublisher] = useState('')
  const [formYear, setFormYear] = useState('')
  const [formLicense, setFormLicense] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formItemId, setFormItemId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const openCreateDialog = () => {
    setEditingSource(null)
    setFormTitle('')
    setFormUrl('')
    setFormPublisher('')
    setFormYear(new Date().getFullYear().toString())
    setFormLicense('CC BY-SA 4.0')
    setFormNote('')
    setFormItemId(culturalItems[0]?.id ?? '')
    setFormError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (s: ItemSource) => {
    setEditingSource(s)
    setFormTitle(s.title)
    setFormUrl(s.url ?? '')
    setFormPublisher(s.publisher ?? '')
    setFormYear(s.year ?? '')
    setFormLicense(s.license ?? '')
    setFormNote(s.note ?? '')
    setFormItemId(s.itemId ?? '')
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setFormError('Judul sumber wajib diisi.')
      return
    }
    if (!formItemId) {
      setFormError('Objek budaya terkait wajib dipilih.')
      return
    }

    const payload = {
      title: formTitle.trim(),
      url: formUrl.trim() || null,
      publisher: formPublisher.trim() || null,
      year: formYear.trim() || null,
      license: formLicense.trim() || null,
      note: formNote.trim() || null,
      itemId: formItemId,
    }

    if (editingSource && editingSource.id) {
      updateMut.mutate(
        { id: editingSource.id, ...payload },
        {
          onSuccess: () => {
            toast({ title: 'Sumber diperbarui', description: `Sumber "${payload.title}" berhasil diubah.` })
            setDialogOpen(false)
          },
          onError: (err) => {
            setFormError(err.message)
            toast({ title: 'Gagal memperbarui', description: err.message, variant: 'destructive' })
          },
        },
      )
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast({ title: 'Sumber ditambahkan', description: `Sumber "${payload.title}" berhasil disimpan.` })
          setDialogOpen(false)
        },
        onError: (err) => {
          setFormError(err.message)
          toast({ title: 'Gagal menambahkan', description: err.message, variant: 'destructive' })
        },
      })
    }
  }

  const handleDelete = (id: string) => {
    deleteMut.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Sumber dihapus', description: 'Sumber referensi berhasil dihapus.' })
        setDeleteConfirmId(null)
      },
      onError: (err) => {
        toast({ title: 'Gagal menghapus', description: err.message, variant: 'destructive' })
      },
    })
  }

  const isSaving = createMut.isPending || updateMut.isPending
  const sourcesList = data?.sources ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Sumber &amp; Atribusi</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Kelola referensi sejarah, direktori WBTb Kemendikbudristek, publikasi ilmiah, dan lisensi.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreateDialog} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Tambah Sumber
          </Button>
        )}
      </div>

      {/* Filter and Search */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari judul sumber, penerbit, lisensi, atau nama objek..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div>
              <Select
                value={selectedItem}
                onValueChange={(val) => {
                  setSelectedItem(val)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Objek Budaya" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="ALL">Semua Objek Budaya</SelectItem>
                  {culturalItems.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sources List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : sourcesList.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookMarked className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 font-display text-base font-bold text-foreground">Tidak Ada Sumber</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {q || selectedItem !== 'ALL'
                ? 'Tidak ada sumber yang cocok dengan kriteria pencarian.'
                : 'Belum ada sumber referensi yang terdaftar. Tambahkan sumber untuk melengkapi akurasi budaya.'}
            </p>
            {canEdit && (
              <Button onClick={openCreateDialog} variant="outline" size="sm" className="mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Tambah Sumber Baru
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sourcesList.map((s) => (
            <Card key={s.id} className="border shadow-sm transition hover:border-primary/40">
              <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-foreground sm:text-base">
                      {s.title}
                    </span>
                    {s.license && (
                      <Badge variant="outline" className="border-primary/30 text-[11px] text-primary">
                        {s.license}
                      </Badge>
                    )}
                    {s.year && (
                      <Badge variant="secondary" className="text-[11px]">
                        {s.year}
                      </Badge>
                    )}
                  </div>

                  {s.culturalItem && (
                    <p className="flex items-center gap-1.5 text-xs text-brand-teal font-medium">
                      <Library className="h-3.5 w-3.5" /> Objek: {s.culturalItem.name}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {s.publisher && <span>Penerbit: {s.publisher}</span>}
                    {s.note && <span className="italic">{s.note}</span>}
                  </div>

                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                    >
                      Buka Tautan Sumber <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {canEdit && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(s)}
                      className="h-8 gap-1 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => s.id && setDeleteConfirmId(s.id)}
                      className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Menampilkan halaman {meta.page} dari {meta.totalPages} ({meta.total} total sumber)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingSource ? 'Edit Sumber Referensi' : 'Tambah Sumber Referensi'}
            </DialogTitle>
            <DialogDescription>
              Catat literatur, direktori resmi, dan lisensi penggunaan konten budaya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {formError}
              </p>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="source-item">Objek Budaya Terkait *</Label>
              <Select value={formItemId} onValueChange={setFormItemId}>
                <SelectTrigger id="source-item">
                  <SelectValue placeholder="Pilih objek budaya" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {culturalItems.map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="source-title">Judul Sumber / Dokumen *</Label>
              <Input
                id="source-title"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Contoh: Direktori Warisan Budaya Takbenda Kemdikbud"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="source-url">URL / Tautan (opsional)</Label>
              <Input
                id="source-url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="source-publisher">Penerbit / Penulis</Label>
                <Input
                  id="source-publisher"
                  value={formPublisher}
                  onChange={(e) => setFormPublisher(e.target.value)}
                  placeholder="Kemdikbud / Balai Pustaka"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="source-year">Tahun Publikasi</Label>
                <Input
                  id="source-year"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  placeholder="2022"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="source-license">Lisensi / Ketentuan Penggunaan</Label>
              <Input
                id="source-license"
                value={formLicense}
                onChange={(e) => setFormLicense(e.target.value)}
                placeholder="CC BY-SA 4.0 / Domain Publik"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="source-note">Catatan Tambahan (opsional)</Label>
              <Textarea
                id="source-note"
                rows={2}
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Misal: Nomor registrasi WBTb, bab rujukan..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? 'Menyimpan...' : editingSource ? 'Simpan Perubahan' : 'Tambah Sumber'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Sumber Referensi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus sumber referensi ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {deleteMut.isPending ? 'Menghapus...' : 'Hapus Sumber'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
