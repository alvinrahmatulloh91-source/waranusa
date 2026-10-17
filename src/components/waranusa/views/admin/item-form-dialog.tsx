'use client'

/**
 * Dialog Tambah/Edit Objek Budaya untuk panel pengelola.
 * Kolom JSON parts/sounds/melody sengaja tidak diedit di sini — tersimpan apa adanya.
 * Sumber (CulturalSource) dikirim hanya bila diubah (backend mengganti seluruh daftar).
 */
import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  useCreateAdminItem,
  useUpdateAdminItem,
  useAdminCategories,
  useAdminProvinces,
} from '@/hooks/use-admin-data'
import { CATEGORIES } from '@/data/islands'
import { ITEM_STATUSES, type AdminItemRecord, type ItemSource, type ItemStatus } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'

/** Status yang boleh dipilih saat MEMBUAT item baru (sesuai validasi server). */
const CREATE_STATUSES: ItemStatus[] = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED']

interface SourceRow {
  title: string
  url: string
  publisher: string
  year: string
  license: string
  note: string
}

const EMPTY_ROW: SourceRow = { title: '', url: '', publisher: '', year: '', license: '', note: '' }

function toRows(item: AdminItemRecord): SourceRow[] {
  return item.sources.map((s: ItemSource) => ({
    title: s.title ?? '',
    url: s.url ?? '',
    publisher: s.publisher ?? '',
    year: s.year ?? '',
    license: s.license ?? '',
    note: s.note ?? '',
  }))
}

export function ItemFormDialog({
  open,
  item,
  onClose,
}: {
  open: boolean
  /** null = mode tambah; terisi = mode edit. */
  item: AdminItemRecord | null
  onClose: () => void
}) {
  const { toast } = useToast()
  const { data: categories } = useAdminCategories()
  const { data: provinces } = useAdminProvinces()
  const createMut = useCreateAdminItem()
  const updateMut = useUpdateAdminItem()
  const isEdit = !!item

  // State diinisialisasi dari item target; komponen di-remount per item
  // lewat prop key pada pemakaian (lihat items-tab) sehingga form selalu segar.
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState(item?.category ?? '')
  const [provinceId, setProvinceId] = useState(item?.provinceId ?? '')
  const [shortDesc, setShortDesc] = useState(item?.shortDesc ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [philosophy, setPhilosophy] = useState(item?.philosophy ?? '')
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? 'DRAFT')
  const [playable, setPlayable] = useState(item?.playable ?? false)
  const [needsReview, setNeedsReview] = useState(item?.needsReview ?? false)
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '')
  const [model3d, setModel3d] = useState(item?.model3d ?? '')
  const [sources, setSources] = useState<SourceRow[]>(() => (item ? toRows(item) : []))
  const [sourcesDirty, setSourcesDirty] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const categoryOptions = useMemo(
    () => (categories && categories.length > 0 ? categories : CATEGORIES.map((c) => ({ key: c.key, label: c.label }))),
    [categories],
  )
  const statusOptions = isEdit ? ITEM_STATUSES : CREATE_STATUSES
  const pending = createMut.isPending || updateMut.isPending

  if (!open) return null

  const validate = (): string | null => {
    if (name.trim().length < 3 || name.trim().length > 120) return 'Nama objek harus 3-120 karakter.'
    if (!category) return 'Kategori wajib dipilih.'
    if (!provinceId) return 'Provinsi wajib dipilih.'
    const sd = shortDesc.trim()
    if (sd.length < 10 || sd.length > 200) return 'Ringkasan harus 10-200 karakter.'
    if (description.trim().length < 20) return 'Deskripsi lengkap minimal 20 karakter.'
    if (!isEdit && !philosophy.trim()) return 'Filosofi wajib diisi saat membuat objek baru.'
    for (const s of sources) {
      const hasContent = s.title.trim() || s.url.trim() || s.publisher.trim() || s.year.trim() || s.note.trim()
      if (hasContent && !s.title.trim()) return 'Setiap sumber harus memiliki judul.'
    }
    return null
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      setFormError(err)
      return
    }
    setFormError(null)

    const cleanSources = sources
      .filter((s) => s.title.trim() || s.url.trim() || s.publisher.trim() || s.year.trim() || s.note.trim())
      .map((s) => ({
        title: s.title.trim(),
        url: s.url.trim() || null,
        publisher: s.publisher.trim() || null,
        year: s.year.trim() || null,
        license: s.license.trim() || null,
        note: s.note.trim() || null,
      }))

    const base = {
      name: name.trim(),
      category,
      provinceId,
      shortDesc: shortDesc.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      model3d: model3d.trim(),
      playable,
      needsReview,
      status,
    }

    const onFail = (e2: Error) => {
      setFormError(e2.message)
      toast({ title: 'Gagal menyimpan objek', description: e2.message, variant: 'destructive' })
    }

    if (isEdit && item) {
      // Filosofi dikirim hanya bila terisi (server menolak string kosong pada PATCH).
      const philosophyTrim = philosophy.trim()
      updateMut.mutate(
        {
          id: item.id,
          ...base,
          ...(philosophyTrim ? { philosophy: philosophyTrim } : {}),
          ...(sourcesDirty ? { sources: cleanSources } : {}),
        },
        {
          onSuccess: () => {
            toast({ title: 'Perubahan tersimpan', description: `Objek "${base.name}" berhasil diperbarui.` })
            onClose()
          },
          onError: onFail,
        },
      )
    } else {
      createMut.mutate(
        { ...base, philosophy: philosophy.trim(), sources: cleanSources },
        {
          onSuccess: () => {
            toast({ title: 'Objek budaya dibuat', description: `Objek "${base.name}" berhasil ditambahkan.` })
            onClose()
          },
          onError: onFail,
        },
      )
    }
  }

  const updateSource = (i: number, key: keyof SourceRow, value: string) => {
    setSources((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))
    setSourcesDirty(true)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle className="font-display text-xl">
            {isEdit ? 'Edit Objek Budaya' : 'Tambah Objek Budaya'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui informasi objek. Bagian 3D dan padatan suara tetap tersimpan.'
              : 'Lengkapi data objek budaya baru sebelum dipublikasikan ke arsip.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="wn-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
            {formError && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {formError}
              </p>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="it-name">Nama objek</Label>
              <Input
                id="it-name"
                required
                minLength={3}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Joglo Sinom"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="it-category">Kategori</Label>
                <Select value={category || undefined} onValueChange={setCategory}>
                  <SelectTrigger id="it-category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="it-province">Provinsi</Label>
                <Select value={provinceId || undefined} onValueChange={setProvinceId}>
                  <SelectTrigger id="it-province">
                    <SelectValue placeholder="Pilih provinsi" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {(provinces ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="it-shortdesc">Ringkasan</Label>
                <span className={`text-[11px] ${shortDesc.length > 200 ? 'font-bold text-destructive' : 'text-muted-foreground'}`}>
                  {shortDesc.length}/200
                </span>
              </div>
              <Textarea
                id="it-shortdesc"
                rows={2}
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Satu-dua kalimat yang tampil di kartu objek (10-200 karakter)."
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="it-desc">Deskripsi lengkap</Label>
              <Textarea
                id="it-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan asal-usul, ciri khas, dan konteks budaya objek (minimal 20 karakter)."
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="it-phil">Filosofi</Label>
              <Textarea
                id="it-phil"
                rows={3}
                value={philosophy}
                onChange={(e) => setPhilosophy(e.target.value)}
                placeholder="Makna simbolis, nilai, dan pandangan hidup yang terkandung dalam objek."
              />
              <p className="text-[11px] text-muted-foreground">Isi bila didukung sumber.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="it-status">Status publikasi</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ItemStatus)}>
                  <SelectTrigger id="it-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === 'DRAFT'
                          ? 'Draft'
                          : s === 'PENDING_REVIEW'
                            ? 'Menunggu Tinjauan'
                            : s === 'PUBLISHED'
                              ? 'Terpublikasi'
                              : s === 'REJECTED'
                                ? 'Ditolak'
                                : 'Diarsipkan'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isEdit && <p className="text-[11px] text-muted-foreground">Objek baru hanya dapat dibuat sebagai Draft, Menunggu Tinjauan, atau Terpublikasi.</p>}
              </div>
              <div className="flex flex-col justify-center gap-3 rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="it-playable" className="text-xs font-medium">
                    Bisa dimainkan
                  </Label>
                  <Switch id="it-playable" checked={playable} onCheckedChange={setPlayable} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="it-review" className="text-xs font-medium">
                    Perlu peninjauan sumber
                  </Label>
                  <Switch id="it-review" checked={needsReview} onCheckedChange={setNeedsReview} />
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="it-image">URL gambar</Label>
              <Input
                id="it-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="/images/rumah-adat.png"
              />
              {imageUrl.trim() !== '' && (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={imageUrl.trim()}
                    alt={`Pratinjau ilustrasi ${name || 'objek'}`}
                    className="h-28 w-full object-cover"
                  />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Kosongkan untuk memakai ilustrasi kategori (atribusi AI otomatis).
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="it-model">Model 3D</Label>
              <Input
                id="it-model"
                value={model3d}
                onChange={(e) => setModel3d(e.target.value)}
                placeholder="rumah:joglo"
              />
              <p className="text-[11px] text-muted-foreground">Kunci model prosedural, mis. rumah:joglo atau saron.</p>
            </div>

            {/* Editor sumber dinamis */}
            <div className="grid gap-2">
              <Label>Sumber / Referensi</Label>
              {sources.length === 0 && (
                <p className="rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground">
                  Belum ada sumber. Tambahkan referensi agar arsip mudah diverifikasi kurator.
                </p>
              )}
              {sources.map((row, i) => (
                <div key={i} className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Sumber {i + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        setSources((rows) => rows.filter((_, idx) => idx !== i))
                        setSourcesDirty(true)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </Button>
                  </div>
                  <Input
                    value={row.title}
                    onChange={(e) => updateSource(i, 'title', e.target.value)}
                    placeholder="Judul sumber (wajib)"
                  />
                  <Input
                    value={row.url}
                    onChange={(e) => updateSource(i, 'url', e.target.value)}
                    placeholder="URL (opsional)"
                  />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input value={row.publisher} onChange={(e) => updateSource(i, 'publisher', e.target.value)} placeholder="Penerbit" />
                    <Input value={row.year} onChange={(e) => updateSource(i, 'year', e.target.value)} placeholder="Tahun" />
                    <Input value={row.license} onChange={(e) => updateSource(i, 'license', e.target.value)} placeholder="Lisensi" />
                  </div>
                  <Input value={row.note} onChange={(e) => updateSource(i, 'note', e.target.value)} placeholder="Catatan (opsional)" />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                onClick={() => {
                  setSources((rows) => [...rows, { ...EMPTY_ROW }])
                  setSourcesDirty(true)
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Sumber
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-4 shrink-0 gap-2 border-t pt-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending} className="min-w-32">
              {pending ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Buat Objek'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
