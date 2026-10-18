"use client";

/**
 * WaraNusa CMS — Kelola Kategori
 * Tabel + dialog create/edit (slug otomatis dari nama, ikon lucide, urutan tampil).
 */
import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import type { Category } from "@/lib/types";
import { toast } from "sonner";
import { slugify } from "./media-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/states";
import {
  BookOpen,
  Drama,
  Landmark,
  Music,
  Palette,
  Pencil,
  PlusCircle,
  Shapes,
  Shirt,
  Theater,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const ICON_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "landmark", label: "Landmark & Bangunan", icon: Landmark },
  { value: "shirt", label: "Pakaian & Tekstil", icon: Shirt },
  { value: "music", label: "Musik & Alat Musik", icon: Music },
  { value: "drama", label: "Seni Pertunjukan", icon: Drama },
  { value: "utensils-crossed", label: "Kuliner", icon: UtensilsCrossed },
  { value: "book-open", label: "Sastra & Naskah", icon: BookOpen },
  { value: "palette", label: "Seni Rupa & Kriya", icon: Palette },
  { value: "theater", label: "Teater & Ritual", icon: Theater },
];

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const found = ICON_OPTIONS.find((o) => o.value === name);
  const Icon = found?.icon ?? Shapes;
  return <Icon className={className} aria-hidden />;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: string;
}

const EMPTY: FormState = { name: "", slug: "", description: "", icon: "landmark", sortOrder: "0" };

export function CategoriesView() {
  const user = useAuth((s) => s.user);
  const canManage = !!user && (user.role === "SUPER_ADMIN" || user.role === "EDITOR");

  const listQ = useAsyncData(() => api.admin.categories.list(), []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);

  const rows = listQ.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setSlugTouched(false);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? "", icon: c.icon ?? "landmark", sortOrder: "0" });
    setSlugTouched(true);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nama kategori wajib diisi.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Periksa kembali formulir kategori.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      icon: form.icon || undefined,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editing) {
        await api.admin.categories.update(editing.id, payload);
        toast.success(`Kategori “${payload.name}” diperbarui.`);
      } else {
        await api.admin.categories.create(payload);
        toast.success(`Kategori “${payload.name}” ditambahkan.`);
      }
      setDialogOpen(false);
      await listQ.refetch();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.fields) setFieldErrors(e.fields);
        toast.error(e.message);
      } else {
        toast.error("Terjadi kesalahan tak terduga.");
      }
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (c: Category) => {
    setBusyDeleteId(c.id);
    try {
      await api.admin.categories.delete(c.id);
      toast.success(`Kategori “${c.name}” dihapus.`);
      await listQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus kategori.");
    } finally {
      setBusyDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">Kategori</h1>
          <p className="text-sm text-muted-foreground">Pengelompokan objek budaya untuk katalog & filter jelajah.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Kategori
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {listQ.error ? (
          <ErrorState message={listQ.error} onRetry={listQ.refetch} className="m-4" />
        ) : listQ.loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Shapes} title="Belum ada kategori" message="Buat kategori pertama untuk mengelompokkan objek budaya." className="border-0 bg-transparent" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden font-mono sm:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Deskripsi</TableHead>
                <TableHead className="text-right">Objek</TableHead>
                {canManage && (
                  <TableHead className="w-28 text-right">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="flex items-center gap-2.5 font-semibold text-brand-ink">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
                        <CategoryIcon name={c.icon} className="h-4 w-4" />
                      </span>
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">{c.slug}</TableCell>
                  <TableCell className="hidden max-w-72 truncate text-sm text-muted-foreground md:table-cell" title={c.description ?? ""}>
                    {c.description || "-"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums">{c.itemCount ?? 0}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)} aria-label={`Edit kategori ${c.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Hapus kategori ${c.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Hapus kategori?"
                          description={`Kategori “${c.name}” akan dihapus. Jika masih dipakai objek budaya, server akan menolak.`}
                          confirmLabel="Ya, hapus"
                          destructive
                          loading={busyDeleteId === c.id}
                          onConfirm={() => void doDelete(c)}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">Total {rows.length} kategori.</p>

      {/* Dialog create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Kategori — ${editing.name}` : "Kategori Baru"}</DialogTitle>
            <DialogDescription>Slug dibuat otomatis dari nama dan dapat disesuaikan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">
                Nama <span className="text-destructive">*</span>
              </Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({ ...f, name: v, slug: !slugTouched ? slugify(v) : f.slug }));
                  setFieldErrors((er) => ({ ...er, name: "" }));
                }}
                placeholder="cth. Alat Musik Tradisional"
                aria-required="true"
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && <p className="text-xs font-medium text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-slug">Slug</Label>
              <Input
                id="c-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
                onBlur={() => set("slug", slugify(form.slug))}
                placeholder="alat-musik-tradisional"
                className="font-mono text-sm"
              />
              {fieldErrors.slug && <p className="text-xs font-medium text-destructive">{fieldErrors.slug}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Deskripsi</Label>
              <Textarea id="c-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Jelaskan cakupan kategori…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-icon">Ikon</Label>
                <Select value={form.icon} onValueChange={(v) => set("icon", v)}>
                  <SelectTrigger id="c-icon" className="w-full">
                    <span className="flex items-center gap-2">
                      <CategoryIcon name={form.icon} className="h-4 w-4 text-brand-teal" />
                      <SelectValue />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="flex items-center gap-2">
                          <o.icon className="h-4 w-4 text-brand-teal" aria-hidden />
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-sort">Urutan Tampil</Label>
                <Input id="c-sort" type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className="tabular-nums" />
                <p className="text-xs text-muted-foreground">Angka kecil tampil lebih dulu.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />}
              {editing ? "Simpan Perubahan" : "Tambah Kategori"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
