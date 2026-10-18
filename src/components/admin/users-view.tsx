"use client";

/**
 * WaraNusa CMS — Pengguna (khusus Super Admin)
 * Tabel pengguna + dialog buat/edit (nama, email, peran, status aktif, reset password).
 */
import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import type { User, UserInput } from "@/lib/types";
import { ROLES, labelRole, type Role } from "@/lib/constants";
import { toast } from "sonner";
import { fmtDateID } from "./media-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleBadge } from "@/components/shared/status-badge";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { ShieldAlert, UserCog, UserPlus, Users2 } from "lucide-react";

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
}

const EMPTY_CREATE: FormState = { name: "", email: "", password: "", role: "EDITOR", active: true };

export function UsersView() {
  const me = useAuth((s) => s.user);
  const isSuper = me?.role === "SUPER_ADMIN";

  const listQ = useAsyncData(() => (isSuper ? api.admin.users.list() : Promise.resolve({ data: [] as User[] })), [isSuper]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_CREATE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const rows = listQ.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_CREATE);
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, active: u.active });
    setFieldErrors({});
    setDialogOpen(true);
  };

  const set = (k: keyof FormState, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nama wajib diisi.";
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errs.email = "Email tidak valid.";
    if (!editing && form.password.length < 8) errs.password = "Password minimal 8 karakter.";
    if (editing && form.password && form.password.length < 8) errs.password = "Password baru minimal 8 karakter.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Periksa kembali formulir pengguna.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const payload: Partial<UserInput> = {
          name: form.name.trim(),
          role: form.role,
          active: form.active,
          password: form.password || undefined,
        };
        await api.admin.users.update(editing.id, payload);
        toast.success(`Pengguna “${form.name.trim()}” diperbarui.`);
      } else {
        const payload: UserInput = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          active: true,
        };
        await api.admin.users.create(payload);
        toast.success(`Pengguna “${payload.name}” ditambahkan.`);
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

  if (!isSuper) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Hanya Super Admin"
        message="Halaman pengelolaan pengguna hanya dapat diakses oleh peran Super Admin. Hubungi admin utama jika Anda membutuhkan akses."
        className="mx-auto mt-10 max-w-xl"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">Pengguna</h1>
          <p className="text-sm text-muted-foreground">Kelola akun tim redaksi — peran menentukan hak akses CMS.</p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4" /> Pengguna
        </Button>
      </div>

      <Card className="overflow-hidden">
        {listQ.error ? (
          <ErrorState message={listQ.error} onRetry={listQ.refetch} className="m-4" />
        ) : listQ.loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users2} title="Belum ada pengguna" className="border-0 bg-transparent" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Sejak</TableHead>
                <TableHead className="w-20 text-right">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold text-brand-ink">
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white" aria-hidden>
                        {u.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="truncate">
                        {u.name}
                        {u.id === me?.id && <span className="ml-1.5 text-[10px] font-bold text-brand-teal">(Anda)</span>}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-52 truncate text-sm text-muted-foreground sm:table-cell">{u.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.active ? "border-brand-tropic/40 bg-brand-tropic/10 font-semibold text-brand-tropic" : "border-stone-300 bg-stone-100 font-semibold text-stone-500"}>
                      {u.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">{fmtDateID(u.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)} aria-label={`Edit pengguna ${u.name}`}>
                      <UserCog className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-muted-foreground">Total {rows.length} pengguna.</p>

      {/* Dialog create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Pengguna — ${editing.name}` : "Pengguna Baru"}</DialogTitle>
            <DialogDescription>
              {editing ? "Perbarui data, peran, atau reset password pengguna." : "Buat akun untuk anggota tim redaksi WaraNusa."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">
                Nama <span className="text-destructive">*</span>
              </Label>
              <Input id="u-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="cth. Rani Pustaka" aria-required="true" aria-invalid={!!fieldErrors.name} />
              {fieldErrors.name && <p className="text-xs font-medium text-destructive">{fieldErrors.name}</p>}
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label htmlFor="u-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input id="u-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nama@waranusa.id" aria-required="true" aria-invalid={!!fieldErrors.email} />
                {fieldErrors.email && <p className="text-xs font-medium text-destructive">{fieldErrors.email}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="u-role">Peran</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger id="u-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {labelRole(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Super Admin: akses penuh · Editor: kelola konten · Reviewer: moderasi.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-password">
                {editing ? (
                  "Password Baru (opsional)"
                ) : (
                  <>
                    Password <span className="text-destructive">*</span>
                  </>
                )}
              </Label>
              <Input
                id="u-password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
              />
              {editing && <p className="text-xs text-muted-foreground">Isi untuk mereset password pengguna ini.</p>}
              {fieldErrors.password && <p className="text-xs font-medium text-destructive">{fieldErrors.password}</p>}
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
                <div className="pr-4">
                  <Label htmlFor="u-active" className="text-sm font-semibold">
                    Akun aktif
                  </Label>
                  <p className="text-xs text-muted-foreground">Akun nonaktif tidak dapat masuk ke CMS.</p>
                </div>
                <Switch id="u-active" checked={form.active} onCheckedChange={(v) => set("active", v)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />}
              {editing ? "Simpan Perubahan" : "Tambah Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
