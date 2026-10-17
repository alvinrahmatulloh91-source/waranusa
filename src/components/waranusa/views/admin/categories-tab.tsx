'use client'

/**
 * Tab Kategori — kelola metadata kategori budaya (label, deskripsi, ikon,
 * gambar). Key bersifat permanen: server menolak perubahan key.
 */
import { useEffect, useState } from 'react'
import {
  useAdminCategories,
  useCreateAdminCategory,
  useUpdateAdminCategory,
} from '@/hooks/use-admin-data'
import { useToast } from '@/hooks/use-toast'
import { canManageContent, AdminErrorPanel, AdminEmpty, TableSkeleton } from './shared'
import type { CategoryMeta, UserRole } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
import { Pencil, Plus, Shapes } from 'lucide-react'

interface CategoryFormState {
  key: string
  label: string
  description: string
  icon: string
  image: string
}

const EMPTY_FORM: CategoryFormState = { key: '', label: '', description: '', icon: '', image: '' }

export function CategoriesTab({ role }: { role: UserRole }) {
  const canWrite = canManageContent(role)
  const { toast } = useToast()
  const { data: categories, isLoading, isError, error, refetch } = useAdminCategories()
  const createMut = useCreateAdminCategory()
  const updateMut = useUpdateAdminCategory()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryMeta | null>(null)
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (c: CategoryMeta) => {
    setEditing(c)
    setForm({ key: c.key, label: c.label, description: c.description, icon: c.icon, image: c.image })
    setFormError(null)
    setDialogOpen(true)
  }

  const set = (key: keyof CategoryFormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validate = (): string | null => {
    const key = form.key.trim()
    if (!editing) {
      if (!/^[A-Z][A-Z0-9_]{2,29}$/.test(key))
        return 'Key harus 3-30 karakter: huruf besar/angka/underscore, diawali huruf (contoh: SENI_PERTUKAN).'
    }
    if (form.label.trim().length < 3 || form.label.trim().length > 40) return 'Label kategori harus 3-40 karakter.'
    if (!form.description.trim()) return 'Deskripsi kategori wajib diisi.'
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
    const onFail = (e2: Error) => {
      setFormError(e2.message)
      toast({ title: 'Gagal menyimpan kategori', description: e2.message, variant: 'destructive' })
    }
    if (editing) {
      updateMut.mutate(
        {
          id: editing.id,
          label: form.label.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || 'Shapes',
          image: form.image.trim() || '/images/arsip-banner.png',
        },
        {
          onSuccess: () => {
            toast({ title: 'Kategori diperbarui', description: `"${form.label.trim()}" berhasil disimpan.` })
            setDialogOpen(false)
          },
          onError: onFail,
        },
      )
    } else {
      createMut.mutate(
        {
          key: form.key.trim(),
          label: form.label.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || undefined,
          image: form.image.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast({ title: 'Kategori dibuat', description: `"${form.label.trim()}" berhasil ditambahkan.` })
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
          {categories ? `${categories.length} kategori terdaftar` : 'Memuat kategori…'}
        </p>
        {canWrite && (
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Kategori
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-xl border p-4">
          <TableSkeleton rows={5} />
        </div>
      ) : isError ? (
        <AdminErrorPanel
          message={error instanceof Error ? error.message : 'Coba lagi nanti.'}
          onRetry={() => void refetch()}
        />
      ) : (categories?.length ?? 0) === 0 ? (
        <AdminEmpty message="Belum ada kategori" hint="Buat kategori untuk mengelompokkan objek budaya." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="min-w-36">Key</TableHead>
                <TableHead className="min-w-40">Label</TableHead>
                <TableHead className="min-w-56">Deskripsi</TableHead>
                <TableHead className="text-right">Objek Terpublikasi</TableHead>
                {canWrite && <TableHead className="w-20 text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-semibold text-brand-teal">{c.key}</TableCell>
                  <TableCell className="font-medium text-foreground">{c.label}</TableCell>
                  <TableCell className="max-w-72 truncate text-sm text-muted-foreground">{c.description}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{c.itemCount ?? 0}</TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => openEdit(c)}
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

      {/* Dialog tambah/edit kategori */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? 'Edit Kategori' : 'Tambah Kategori'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Key tidak dapat diubah — hanya label, deskripsi, ikon, dan gambar yang dapat diperbarui.'
                : 'Key digunakan sistem sebagai identitas kategori dan tidak dapat diubah setelah dibuat.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-4">
            {formError && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {formError}
              </p>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="ct-key">Key</Label>
              <Input
                id="ct-key"
                required
                value={form.key}
                onChange={(e) => set('key', e.target.value.toUpperCase())}
                disabled={!!editing}
                placeholder="SENI_PERTUKAN"
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">Format HURUF_BESAR dengan garis bawah, 3-30 karakter.</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="ct-label">Label</Label>
              <Input
                id="ct-label"
                required
                minLength={3}
                maxLength={40}
                value={form.label}
                onChange={(e) => set('label', e.target.value)}
                placeholder="Seni Pertukangan"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="ct-desc">Deskripsi</Label>
              <Textarea
                id="ct-desc"
                rows={2}
                required
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Jelaskan cakupan kategori ini."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="ct-icon">Ikon</Label>
                <Input
                  id="ct-icon"
                  value={form.icon}
                  onChange={(e) => set('icon', e.target.value)}
                  placeholder="Shapes"
                />
                <p className="text-[11px] text-muted-foreground">Nama ikon lucide, mis. Home.</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ct-image">Gambar</Label>
                <Input
                  id="ct-image"
                  value={form.image}
                  onChange={(e) => set('image', e.target.value)}
                  placeholder="/images/arsip-banner.png"
                />
                <p className="text-[11px] text-muted-foreground">Jalur gambar ilustrasi kategori.</p>
              </div>
            </div>

            <DialogFooter className="gap-2 border-t pt-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>
                Batal
              </Button>
              <Button type="submit" disabled={pending} className="min-w-32">
                {pending ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Buat Kategori'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Shapes className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-teal" />
        Kategori dipakai lintas platform: filter arsip, formulir kontribusi, dan pengelompokan halaman provinsi.
      </p>
    </div>
  )
}
