"use client";

/**
 * WaraNusa — ContributeView (#/kontribusi)
 * Formulir kontribusi publik (validasi manual + error inline) + panel pelacakan
 * status kontribusi via refCode (WN-XXXXXX) dan email.
 */
import { useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  ClipboardCopy,
  FileUp,
  Gavel,
  HandHeart,
  History,
  Info,
  Paperclip,
  RotateCcw,
  Search,
  SearchCheck,
} from "lucide-react";
import type { Route } from "@/lib/router";
import { api, ApiError, contributionStatusColor } from "@/lib/api-client";
import type { Contribution } from "@/lib/types";
import { labelContributionStatus } from "@/lib/constants";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import { useSiteSettings } from "@/lib/settings-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, SectionHeading } from "@/components/shared/states";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REF_CODE_RE = /^WN-[A-Za-z0-9]{6}$/;

const ACTION_LABEL: Record<string, string> = {
  SUBMIT: "Diajukan",
  START_REVIEW: "Peninjauan dimulai",
  REQUEST_REVISION: "Revisi diminta",
  APPROVE: "Disetujui",
  REJECT: "Ditolak",
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(iso));

interface FormState {
  title: string;
  regionId: string;
  categorySlug: string;
  description: string;
  sourceRef: string;
  submitterName: string;
  submitterEmail: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  title: "",
  regionId: "",
  categorySlug: "",
  description: "",
  sourceRef: "",
  submitterName: "",
  submitterEmail: "",
};

function validate(f: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!f.title.trim()) errors.title = "Judul wajib diisi.";
  if (!f.categorySlug) errors.categorySlug = "Pilih kategori objek.";
  if (f.description.trim().length < 20)
    errors.description = `Deskripsi minimal 20 karakter (saat ini ${f.description.trim().length}).`;
  if (!f.submitterName.trim()) errors.submitterName = "Nama wajib diisi.";
  if (!f.submitterEmail.trim()) errors.submitterEmail = "Email wajib diisi.";
  else if (!EMAIL_RE.test(f.submitterEmail.trim())) errors.submitterEmail = "Format email tidak valid.";
  return errors;
}

export default function ContributeView({ route }: { route: Route }) {
  const user = useAuth((s) => s.user);
  const settings = useSiteSettings((s) => s.settings);

  const categoriesQ = useAsyncData(() => api.categories.list(), []);
  const regionsQ = useAsyncData(() => api.regions.list(), []);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Contribution | null>(null);

  const [trackCode, setTrackCode] = useState(route.query.ref ?? "");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackErrors, setTrackErrors] = useState<{ refCode?: string; email?: string }>({});
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState<Contribution | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Prefill nama/email bila pengguna sudah masuk
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        submitterName: f.submitterName || user.name,
        submitterEmail: f.submitterEmail || user.email,
      }));
      setTrackEmail((e) => e || user.email);
    }
  }, [user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      toast.error("Periksa kembali isian formulir.");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.contributions.create({
        title: form.title.trim(),
        regionId: form.regionId || null,
        categorySlug: form.categorySlug,
        description: form.description.trim(),
        sourceRef: form.sourceRef.trim() || undefined,
        submitterName: form.submitterName.trim(),
        submitterEmail: form.submitterEmail.trim(),
      });
      setSubmitted(data.contribution);
      setForm(EMPTY_FORM);
      toast.success("Kontribusi berhasil dikirim. Simpan kode referensi Anda!");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) setErrors((prev) => ({ ...prev, ...err.fields }));
        toast.error(err.message);
      } else {
        toast.error("Terjadi kesalahan tak terduga.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof trackErrors = {};
    if (!REF_CODE_RE.test(trackCode.trim()))
      errs.refCode = "Format kode: WN-XXXXXX (contoh: WN-A1B2C3).";
    if (!trackEmail.trim()) errs.email = "Email wajib diisi.";
    else if (!EMAIL_RE.test(trackEmail.trim())) errs.email = "Format email tidak valid.";
    setTrackErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setTracking(true);
    setTrackError(null);
    try {
      const { data } = await api.contributions.track(trackCode.trim().toUpperCase(), trackEmail.trim());
      setTracked(data);
    } catch (err) {
      setTracked(null);
      setTrackError(err instanceof ApiError ? err.message : "Gagal melacak kontribusi.");
    } finally {
      setTracking(false);
    }
  };

  const copyRef = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Kode referensi disalin.");
    } catch {
      toast.error("Tidak dapat menyalin kode di peramban ini.");
    }
  };

  const scrollToTrack = (code: string) => {
    setTrackCode(code);
    trackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <SectionHeading
        eyebrow="Kerja sama"
        title="Kirim Dokumentasi Budaya"
        description="Bagikan pengetahuan Anda tentang objek budaya — tim kurator akan meninjau, memverifikasi sumber, lalu menerbitkannya dengan atribusi atas nama Anda."
      />

      {settings.contributionNotice && (
        <Alert className="mt-6 rounded-2xl border-brand-teal/30 bg-brand-soft">
          <Info className="h-4 w-4 text-brand-teal" aria-hidden="true" />
          <AlertTitle className="text-sm font-bold text-brand-ink">Catatan kurasi</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            {settings.contributionNotice}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* ================= KOLOM FORM / SUKSES ================= */}
        <div className="lg:col-span-3">
          {submitted ? (
            /* ---------- KARTU SUKSES ---------- */
            <Card className="rounded-3xl border-brand-teal/40 bg-brand-soft/70 shadow-sm">
              <CardContent className="p-8 text-center sm:p-10">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-teal/10">
                  <CheckCheck className="h-8 w-8 text-brand-teal" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-2xl font-extrabold text-brand-ink">Kontribusi Terkirim!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Simpan kode referensi berikut untuk melacak status peninjauan Anda:
                </p>
                <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-brand-teal/30 bg-card px-6 py-4">
                  <span className="font-mono text-2xl font-bold tracking-wider text-brand-teal sm:text-3xl">
                    {submitted.refCode}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyRef(submitted.refCode)}
                    aria-label="Salin kode referensi"
                    className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-brand-teal"
                  >
                    <ClipboardCopy className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </div>

                {/* Alur moderasi */}
                <div className="mt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Alur peninjauan
                  </p>
                  <ol className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-0" aria-label="Alur peninjauan kontribusi">
                    {[
                      { icon: FileUp, label: "Diajukan", desc: "Kontribusi masuk & mendapat kode" },
                      { icon: SearchCheck, label: "Peninjauan", desc: "Reviewer memeriksa isi & sumber" },
                      { icon: Gavel, label: "Keputusan", desc: "Disetujui, revisi, atau ditolak" },
                    ].map((step, i) => (
                      <li key={step.label} className="flex items-center">
                        <div className="flex w-56 flex-col items-center gap-1.5 sm:w-40">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-brand-line">
                            <step.icon className="h-5 w-5 text-brand-sea" aria-hidden="true" />
                          </span>
                          <p className="text-sm font-bold text-brand-ink">{step.label}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                        {i < 2 && <span aria-hidden="true" className="mx-1 hidden h-px w-10 bg-brand-line sm:block" />}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={() => scrollToTrack(submitted.refCode)}
                    className="min-h-[44px] rounded-full bg-brand-teal font-bold text-white hover:bg-brand-teal/90"
                  >
                    Cek Status Nanti
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(null)}
                    className="min-h-[44px] rounded-full font-bold"
                  >
                    <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Kirim Kontribusi Lain
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* ---------- FORM ---------- */
            <Card className="rounded-3xl border-brand-line">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg text-brand-ink">
                  <HandHeart className="h-5 w-5 text-brand-orange" aria-hidden="true" />
                  Formulir Kontribusi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Judul */}
                  <div className="space-y-1.5">
                    <Label htmlFor="c-title">
                      Judul objek budaya <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="c-title"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="mis. Batik Cap Prada dari Yogyakarta"
                      aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? "err-title" : undefined}
                      className="min-h-[44px]"
                    />
                    {errors.title && (
                      <p id="err-title" className="text-xs text-destructive">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  {/* Wilayah + Kategori */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="c-region">Wilayah (opsional)</Label>
                      <Select value={form.regionId || "none"} onValueChange={(v) => set("regionId", v === "none" ? "" : v)}>
                        <SelectTrigger id="c-region" className="min-h-[44px] w-full" aria-label="Pilih wilayah">
                          <SelectValue placeholder="Belum tahu / umum" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Belum tahu / umum</SelectItem>
                          {(regionsQ.data ?? []).map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-category">
                        Kategori <span className="text-destructive">*</span>
                      </Label>
                      <Select value={form.categorySlug || "none"} onValueChange={(v) => set("categorySlug", v === "none" ? "" : v)}>
                        <SelectTrigger
                          id="c-category"
                          className={cn("min-h-[44px] w-full", errors.categorySlug && "border-destructive")}
                          aria-invalid={!!errors.categorySlug}
                          aria-describedby={errors.categorySlug ? "err-category" : undefined}
                          aria-label="Pilih kategori"
                        >
                          <SelectValue placeholder="Pilih kategori…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>
                            Pilih kategori…
                          </SelectItem>
                          {(categoriesQ.data ?? []).map((c) => (
                            <SelectItem key={c.id} value={c.slug}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.categorySlug && (
                        <p id="err-category" className="text-xs text-destructive">
                          {errors.categorySlug}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="c-desc">
                        Deskripsi <span className="text-destructive">*</span>
                      </Label>
                      <span className={cn("text-xs", form.description.trim().length >= 20 ? "text-brand-tropic" : "text-muted-foreground")}>
                        {form.description.trim().length} karakter (min. 20)
                      </span>
                    </div>
                    <Textarea
                      id="c-desc"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Jelaskan objek budaya: apa itu, dari mana, ciri khas, dan cara pembuatannya bila diketahui…"
                      rows={6}
                      aria-invalid={!!errors.description}
                      aria-describedby={errors.description ? "err-desc" : undefined}
                    />
                    {errors.description && (
                      <p id="err-desc" className="text-xs text-destructive">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Sumber referensi */}
                  <div className="space-y-1.5">
                    <Label htmlFor="c-source">Sumber referensi (opsional)</Label>
                    <Textarea
                      id="c-source"
                      value={form.sourceRef}
                      onChange={(e) => set("sourceRef", e.target.value)}
                      placeholder={"Tempel 1 tautan atau rujukan beserta penjelasan singkat.\nContoh: https://id.wikipedia.org/wiki/Batik — untuk sejarah umum batik."}
                      rows={3}
                    />
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Paperclip className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                      Unggah lampiran media sedang dalam pengembangan — sertakan tautan pada kolom
                      sumber untuk sementara.
                    </p>
                  </div>

                  <Separator className="bg-brand-line" />

                  {/* Nama + Email */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="c-name">
                        Nama Anda <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="c-name"
                        value={form.submitterName}
                        onChange={(e) => set("submitterName", e.target.value)}
                        placeholder="Nama lengkap"
                        autoComplete="name"
                        aria-invalid={!!errors.submitterName}
                        aria-describedby={errors.submitterName ? "err-name" : undefined}
                        className="min-h-[44px]"
                      />
                      {errors.submitterName && (
                        <p id="err-name" className="text-xs text-destructive">
                          {errors.submitterName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="c-email"
                        type="email"
                        value={form.submitterEmail}
                        onChange={(e) => set("submitterEmail", e.target.value)}
                        placeholder="nama@email.com"
                        autoComplete="email"
                        aria-invalid={!!errors.submitterEmail}
                        aria-describedby={errors.submitterEmail ? "err-email" : undefined}
                        className="min-h-[44px]"
                      />
                      {errors.submitterEmail && (
                        <p id="err-email" className="text-xs text-destructive">
                          {errors.submitterEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="min-h-[48px] w-full rounded-full bg-brand-teal text-base font-bold text-white hover:bg-brand-teal/90"
                  >
                    {submitting ? "Mengirim…" : "Kirim Kontribusi"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Data yang Anda kirim hanya digunakan untuk proses kurasi &amp; komunikasi.
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ================= PANEL LACAK ================= */}
        <aside ref={trackRef} className="scroll-mt-24 space-y-6 lg:col-span-2">
          <Card className="rounded-3xl border-brand-line">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-brand-ink">
                <Search className="h-5 w-5 text-brand-sea" aria-hidden="true" />
                Lacak Kontribusi
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Masukkan kode referensi (format WN-XXXXXX) dan email pengirim.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrack} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="t-code">Kode referensi</Label>
                  <Input
                    id="t-code"
                    value={trackCode}
                    onChange={(e) => {
                      setTrackCode(e.target.value.toUpperCase());
                      setTrackErrors((er) => ({ ...er, refCode: undefined }));
                    }}
                    placeholder="WN-XXXXXX"
                    className="min-h-[44px] font-mono tracking-wider"
                    aria-invalid={!!trackErrors.refCode}
                    aria-describedby={trackErrors.refCode ? "err-tcode" : undefined}
                  />
                  {trackErrors.refCode && (
                    <p id="err-tcode" className="text-xs text-destructive">
                      {trackErrors.refCode}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-email">Email pengirim</Label>
                  <Input
                    id="t-email"
                    type="email"
                    value={trackEmail}
                    onChange={(e) => {
                      setTrackEmail(e.target.value);
                      setTrackErrors((er) => ({ ...er, email: undefined }));
                    }}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    aria-invalid={!!trackErrors.email}
                    aria-describedby={trackErrors.email ? "err-temail" : undefined}
                    className="min-h-[44px]"
                  />
                  {trackErrors.email && (
                    <p id="err-temail" className="text-xs text-destructive">
                      {trackErrors.email}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={tracking}
                  className="min-h-[44px] w-full rounded-full bg-brand-sea font-bold text-white hover:bg-brand-sea/90"
                >
                  {tracking ? "Melacak…" : "Lacak Status"}
                </Button>
                {trackError && (
                  <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {trackError}
                  </p>
                )}
              </form>

              {/* Hasil pelacakan */}
              {tracked && (
                <div className="mt-5 space-y-4 rounded-2xl border border-brand-line bg-brand-soft/60 p-4" aria-live="polite">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {tracked.refCode}
                    </p>
                    <h3 className="mt-0.5 font-bold text-brand-ink">{tracked.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Diajukan {fmtDate(tracked.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("px-3 py-1 text-xs font-bold", contributionStatusColor(tracked.status))}
                  >
                    {labelContributionStatus(tracked.status)}
                  </Badge>

                  {tracked.status === "NEEDS_REVISION" && (
                    <Alert className="rounded-xl border-brand-orange/40 bg-brand-orange/10">
                      <Info className="h-4 w-4 text-brand-orange" aria-hidden="true" />
                      <AlertTitle className="text-sm font-bold text-brand-ink">Perlu revisi</AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground">
                        {latestNote(tracked) ??
                          "Reviewer meminta perbaikan. Perbarui isi kontribusi lalu kirim ulang melalui formulir."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {tracked.reviews && tracked.reviews.length > 0 ? (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <History className="h-3.5 w-3.5" aria-hidden="true" />
                        Riwayat peninjauan
                      </p>
                      <ol className="mt-2 space-y-2.5">
                        {[...tracked.reviews]
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((r) => (
                            <li key={r.id} className="rounded-xl border border-brand-line bg-card px-3 py-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="text-xs font-bold text-brand-ink">
                                  {ACTION_LABEL[r.action] ?? r.action}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {fmtDate(r.createdAt)}
                                </span>
                              </div>
                              {r.note && <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>}
                              {r.reviewer && (
                                <p className="mt-1 text-[11px] text-muted-foreground/80">
                                  oleh {r.reviewer.name}
                                </p>
                              )}
                            </li>
                          ))}
                      </ol>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Belum ada aktivitas peninjauan — kontribusi Anda sedang dalam antrean.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info singkat alur */}
          <Card className="rounded-3xl border-brand-line">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-brand-ink">Apa yang terjadi setelah dikirim?</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2.5">
                  <FileUp className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" aria-hidden="true" />
                  Kontribusi Anda dicatat dengan kode referensi unik.
                </li>
                <li className="flex gap-2.5">
                  <SearchCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" aria-hidden="true" />
                  Reviewer memeriksa kelengkapan isi dan keabsahan sumber.
                </li>
                <li className="flex gap-2.5">
                  <Gavel className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" aria-hidden="true" />
                  Editor mengambil keputusan: diterbitkan (dengan atribusi nama Anda), diminta revisi, atau ditolak.
                </li>
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function latestNote(c: Contribution): string | null {
  const withNote = (c.reviews ?? [])
    .filter((r) => r.note)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return withNote[0]?.note ?? null;
}
