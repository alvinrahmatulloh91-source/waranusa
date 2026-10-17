'use client'

/**
 * MediaTab — pengelolaan aset media WaraNusa (/admin/media):
 * - Gambar, audio, model 3D, dan metadata lisensi serta atribusi pencipta
 * - Filter tipe media, pencarian, pratinjau media, tambah, edit, hapus
 */
import { useMemo, useState } from 'react'
import {
  useAdminMedia,
  useCreateAdminMedia,
  useUpdateAdminMedia,
  useDeleteAdminMedia,
  useAdminItems,
} from '@/hooks/use-admin-data'
import type { MediaAssetRecord, MediaType, UserRole } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  Box,
  ExternalLink,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Music,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

const MEDIA_TYPES: { value: MediaType; label: string; icon: typeof ImageIcon }[] = [
  { value: 'IMAGE', label: 'Gambar', icon: ImageIcon },
  { value: 'AUDIO', label: 'Audio', icon: Music },
  { value: 'MODEL_3D', label: 'Model 3D', icon: Box },
  { value: 'VIDEO', label: 'Video', icon: Film },
]

export function MediaTab({ role }: { role: UserRole }) {
  const { toast } = useToast()
  const canEdit = role === 'SUPER_ADMIN' || role === 'EDITOR'

  const [q, setQ] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedItem, setSelectedItem] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching } = useAdminMedia({
    q: q.trim() || undefined,
    type: selectedType === 'ALL' ? undefined : selectedType,
    itemId: selectedItem === 'ALL' ? undefined : selectedItem,
    page,
    pageSize: 18,
  })

  // Ambil daftar objek budaya untuk relasi
  const { data: itemsData } = useAdminItems({ page: 1, pageSize: 100 })
  const culturalItems = itemsData?.items ?? []

  // Mutasi
  const createMut = useCreateAdminMedia()
  const updateMut = useUpdateAdminMedia()
  const deleteMut = useDeleteAdminMedia()

  // Modal dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<MediaAssetRecord | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<MediaType>('IMAGE')
  const [formUrl, setFormUrl] = useState('')
  const [formLicense, setFormLicense] = useState('')
  const [formCreator, setFormCreator] = useState('')
  const [formSourceUrl, setFormSourceUrl] = useState('')
  const [formCaption, setFormCaption] = useState('')
  const [formItemId, setFormItemId] = useState<string>('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const openCreateDialog = () => {
    setEditingMedia(null)
    setFormTitle('')
    setFormType('IMAGE')
    setFormUrl('')
    setFormLicense('CC BY-SA')
    setFormCreator('')
    setFormSourceUrl('')
    setFormCaption('')
    setFormItemId('')
    setFormFeatured(false)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (m: MediaAssetRecord) => {
    setEditingMedia(m)
    setFormTitle(m.title)
    setFormType(m.type)
    setFormUrl(m.url)
    setFormLicense(m.license ?? '')
    setFormCreator(m.creator ?? '')
    setFormSourceUrl(m.sourceUrl ?? '')
    setFormCaption(m.caption ?? '')
    setFormItemId(m.itemId ?? '')
    setFormFeatured(Boolean(m.isFeatured))
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setFormError('Judul aset media wajib diisi.')
      return
    }
    if (!formUrl.trim()) {
      setFormError('URL media wajib diisi.')
      return
    }

    const payload = {
      title: formTitle.trim(),
      type: formType,
      url: formUrl.trim(),
      license: formLicense.trim() || null,
      creator: formCreator.trim() || null,
      sourceUrl: formSourceUrl.trim() || null,
      caption: formCaption.trim() || null,
      itemId: formItemId || null,
      isFeatured: formFeatured,
    }

    if (editingMedia) {
      updateMut.mutate(
        { id: editingMedia.id, ...payload },
        {
          onSuccess: () => {
            toast({ title: 'Aset media diperbarui', description: `Media "${payload.title}" berhasil diubah.` })
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
          toast({ title: 'Aset media ditambahkan', description: `Media "${payload.title}" berhasil disimpan.` })
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
        toast({ title: 'Aset media dihapus', description: 'Media berhasil dihapus dari sistem.' })
        setDeleteConfirmId(null)
      },
      onError: (err) => {
        toast({ title: 'Gagal menghapus', description: err.message, variant: 'destructive' })
      },
    })
  }

  const isSaving = createMut.isPending || updateMut.isPending
  const mediaList = data?.media ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Aset Media &amp; Lisensi</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Katalog gambar ilustrasi, rekaman/parameter audio, arketipe 3D, dan metadata atribusi hak cipta.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreateDialog} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Tambah Media
          </Button>
        )}
      </div>

      {/* Filter and search bar */}
      <Card className="border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari judul, lisensi, pencipta..."
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
                value={selectedType}
                onValueChange={(val) => {
                  setSelectedType(val)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tipe Media" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Tipe Media</SelectItem>
                  {MEDIA_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : mediaList.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 font-display text-base font-bold text-foreground">Tidak Ada Aset Media</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {q || selectedType !== 'ALL' || selectedItem !== 'ALL'
                ? 'Tidak ada media yang cocok dengan filter pencarian.'
                : 'Belum ada aset media mandiri yang didaftarkan. Klik tombol "Tambah Media" untuk mulai menambahkan.'}
            </p>
            {canEdit && (
              <Button onClick={openCreateDialog} variant="outline" size="sm" className="mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Tambah Media Baru
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mediaList.map((m) => {
            const isImg = m.type === 'IMAGE'
            const isAud = m.type === 'AUDIO'
            const is3D = m.type === 'MODEL_3D'

            return (
              <Card key={m.id} className="group overflow-hidden border shadow-sm transition hover:shadow-md">
                <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
                  {isImg ? (
                    <img
                      src={m.url}
                      alt={m.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src = '/images/rumah-adat.png'
                      }}
                    />
                  ) : isAud ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-teal-50/50 p-4 text-center dark:from-stone-800 dark:to-stone-900">
                      <Music className="h-10 w-10 text-brand-teal" />
                      <span className="mt-2 text-xs font-semibold text-foreground">Berkas Audio / Suara</span>
                      <audio controls className="mt-2 h-7 w-full max-w-[200px]" src={m.url}>
                        Browser tidak mendukung audio.
                      </audio>
                    </div>
                  ) : is3D ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50/50 p-4 text-center dark:from-stone-800 dark:to-stone-900">
                      <Box className="h-10 w-10 text-brand-ocean" />
                      <span className="mt-2 text-xs font-semibold text-foreground">Model 3D Interaktif</span>
                      <span className="mt-0.5 text-[11px] text-muted-foreground">{m.url}</span>
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4 text-center">
                      <Film className="h-10 w-10 text-muted-foreground" />
                      <span className="mt-2 text-xs font-semibold">Video Budaya</span>
                    </div>
                  )}

                  <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="gap-1 bg-white/90 text-xs font-medium text-foreground shadow-sm backdrop-blur dark:bg-stone-900/90">
                      {isImg && <ImageIcon className="h-3 w-3 text-brand-teal" />}
                      {isAud && <Music className="h-3 w-3 text-brand-orange" />}
                      {is3D && <Box className="h-3 w-3 text-brand-ocean" />}
                      {m.type}
                    </Badge>
                    {m.isFeatured && (
                      <Badge className="gap-1 bg-brand-gold text-stone-900 shadow-sm">
                        <Sparkles className="h-3 w-3" /> Utama
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  <h4 className="font-display text-base font-bold text-foreground line-clamp-1">{m.title}</h4>
                  {m.culturalItem && (
                    <p className="mt-0.5 text-xs text-brand-teal font-medium">
                      Objek: {m.culturalItem.name}
                    </p>
                  )}
                  {m.caption && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{m.caption}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-2.5 text-[11px] text-muted-foreground">
                    {m.license && (
                      <Badge variant="outline" className="border-border text-[10px]">
                        {m.license}
                      </Badge>
                    )}
                    {m.creator && <span>Oleh {m.creator}</span>}
                    {m.sourceUrl && (
                      <a
                        href={m.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-0.5 text-primary hover:underline"
                      >
                        Sumber <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>

                  {canEdit && (
                    <div className="mt-3 flex items-center justify-end gap-1.5 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(m)}
                        className="h-8 gap-1 text-xs hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Menampilkan halaman {meta.page} dari {meta.totalPages} ({meta.total} total media)
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
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingMedia ? 'Edit Aset Media' : 'Tambah Aset Media'}
            </DialogTitle>
            <DialogDescription>
              Lengkapi metadata aset, tautan berkas, atribusi hak cipta, dan relasi objek budaya.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {formError}
              </p>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="media-title">Judul Aset *</Label>
              <Input
                id="media-title"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Contoh: Ilustrasi Rumah Gadang Minangkabau"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="media-type">Tipe Media *</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as MediaType)}>
                  <SelectTrigger id="media-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="media-item">Objek Budaya Terkait</Label>
                <Select value={formItemId} onValueChange={setFormItemId}>
                  <SelectTrigger id="media-item">
                    <SelectValue placeholder="Pilih objek (opsional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="">-- Tanpa Objek --</SelectItem>
                    {culturalItems.map((it) => (
                      <SelectItem key={it.id} value={it.id}>
                        {it.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="media-url">URL / Path Berkas *</Label>
              <Input
                id="media-url"
                required
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="/images/rumah-adat.png atau https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="media-license">Lisensi / Izin</Label>
                <Input
                  id="media-license"
                  value={formLicense}
                  onChange={(e) => setFormLicense(e.target.value)}
                  placeholder="CC BY-SA / Domain Publik"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="media-creator">Pencipta / Kontributor</Label>
                <Input
                  id="media-creator"
                  value={formCreator}
                  onChange={(e) => setFormCreator(e.target.value)}
                  placeholder="Nama pembuat karya"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="media-source">Tautan Sumber Asli</Label>
              <Input
                id="media-source"
                value={formSourceUrl}
                onChange={(e) => setFormSourceUrl(e.target.value)}
                placeholder="https://commons.wikimedia.org/..."
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="media-caption">Keterangan / Kepsyen</Label>
              <Textarea
                id="media-caption"
                rows={2}
                value={formCaption}
                onChange={(e) => setFormCaption(e.target.value)}
                placeholder="Deskripsi singkat konteks pengambilan atau visualisasi aset..."
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="media-featured" className="text-xs font-semibold">
                  Jadikan Media Unggulan
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Tampilkan sebagai thumbnail utama pada kartu atau detail.
                </p>
              </div>
              <Switch id="media-featured" checked={formFeatured} onCheckedChange={setFormFeatured} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? 'Menyimpan...' : editingMedia ? 'Simpan Perubahan' : 'Tambah Media'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Aset Media</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus aset media ini? Tindakan ini tidak dapat dibatalkan.
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
              {deleteMut.isPending ? 'Menghapus...' : 'Hapus Media'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
