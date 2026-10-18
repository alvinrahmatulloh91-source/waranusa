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
import { Badge } from '@/components/ui/badge'
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

function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

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

function PreviewSection({ title, value }: { title: string; value: string }) {
  return (
    <div className="border-t pt-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-foreground sm:text-sm">{value}</p>
    </div>
  )
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
  const [slug, setSlug] = useState(item?.slug ?? slugify(item?.name ?? ''))
  const [slugEdited, setSlugEdited] = useState(!!item?.slug)
  const [category, setCategory] = useState(item?.category ?? '')
  const [provinceId, setProvinceId] = useState(item?.provinceId ?? '')
  const [region, setRegion] = useState(item?.region ?? '')
  const [shortDesc, setShortDesc] = useState(item?.shortDesc ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [history, setHistory] = useState(item?.history ?? '')
  const [culturalFunction, setCulturalFunction] = useState(item?.culturalFunction ?? '')
  const [philosophy, setPhilosophy] = useState(item?.philosophy ?? '')
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? 'DRAFT')
  const [playable, setPlayable] = useState(item?.playable ?? false)
  const [needsReview, setNeedsReview] = useState(item?.needsReview ?? false)
  const [isDemonstration, setIsDemonstration] = useState(item?.isDemonstration ?? false)
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '')
  const [model3d, setModel3d] = useState(item?.model3d ?? '')
  const [sources, setSources] = useState<SourceRow[]>(() => (item ? toRows(item) : []))
  const [sourcesDirty, setSourcesDirty] = useState(false)
  const [activeMode, setActiveMode] = useState<'form' | 'preview'>('form')
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
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 140) return 'Slug wajib berupa huruf kecil, angka, dan tanda hubung.'
    if (!category) return 'Kategori wajib dipilih.'
    if (!provinceId) return 'Provinsi wajib dipilih.'
    const sd = shortDesc.trim()
    if (sd.length < 10 || sd.length > 200) return 'Ringkasan harus 10-200 karakter.'
    if (description.trim().length < 20) return 'Deskripsi lengkap minimal 20 karakter.'
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
      slug: slug.trim(),
      category,
      provinceId,
      region: region.trim() || null,
      shortDesc: shortDesc.trim(),
      description: description.trim(),
      history: history.trim() || null,
      culturalFunction: culturalFunction.trim() || null,
      imageUrl: imageUrl.trim(),
      model3d: model3d.trim(),
      playable,
      needsReview,
      isDemonstration,
      status,
    }

    const onFail = (e2: Error) => {
      setFormError(e2.message)
      toast({ title: 'Gagal menyimpan objek', description: e2.message, variant: 'destructive' })
    }

    if (isEdit && item) {
      // Makna budaya bersifat opsional dan hanya diisi bila didukung rujukan.
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle className="font-display text-xl">
                {isEdit ? 'Edit Objek Budaya' : 'Tambah Objek Budaya'}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? 'Perbarui informasi objek. Bagian 3D dan padatan suara tetap tersimpan.'
                  : 'Lengkapi data objek budaya baru sebelum dipublikasikan ke arsip.'}
              </DialogDescription>
            </div>
            <div className="flex rounded-lg border bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveMode('form')}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  activeMode === 'form'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Formulir
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('preview')}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  activeMode === 'preview'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pratinjau
              </button>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          {activeMode === 'preview' ? (
            <div className="wn-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-1 pr-2">
              <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                <div className="overflow-hidden rounded-xl border bg-muted/40 aspect-video w-full max-h-56">
                  <img
                    src={imageUrl.trim() || '/images/rumah-adat.png'}
                    alt={name || 'Pratinjau'}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src = '/images/rumah-adat.png'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className="bg-primary text-primary-foreground">
                      {categoryOptions.find((c) => c.key === category)?.label ?? (category || 'Kategori')}
                    </Badge>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      {provinces?.find((p) => p.id === provinceId)?.name ?? 'Provinsi'}
                    </Badge>
                    {region && <Badge variant="secondary">{region}</Badge>}
                    <Badge variant="outline" className="text-[11px]">
                      {status}
                    </Badge>
                    {playable && (
                      <Badge className="bg-emerald-600/10 text-emerald-700" variant="outline">
                        Bisa Dimainkan
                      </Badge>
                    )}
                    {needsReview && (
                      <Badge className="border-amber-500/40 bg-amber-50 text-amber-700" variant="outline">
                        Perlu Tinjauan Sumber
                      </Badge>
                    )}
                    {isDemonstration && <Badge variant="secondary">Konten demonstrasi</Badge>}
                  </div>

                  <h3 className="font-display text-2xl font-bold text-foreground">
                    {name || 'Nama Objek Budaya'}
                  </h3>
                  <p className="text-sm italic text-muted-foreground">
                    {shortDesc || 'Ringkasan singkat akan muncul di sini...'}
                  </p>

                  <div className="border-t pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Deskripsi Lengkap
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {description || 'Deskripsi lengkap objek belum diisi...'}
                    </p>
                  </div>

                  {history && <PreviewSection title="Sejarah & Konteks" value={history} />}
                  {culturalFunction && <PreviewSection title="Fungsi Budaya" value={culturalFunction} />}

                  {philosophy && (
                    <div className="rounded-xl border border-brand-gold/40 bg-brand-gold/10 p-3.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Filosofi &amp; Makna Budaya
                      </h4>
                      <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                        {philosophy}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Sumber &amp; Atribusi ({sources.filter((s) => s.title.trim()).length})
                      </h4>
                      {sources.filter((s) => s.title.trim()).length < 2 && (
                        <span className="text-[11px] text-amber-600">
                          (Disarankan minimal 2 sumber referensi)
                        </span>
                      )}
                    </div>
                    {sources.filter((s) => s.title.trim()).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Belum ada sumber referensi.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {sources
                          .filter((s) => s.title.trim())
                          .map((s, idx) => (
                            <li key={idx} className="rounded-lg border bg-muted/20 p-2 text-xs">
                              <span className="font-semibold text-foreground">{s.title}</span>
                              {(s.publisher || s.year) && (
                                <span className="text-muted-foreground">
                                  {' '}• {[s.publisher, s.year].filter(Boolean).join(', ')}
                                </span>
                              )}
                              {s.license && (
                                <span className="ml-1.5 inline-block text-[11px] text-primary">
                                  [{s.license}]
                                </span>
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
                  onChange={(e) => {
                    setName(e.target.value)
                    if (!slugEdited) setSlug(slugify(e.target.value))
                  }}
                  placeholder="Contoh: Joglo Sinom"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
                <div className="grid gap-1.5">
                  <Label htmlFor="it-region">Suku / Komunitas</Label>
                  <Input
                    id="it-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Contoh: Minangkabau"
                  />
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
              <Label htmlFor="it-slug">Slug</Label>
              <Input id="it-slug" required maxLength={140} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase()) }} placeholder="contoh: rumah-gadang" />
              <p className="text-xs text-muted-foreground">Dipakai sebagai identitas URL yang mudah dibaca.</p>
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
              <Label htmlFor="it-history">Sejarah &amp; konteks</Label>
              <Textarea id="it-history" rows={3} maxLength={5000} value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Isi hanya dengan informasi yang memiliki rujukan. Bagian ini boleh dikosongkan bila belum terverifikasi." />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="it-function">Fungsi budaya</Label>
              <Textarea id="it-function" rows={2} maxLength={3000} value={culturalFunction} onChange={(e) => setCulturalFunction(e.target.value)} placeholder="Fungsi atau penggunaan yang didukung sumber (opsional)." />
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
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="it-demo" className="text-xs font-medium">
                    Konten demonstrasi
                  </Label>
                  <Switch id="it-demo" checked={isDemonstration} onCheckedChange={setIsDemonstration} />
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
          )}

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
