"use client";

/**
 * WaraNusa CMS — Pengaturan Situs (khusus Super Admin)
 * Form identitas situs: nama, tagline, tentang, kontak, catatan footer,
 * dan pemberitahuan halaman kontribusi. Disimpan via PUT /admin/settings.
 */
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { CheckCircle2, Info, Save, Settings2, ShieldAlert } from "lucide-react";

interface SettingsForm {
  siteName: string;
  tagline: string;
  aboutShort: string;
  contactEmail: string;
  footerNote: string;
  contributionNotice: string;
}

const EMPTY: SettingsForm = { siteName: "", tagline: "", aboutShort: "", contactEmail: "", footerNote: "", contributionNotice: "" };

export function SettingsView() {
  const me = useAuth((s) => s.user);
  const isSuper = me?.role === "SUPER_ADMIN";

  const settingsQ = useAsyncData(
    () => (isSuper ? api.admin.settings.get() : Promise.resolve({ data: {} as Record<string, string> })),
    [isSuper]
  );

  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!settingsQ.data) return;
    const d = settingsQ.data;
    setForm({
      siteName: d.siteName ?? "",
      tagline: d.tagline ?? "",
      aboutShort: d.aboutShort ?? "",
      contactEmail: d.contactEmail ?? "",
      footerNote: d.footerNote ?? "",
      contributionNotice: d.contributionNotice ?? "",
    });
  }, [settingsQ.data]);

  const set = (k: keyof SettingsForm, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => ({ ...e, [k]: "" }));
  };

  const save = async () => {
    const errs: Record<string, string> = {};
    if (!form.siteName.trim()) errs.siteName = "Nama situs wajib diisi.";
    if (!form.contactEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.contactEmail.trim())) errs.contactEmail = "Email kontak tidak valid.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Periksa kembali formulir pengaturan.");
      return;
    }
    setSaving(true);
    try {
      await api.admin.settings.update({
        siteName: form.siteName.trim(),
        tagline: form.tagline.trim(),
        aboutShort: form.aboutShort.trim(),
        contactEmail: form.contactEmail.trim().toLowerCase(),
        footerNote: form.footerNote.trim(),
        contributionNotice: form.contributionNotice.trim(),
      });
      setSavedAt(new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date()));
      toast.success("Pengaturan situs tersimpan — langsung berlaku di seluruh halaman.");
      await settingsQ.refetch();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.fields) setFieldErrors(e.fields);
        toast.error(e.message);
      } else {
        toast.error("Gagal menyimpan pengaturan.");
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
        message="Halaman pengaturan situs hanya dapat diakses oleh peran Super Admin."
        className="mx-auto mt-10 max-w-xl"
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">Pengaturan Situs</h1>
          <p className="text-sm text-muted-foreground">Identitas dan teks global yang tampil di situs publik.</p>
        </div>
        <Badge variant="outline" className="gap-1 border-brand-tropic/40 bg-brand-tropic/10 font-semibold text-brand-tropic">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Tersimpan otomatis setelah Simpan
        </Badge>
      </div>

      {settingsQ.error ? (
        <ErrorState message={settingsQ.error} onRetry={settingsQ.refetch} />
      ) : settingsQ.loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-brand-teal" aria-hidden /> Identitas Situs
            </CardTitle>
            <CardDescription>Perubahan langsung terlihat pada header, footer, dan halaman kontribusi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="st-name">
                  Nama Situs <span className="text-destructive">*</span>
                </Label>
                <Input id="st-name" value={form.siteName} onChange={(e) => set("siteName", e.target.value)} placeholder="WaraNusa" aria-required="true" aria-invalid={!!fieldErrors.siteName} />
                <p className="text-xs text-muted-foreground">Nama brand pada header & tab peramban.</p>
                {fieldErrors.siteName && <p className="text-xs font-medium text-destructive">{fieldErrors.siteName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="st-tagline">Tagline</Label>
                <Input id="st-tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Jelajahi Budaya Nusantara dalam 3D" />
                <p className="text-xs text-muted-foreground">Kalimat pendek di bawah logo & meta deskripsi.</p>
                {fieldErrors.tagline && <p className="text-xs font-medium text-destructive">{fieldErrors.tagline}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="st-about">Tentang Singkat</Label>
              <Textarea id="st-about" value={form.aboutShort} onChange={(e) => set("aboutShort", e.target.value)} rows={3} placeholder="WaraNusa adalah platform arsip budaya Indonesia interaktif…" />
              <p className="text-xs text-muted-foreground">Paragraf pengantar pada beranda & halaman tentang.</p>
              {fieldErrors.aboutShort && <p className="text-xs font-medium text-destructive">{fieldErrors.aboutShort}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="st-email">
                Email Kontak <span className="text-destructive">*</span>
              </Label>
              <Input id="st-email" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="halo@waranusa.id" aria-required="true" aria-invalid={!!fieldErrors.contactEmail} />
              <p className="text-xs text-muted-foreground">Ditampilkan di footer untuk pertanyaan & kerja sama.</p>
              {fieldErrors.contactEmail && <p className="text-xs font-medium text-destructive">{fieldErrors.contactEmail}</p>}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="st-footer">Catatan Footer</Label>
              <Textarea id="st-footer" value={form.footerNote} onChange={(e) => set("footerNote", e.target.value)} rows={2} placeholder="© 2025 WaraNusa — Dibangun untuk pelestarian budaya." />
              <p className="text-xs text-muted-foreground">Teks kecil di bagian bawah setiap halaman publik.</p>
              {fieldErrors.footerNote && <p className="text-xs font-medium text-destructive">{fieldErrors.footerNote}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="st-contrib">Pemberitahuan Kontribusi</Label>
              <Textarea id="st-contrib" value={form.contributionNotice} onChange={(e) => set("contributionNotice", e.target.value)} rows={2} placeholder="Konten Anda akan ditinjau kurator dalam 1–3 hari kerja sebelum dipublikasikan." />
              <p className="text-xs text-muted-foreground">Info di halaman kontribusi publik tentang proses moderasi.</p>
              {fieldErrors.contributionNotice && <p className="text-xs font-medium text-destructive">{fieldErrors.contributionNotice}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" aria-hidden />
                {savedAt ? `Terakhir disimpan pukul ${savedAt} WIB` : "Belum ada perubahan tersimpan pada sesi ini."}
              </p>
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? <span className="mr-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden /> : <Save className="h-4 w-4" />}
                Simpan Pengaturan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
