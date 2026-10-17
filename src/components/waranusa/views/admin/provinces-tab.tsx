'use client'

/**
 * Tab Wilayah — kelola provinsi: daftar, tambah, dan edit (narasi deskriptif,
 * koordinat peta, gugus pulau). Peran Kurator bersifat baca-saja.
 */
import { useState } from 'react'
import {
  useAdminProvinces,
  useCreateAdminProvince,
  useUpdateAdminProvince,
  type AdminProvinceRecord,
} from '@/hooks/use-admin-data'
import { useToast } from '@/hooks/use-toast'
import { canManageContent, AdminErrorPanel, AdminEmpty, TableSkeleton } from './shared'
import { ISLAND_GROUPS, ISLAND_MAP } from '@/data/islands'
import type { UserRole } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MapPin, Pencil, Plus } from 'lucide-react'

interface ProvinceFormState {
  name: string
  slug: string
  island: string
  capital: string
  lat: string
  lng: string
  motto: string
  description: string
  history: string
  traditions: string
}

const EMPTY_FORM: ProvinceFormState = {
  name: '',
  slug: '',
  island: '',
  capital: '',
  lat: '',
  lng: '',
  motto: '',
  description: '',
  history: '',
  traditions: '',
}

function toForm(p: AdminProvinceRecord): ProvinceFormState {
  return {
    name: p.name,
    slug: p.slug,
    island: p.island,
    capital: p.capital,
    lat: String(p.lat),
    lng: String(p.lng),
    motto: p.motto,
    description: p.description,
    history: p.history,
    traditions: p.traditions,
  }
}

export function ProvincesTab({ role }: { role: UserRole }) {
  const canWrite = canManageContent(role)
  const { toast } = useToast()
  const { data: provinces, isLoading, isError, error, refetch } = useAdminProvinces()
  const createMut = useCreateAdminProvince()
  const updateMut = useUpdateAdminProvince()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminProvinceRecord | null>(null)
  const [form, setForm] = useState<ProvinceFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (p: AdminProvinceRecord) => {
    setEditing(p)
    setForm(toForm(p))
    setFormError(null)
    setDialogOpen(true)
  }

  const set = (key: keyof ProvinceFormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validate = (): string | null => {
    if (form.name.trim().length < 2 || form.name.trim().length > 80) return 'Nama provinsi harus 2-80 karakter.'
    if (!form.island) return 'Gugus pulau wajib dipilih.'
    if (!form.capital.trim()) return 'Ibu kota wajib diisi.'
    const lat = Number(form.lat)
    const lng = Number(form.lng)
    if (!form.lat.trim() || !Number.isFinite(lat) || lat < -90 || lat > 90) return 'Latitude tidak valid (-90..90).'
    if (!form.lng.trim() || !Number.isFinite(lng) || lng < -180 || lng > 180) return 'Longitude tidak valid (-180..180).'
    if (!form.motto.trim() || !form.description.trim() || !form.history.trim() || !form.traditions.trim())
      return 'Motto, deskripsi, sejarah, dan tradisi wajib diisi.'
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
    const payload = {
      name: form.name.trim(),
      island: form.island,
      capital: form.capital.trim(),
      lat: Number(form.lat),
      lng: Number(form.lng),
      motto: form.motto.trim(),
      description: form.description.trim(),
      history: form.history.trim(),
      traditions: form.traditions.trim(),
    }
    const onFail = (e2: Error) => {
      setFormError(e2.message)
      toast({ title: 'Gagal menyimpan provinsi', description: e2.message, variant: 'destructive' })
    }
    if (editing) {
      updateMut.mutate(
        { id: editing.id, ...payload },
        {
          onSuccess: () => {
            toast({ title: 'Provinsi diperbarui', description: `"${payload.name}" berhasil disimpan.` })
            setDialogOpen(false)
          },
          onError: onFail,
        },
      )
    } else {
      createMut.mutate(
        { ...payload, slug: form.slug.trim() || undefined },
        {
          onSuccess: () => {
            toast({ title: 'Provinsi ditambahkan', description: `"${payload.name}" berhasil dibuat.` })
            setDialogOpen(false)
          },
          onError: onFail,
        },
      )
    }
  }

  const pending = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {provinces ? `${provinces.length} provinsi terdaftar` : 'Memuat provinsi…'}
        </p>
        {canWrite && (
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Provinsi
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-xl border p-4">
          <TableSkeleton rows={6} />
        </div>
      ) : isError ? (
        <AdminErrorPanel
          message={error instanceof Error ? error.message : 'Coba lagi nanti.'}
          onRetry={() => void refetch()}
        />
      ) : (provinces?.length ?? 0) === 0 ? (
        <AdminEmpty message="Belum ada provinsi" hint="Tambahkan provinsi pertama untuk memulai." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="min-w-40">Nama</TableHead>
                <TableHead className="min-w-32">Slug</TableHead>
                <TableHead className="min-w-36">Pulau</TableHead>
                <TableHead className="min-w-32">Ibu Kota</TableHead>
                <TableHead className="text-right">Objek</TableHead>
                {canWrite && <TableHead className="w-20 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(provinces ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.slug}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ISLAND_MAP[p.island]?.label ?? p.island}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.capital}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{p.itemCount}</TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog tambah/edit provinsi */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader className="shrink-0 pr-6">
            <DialogTitle className="font-display text-xl">
              {editing ? 'Edit Provinsi' : 'Tambah Provinsi'}
            </DialogTitle>
            <DialogDescription>
              Narasi deskriptif tampil di halaman provinsi; koordinat digunakan peta interaktif.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className="wn-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
              {formError && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {formError}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="pv-name">Nama provinsi</Label>
                  <Input
                    id="pv-name"
                    required
                    minLength={2}
                    maxLength={80}
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Contoh: Jawa Tengah"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pv-slug">Slug URL</Label>
                  <Input
                    id="pv-slug"
                    value={form.slug}
                    onChange={(e) => set('slug', e.target.value)}
                    disabled={!!editing}
                    placeholder="jawa-tengah (kosongkan untuk otomatis)"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {editing ? 'Slug tidak dapat diubah.' : 'Kosongkan untuk dibuat otomatis dari nama.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="pv-island">Gugus pulau</Label>
                  <Select value={form.island || undefined} onValueChange={(v) => set('island', v)}>
                    <SelectTrigger id="pv-island">
                      <SelectValue placeholder="Pilih pulau" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISLAND_GROUPS.map((g) => (
                        <SelectItem key={g.key} value={g.key}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pv-capital">Ibu kota</Label>
                  <Input
                    id="pv-capital"
                    required
                    value={form.capital}
                    onChange={(e) => set('capital', e.target.value)}
                    placeholder="Semarang"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="pv-lat">Lat</Label>
                    <Input
                      id="pv-lat"
                      type="number"
                      step="any"
                      required
                      value={form.lat}
                      onChange={(e) => set('lat', e.target.value)}
                      placeholder="-7.0"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="pv-lng">Lng</Label>
                    <Input
                      id="pv-lng"
                      type="number"
                      step="any"
                      required
                      value={form.lng}
                      onChange={(e) => set('lng', e.target.value)}
                      placeholder="110.0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pv-motto">Motto</Label>
                <Input
                  id="pv-motto"
                  required
                  value={form.motto}
                  onChange={(e) => set('motto', e.target.value)}
                  placeholder="Semboyan daerah"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pv-desc">Deskripsi</Label>
                <Textarea
                  id="pv-desc"
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Gambaran umum provinsi dan kekayaan budayanya."
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pv-history">Sejarah</Label>
                <Textarea
                  id="pv-history"
                  rows={3}
                  required
                  value={form.history}
                  onChange={(e) => set('history', e.target.value)}
                  placeholder="Ringkasan sejarah dan asal-usul budaya daerah."
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pv-trad">Tradisi</Label>
                <Textarea
                  id="pv-trad"
                  rows={3}
                  required
                  value={form.traditions}
                  onChange={(e) => set('traditions', e.target.value)}
                  placeholder="Tradisi, upacara, dan kebiasaan yang masih dilestarikan."
                />
              </div>
            </div>

            <DialogFooter className="mt-4 shrink-0 gap-2 border-t pt-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>
                Batal
              </Button>
              <Button type="submit" disabled={pending} className="min-w-32">
                {pending ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Buat Provinsi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Petunjuk kecil */}
      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-teal" />
        Perubahan wilayah langsung tampil pada peta interaktif dan halaman provinsi publik.
      </p>
    </div>
  )
}
