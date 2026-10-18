"use client";

/**
 * WaraNusa CMS — Kelola Wilayah
 * Tabel + dialog create/edit wilayah (kode ID-XX, kelompok pulau, koordinat).
 * Error 409 hapus (masih dipakai objek) ditampilkan apa adanya dari server.
 */
import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import type { Region } from "@/lib/types";
import { ISLAND_GROUPS } from "@/lib/constants";
import { toast } from "sonner";
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
import { MapPin, Pencil, PlusCircle, Trash2 } from "lucide-react";

const ISLAND_LABELS: Record<string, string> = {
  SUMATERA: "Sumatera",
  JAWA: "Jawa",
  BALI_NUSA_TENGGARA: "Bali & Nusa Tenggara",
  KALIMANTAN: "Kalimantan",
  SULAWESI: "Sulawesi",
  MALUKU_PAPUA: "Maluku & Papua",
};

export function labelIslandGroup(g: string): string {
  return ISLAND_LABELS[g] ?? g;
}

interface FormState {
  code: string;
  name: string;
  islandGroup: string;
  capital: string;
  summary: string;
  description: string;
  lat: string;
  lng: string;
}

const EMPTY: FormState = { code: "ID-", name: "", islandGroup: "", capital: "", summary: "", description: "", lat: "", lng: "" };

export function RegionsView() {
  const user = useAuth((s) => s.user);
  const canManage = !!user && (user.role === "SUPER_ADMIN" || user.role === "EDITOR");

  const listQ = useAsyncData(() => api.admin.regions.list(), []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);

  const rows = listQ.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (r: Region) => {
    setEditing(r);
    setForm({
      code: r.code,
      name: r.name,
      islandGroup: r.islandGroup,
      capital: r.capital ?? "",
      summary: r.summary,
      description: r.description ?? "",
      lat: String(r.lat),
      lng: String(r.lng),
    });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(form.code.trim().toUpperCase()))
      errs.code = "Kode wajib berformat XX-XX (cth. ID-YO, JT-1).";
    if (!form.name.trim()) errs.name = "Nama wilayah wajib diisi.";
    if (!form.islandGroup) errs.islandGroup = "Pilih kelompok pulau.";
    if (!form.summary.trim()) errs.summary = "Ringkasan wajib diisi.";
    if (form.lat === "" || !Number.isFinite(Number(form.lat))) errs.lat = "Lintang (lat) wajib angka.";
    if (form.lng === "" || !Number.isFinite(Number(form.lng))) errs.lng = "Bujur (lng) wajib angka.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) toast.error("Periksa kembali formulir wilayah.");
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      islandGroup: form.islandGroup,
      capital: form.capital.trim() || undefined,
      summary: form.summary.trim(),
      description: form.description.trim() || undefined,
      lat: Number(form.lat),
      lng: Number(form.lng),
    };
    try {
      if (editing) {
        await api.admin.regions.update(editing.id, payload);
        toast.success(`Wilayah “${payload.name}” diperbarui.`);
      } else {
        await api.admin.regions.create(payload);
        toast.success(`Wilayah “${payload.name}” ditambahkan.`);
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

  const doDelete = async (r: Region) => {
    setBusyDeleteId(r.id);
    try {
      await api.admin.regions.delete(r.id);
      toast.success(`Wilayah “${r.name}” dihapus.`);
      await listQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus wilayah.");
    } finally {
      setBusyDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">Wilayah</h1>
          <p className="text-sm text-muted-foreground">Provinsi/daerah asal objek budaya — dipakai peta & katalog.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4" /> Wilayah
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {listQ.error ? (
          <ErrorState message={listQ.error} onRetry={listQ.refetch} className="m-4" />
        ) : listQ.loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={MapPin} title="Belum ada wilayah" message="Tambahkan wilayah pertama untuk memetakan objek budaya." className="border-0 bg-transparent" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">Pulau</TableHead>
                <TableHead className="hidden lg:table-cell">Ibu Kota</TableHead>
                <TableHead className="hidden lg:table-cell">Koordinat</TableHead>
                <TableHead className="text-right">Objek</TableHead>
                {canManage && (
                  <TableHead className="w-28 text-right">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-bold text-brand-teal">{r.code}</TableCell>
                  <TableCell className="font-semibold text-brand-ink">{r.name}</TableCell>
                  <TableCell className="hidden text-sm md:table-cell">{labelIslandGroup(r.islandGroup)}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{r.capital || "-"}</TableCell>
                  <TableCell className="hidden text-xs tabular-nums text-muted-foreground lg:table-cell">
                    {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tabular-nums">{r.itemCount ?? 0}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)} aria-label={`Edit wilayah ${r.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Hapus wilayah ${r.name}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Hapus wilayah?"
                          description={`Wilayah “${r.name}” (${r.code}) akan dihapus. Jika masih dipakai objek budaya, server akan menolak.`}
                          confirmLabel="Ya, hapus"
                          destructive
                          loading={busyDeleteId === r.id}
                          onConfirm={() => void doDelete(r)}
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
      <p className="text-xs text-muted-foreground">Total {rows.length} wilayah.</p>

      {/* Dialog create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Wilayah — ${editing.name}` : "Wilayah Baru"}</DialogTitle>
            <DialogDescription>Wilayah menjadi dasar penanda peta dan pengelompokan katalog.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="r-code">
                  Kode <span className="text-destructive">*</span>
                </Label>
                <Input id="r-code" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="ID-YO" maxLength={6} className="font-mono" aria-required="true" aria-invalid={!!fieldErrors.code} />
                {fieldErrors.code && <p className="text-xs font-medium text-destructive">{fieldErrors.code}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-name">
                  Nama Wilayah <span className="text-destructive">*</span>
                </Label>
                <Input id="r-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="cth. Daerah Istimewa Yogyakarta" aria-required="true" aria-invalid={!!fieldErrors.name} />
                {fieldErrors.name && <p className="text-xs font-medium text-destructive">{fieldErrors.name}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="r-island">
                  Kelompok Pulau <span className="text-destructive">*</span>
                </Label>
                <Select value={form.islandGroup || undefined} onValueChange={(v) => set("islandGroup", v)}>
                  <SelectTrigger id="r-island" className="w-full" aria-required="true">
                    <SelectValue placeholder="Pilih kelompok pulau" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISLAND_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {labelIslandGroup(g)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.islandGroup && <p className="text-xs font-medium text-destructive">{fieldErrors.islandGroup}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-capital">Ibu Kota</Label>
                <Input id="r-capital" value={form.capital} onChange={(e) => set("capital", e.target.value)} placeholder="cth. Yogyakarta" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-summary">
                Ringkasan <span className="text-destructive">*</span>
              </Label>
              <Textarea id="r-summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={2} placeholder="Ikhtisar singkat wilayah…" aria-required="true" aria-invalid={!!fieldErrors.summary} />
              {fieldErrors.summary && <p className="text-xs font-medium text-destructive">{fieldErrors.summary}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-desc">Deskripsi Lengkap</Label>
              <Textarea id="r-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Sejarah dan kekhasan budaya wilayah…" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="r-lat">
                  Lintang (lat) <span className="text-destructive">*</span>
                </Label>
                <Input id="r-lat" type="number" step="0.0001" value={form.lat} onChange={(e) => set("lat", e.target.value)} placeholder="-7.7956" className="tabular-nums" aria-required="true" aria-invalid={!!fieldErrors.lat} />
                {fieldErrors.lat && <p className="text-xs font-medium text-destructive">{fieldErrors.lat}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-lng">
                  Bujur (lng) <span className="text-destructive">*</span>
                </Label>
                <Input id="r-lng" type="number" step="0.0001" value={form.lng} onChange={(e) => set("lng", e.target.value)} placeholder="110.3695" className="tabular-nums" aria-required="true" aria-invalid={!!fieldErrors.lng} />
                {fieldErrors.lng && <p className="text-xs font-medium text-destructive">{fieldErrors.lng}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />}
              {editing ? "Simpan Perubahan" : "Tambah Wilayah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
