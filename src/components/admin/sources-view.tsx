"use client";

/**
 * WaraNusa CMS — Sumber & Atribusi
 * Daftar global sumber (buku, jurnal, situs, museum, arsip) dengan pencarian,
 * filter tipe, form create/edit, dan hapus. Item terkait tertaut ke halaman publik.
 */
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import type { Source } from "@/lib/types";
import { SOURCE_TYPES, labelSourceType, type SourceType } from "@/lib/constants";
import { toast } from "sonner";
import { fmtDateID } from "./media-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { BookMarked, ExternalLink, Pencil, PlusCircle, Search, Trash2 } from "lucide-react";

const SOURCE_BADGE: Record<SourceType, string> = {
  BOOK: "bg-brand-sea/10 text-brand-sea border-brand-sea/30",
  JOURNAL: "bg-brand-tropic/10 text-brand-tropic border-brand-tropic/30",
  WEBSITE: "bg-brand-teal/10 text-brand-teal border-brand-teal/30",
  MUSEUM: "bg-brand-gold/20 text-brand-orange border-brand-gold/40",
  ARCHIVE: "bg-stone-100 text-stone-600 border-stone-200",
  OTHER: "bg-secondary text-muted-foreground border-border",
};

interface FormState {
  itemId: string; // "" = tanpa item
  title: string;
  creator: string;
  url: string;
  sourceType: SourceType;
  accessDate: string;
  attribution: string;
  license: string;
  verificationNote: string;
}

const EMPTY: FormState = {
  itemId: "",
  title: "",
  creator: "",
  url: "",
  sourceType: "WEBSITE",
  accessDate: "",
  attribution: "",
  license: "",
  verificationNote: "",
};

export function SourcesView() {
  const user = useAuth((s) => s.user);
  const canManage = !!user && (user.role === "SUPER_ADMIN" || user.role === "EDITOR");

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [type, setType] = useState<string>("ALL");
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const listQ = useAsyncData(() => api.admin.sources.list({ search: debounced || undefined, type: type === "ALL" ? undefined : type }), [debounced, type]);
  const itemsQ = useAsyncData(() => api.admin.items.list({ pageSize: 48, sort: "title" }), []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);

  const rows = listQ.data ?? [];
  const itemMap = new Map((itemsQ.data ?? []).map((i) => [i.id, i]));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (s: Source) => {
    setEditing(s);
    setForm({
      itemId: s.itemId ?? "",
      title: s.title,
      creator: s.creator ?? "",
      url: s.url ?? "",
      sourceType: s.sourceType,
      accessDate: s.accessDate ? s.accessDate.slice(0, 10) : "",
      attribution: s.attribution ?? "",
      license: s.license ?? "",
      verificationNote: s.verificationNote ?? "",
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Judul sumber wajib diisi.";
    if (form.url && !/^https?:\/\//i.test(form.url.trim())) errs.url = "URL harus dimulai http:// atau https://.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Periksa kembali formulir sumber.");
      return;
    }
    setSaving(true);
    const payload = {
      itemId: form.itemId || null,
      title: form.title.trim(),
      creator: form.creator.trim() || null,
      url: form.url.trim() || null,
      sourceType: form.sourceType,
      accessDate: form.accessDate || null,
      attribution: form.attribution.trim() || null,
      license: form.license.trim() || null,
      verificationNote: form.verificationNote.trim() || null,
    };
    try {
      if (editing) {
        await api.admin.sources.update(editing.id, payload);
        toast.success(`Sumber “${payload.title}” diperbarui.`);
      } else {
        await api.admin.sources.create(payload);
        toast.success(`Sumber “${payload.title}” ditambahkan.`);
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

  const doDelete = async (s: Source) => {
    setBusyDeleteId(s.id);
    try {
      await api.admin.sources.delete(s.id);
      toast.success(`Sumber “${s.title}” dihapus.`);
      await listQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus sumber.");
    } finally {
      setBusyDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">Sumber & Atribusi</h1>
          <p className="text-sm text-muted-foreground">Referensi keilmuan yang memperkuat kredibilitas konten budaya.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Sumber
          </Button>
        )}
      </div>

      {/* Filter */}
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul/creator sumber…" className="pl-9" aria-label="Cari sumber" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger aria-label="Filter tipe sumber" className="w-full">
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              {SOURCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {labelSourceType(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabel */}
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
          <EmptyState
            icon={BookMarked}
            title={debounced || type !== "ALL" ? "Tidak ada sumber cocok" : "Belum ada sumber"}
            message={debounced || type !== "ALL" ? "Coba ubah kata kunci atau tipe sumber." : "Tambahkan referensi pertama untuk memperkuat konten."}
            className="border-0 bg-transparent"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead className="hidden md:table-cell">Creator</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="hidden lg:table-cell">Item Terkait</TableHead>
                <TableHead className="hidden xl:table-cell">URL</TableHead>
                <TableHead className="hidden sm:table-cell">Akses</TableHead>
                <TableHead className="hidden xl:table-cell">Verifikasi</TableHead>
                {canManage && (
                  <TableHead className="w-28 text-right">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const linked = s.itemId ? itemMap.get(s.itemId) : undefined;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="max-w-52">
                      <p className="truncate font-semibold text-brand-ink" title={s.title}>
                        {s.title}
                      </p>
                      {s.license && <p className="truncate text-[11px] text-muted-foreground">{s.license}</p>}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{s.creator || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] font-semibold ${SOURCE_BADGE[s.sourceType] ?? ""}`}>
                        {labelSourceType(s.sourceType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {linked ? (
                        <a href={`#/budaya/${linked.slug}`} target="_blank" rel="noreferrer" className="inline-flex max-w-44 items-center gap-1 truncate text-xs font-semibold text-brand-teal hover:underline" title={linked.title}>
                          {linked.title} <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-44 xl:table-cell">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate text-xs text-brand-teal hover:underline" title={s.url}>
                          {s.url.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground sm:table-cell">{fmtDateID(s.accessDate)}</TableCell>
                    <TableCell className="hidden max-w-44 truncate text-xs text-muted-foreground xl:table-cell" title={s.verificationNote ?? ""}>
                      {s.verificationNote || "-"}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)} aria-label={`Edit sumber ${s.title}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Hapus sumber ${s.title}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                            title="Hapus sumber?"
                            description={`Sumber “${s.title}” akan dihapus permanen dari katalog referensi.`}
                            confirmLabel="Ya, hapus"
                            destructive
                            loading={busyDeleteId === s.id}
                            onConfirm={() => void doDelete(s)}
                          />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">Total {rows.length} sumber.</p>

      {/* Dialog create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Sumber — ${editing.title}` : "Sumber Baru"}</DialogTitle>
            <DialogDescription>Catat referensi secara lengkap untuk atribusi & verifikasi.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="so-item">Objek Budaya Terkait (opsional)</Label>
              <Select value={form.itemId || "NONE"} onValueChange={(v) => set("itemId", v === "NONE" ? "" : v)}>
                <SelectTrigger id="so-item" className="w-full">
                  <SelectValue placeholder="Tidak terkait item" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— Tidak terkait item —</SelectItem>
                  {(itemsQ.data ?? []).map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="so-title">
                Judul <span className="text-destructive">*</span>
              </Label>
              <Input id="so-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="cth. Ensikologi Budaya Nusantara" aria-required="true" aria-invalid={!!fieldErrors.title} />
              {fieldErrors.title && <p className="text-xs font-medium text-destructive">{fieldErrors.title}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="so-creator">Creator / Penulis</Label>
                <Input id="so-creator" value={form.creator} onChange={(e) => set("creator", e.target.value)} placeholder="cth. Tim WaraNusa" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="so-type">Tipe Sumber</Label>
                <Select value={form.sourceType} onValueChange={(v) => set("sourceType", v)}>
                  <SelectTrigger id="so-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {labelSourceType(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="so-url">URL</Label>
              <Input id="so-url" type="url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" aria-invalid={!!fieldErrors.url} />
              {fieldErrors.url && <p className="text-xs font-medium text-destructive">{fieldErrors.url}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="so-attr">Atribusi</Label>
                <Input id="so-attr" value={form.attribution} onChange={(e) => set("attribution", e.target.value)} placeholder="cth. Dokumentasi Museum Nasional" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="so-license">Lisensi</Label>
                <Input id="so-license" value={form.license} onChange={(e) => set("license", e.target.value)} placeholder="cth. CC BY-SA 4.0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="so-date">Tanggal Akses</Label>
              <Input id="so-date" type="date" value={form.accessDate} onChange={(e) => set("accessDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="so-note">Catatan Verifikasi</Label>
              <Textarea id="so-note" value={form.verificationNote} onChange={(e) => set("verificationNote", e.target.value)} rows={2} placeholder="cth. Diverifikasi editor — informasi cocok dengan 2 sumber lain" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />}
              {editing ? "Simpan Perubahan" : "Tambah Sumber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
