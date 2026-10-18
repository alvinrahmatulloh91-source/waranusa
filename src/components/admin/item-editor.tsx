"use client";

/**
 * WaraNusa CMS — Editor Objek Budaya (create & edit)
 * Bagian: A Identitas · B Konten · C Media · D Hotspot 3D · E Sumber · F Atribusi · G Status & Aksi.
 * Semua perubahan tersimpan via api.admin.items.* / api.admin.hotspots.*.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "@/lib/router";
import { api, ApiError } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import type { CulturalItem, Hotspot, ItemInput, MediaAsset, Source } from "@/lib/types";
import { SOURCE_TYPES, labelSourceType, type ItemStatus, type SourceType } from "@/lib/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { ErrorState, Loader } from "@/components/shared/states";
import { MediaPickerButton } from "./media-picker";
import { cn } from "@/lib/utils";
import ModelViewer from "@/components/three/model-viewer";
import {
  Anchor,
  Archive,
  BookOpen,
  Box,
  Eye,
  Globe2,
  Images,
  Landmark,
  Link2,
  Loader2,
  MapPin,
  Plus,
  Save,
  Shapes,
  Sparkles,
  Trash2,
} from "lucide-react";

// ---------- Helper lokal ----------

/** Slugify lokal untuk judul & slug. */
function slugifyLocal(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const toNum = (s: string): number => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

interface SourceRow {
  key: string;
  title: string;
  creator: string;
  url: string;
  sourceType: SourceType;
  attribution: string;
  license: string;
  accessDate: string;
  verificationNote: string;
}

interface HotspotRow extends Hotspot {
  _x: string;
  _y: string;
  _z: string;
}

interface FormState {
  title: string;
  slug: string;
  categoryId: string;
  regionId: string;
  featured: boolean;
  summary: string;
  description: string;
  history: string;
  meaning: string;
  cover: MediaAsset | null;
  model: MediaAsset | null;
  audio: MediaAsset | null;
  gallery: MediaAsset[];
  attribution: string;
  license: string;
  sources: SourceRow[];
}

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random()}`;

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  categoryId: "",
  regionId: "",
  featured: false,
  summary: "",
  description: "",
  history: "",
  meaning: "",
  cover: null,
  model: null,
  audio: null,
  gallery: [],
  attribution: "",
  license: "",
  sources: [],
};

function rowFromSource(s: Source): SourceRow {
  return {
    key: newKey(),
    title: s.title,
    creator: s.creator ?? "",
    url: s.url ?? "",
    sourceType: s.sourceType,
    attribution: s.attribution ?? "",
    license: s.license ?? "",
    accessDate: s.accessDate ? s.accessDate.slice(0, 10) : "",
    verificationNote: s.verificationNote ?? "",
  };
}

const hotspotRow = (h: Hotspot): HotspotRow => ({ ...h, _x: String(h.x), _y: String(h.y), _z: String(h.z) });

/** Serialized snapshot untuk deteksi perubahan (unsaved guard). */
function serialize(f: FormState): string {
  return JSON.stringify({
    t: f.title,
    s: f.slug,
    c: f.categoryId,
    r: f.regionId,
    f: f.featured,
    sum: f.summary,
    d: f.description,
    h: f.history,
    m: f.meaning,
    cov: f.cover?.id ?? null,
    mod: f.model?.id ?? null,
    aud: f.audio?.id ?? null,
    gal: f.gallery.map((g) => g.id),
    att: f.attribution,
    lic: f.license,
    src: f.sources.map((x) => [x.title, x.creator, x.url, x.sourceType, x.attribution, x.license, x.accessDate, x.verificationNote]),
  });
}

// ---------- Field kecil berlabel + error inline ----------
function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

// ================= Komponen utama =================

export function ItemEditor({ mode, itemId }: { mode: "create" | "edit"; itemId?: string }) {
  const user = useAuth((s) => s.user);
  const canManage = !!user && (user.role === "SUPER_ADMIN" || user.role === "EDITOR");
  const isEdit = mode === "edit" && !!itemId;

  const catsQ = useAsyncData(() => api.categories.list(), []);
  const regionsQ = useAsyncData(() => api.regions.list(), []);
  const detailQ = useAsyncData(
    () => (isEdit && itemId ? api.admin.items.detail(itemId) : Promise.resolve({ data: null as CulturalItem | null })),
    [isEdit, itemId]
  );

  const [ready, setReady] = useState(!isEdit);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [status, setStatus] = useState<ItemStatus>("DRAFT");
  const [hotspots, setHotspots] = useState<HotspotRow[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<string>(serialize(EMPTY_FORM));
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  };

  // Isi form dari detail (mode edit)
  useEffect(() => {
    const d = detailQ.data;
    if (!isEdit || !d) return;
    const f: FormState = {
      title: d.title,
      slug: d.slug,
      categoryId: d.category?.id ?? "",
      regionId: d.region?.id ?? "",
      featured: d.featured,
      summary: d.summary,
      description: d.description,
      history: d.history ?? "",
      meaning: d.meaning ?? "",
      cover: d.coverMedia ?? null,
      model: d.modelMedia ?? null,
      audio: d.audioMedia ?? null,
      gallery: d.gallery ?? [],
      attribution: d.attribution ?? "",
      license: d.license ?? "",
      sources: (d.sources ?? []).map(rowFromSource),
    };
    setForm(f);
    setStatus(d.status);
    setHotspots((d.hotspots ?? []).map(hotspotRow));
    const snap = serialize(f);
    setSnapshot(snap);
    snapshotRef.current = snap;
    setReady(true);
  }, [detailQ.data, isEdit]);

  const dirty = ready && serialize(form) !== snapshotRef.current;

  // Peringatan keluar saat ada perubahan belum disimpan
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const detail = detailQ.data;

  // ---------- Validasi ----------
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Judul wajib diisi.";
    if (!form.categoryId) errs.categoryId = "Pilih kategori.";
    if (!form.regionId) errs.regionId = "Pilih wilayah.";
    if (!form.summary.trim()) errs.summary = "Ringkasan wajib diisi.";
    else if (form.summary.length > 500) errs.summary = `Ringkasan maksimal 500 karakter (saat ini ${form.summary.length}).`;
    if (!form.description.trim()) errs.description = "Deskripsi lengkap wajib diisi.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Periksa kembali formulir — ada bidang wajib yang belum lengkap.");
      document.getElementById("bagian-identitas")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    return true;
  };

  const handleErr = (e: unknown) => {
    if (e instanceof ApiError) {
      if (e.fields) setFieldErrors(e.fields);
      toast.error(e.message);
    } else {
      toast.error("Terjadi kesalahan tak terduga.");
    }
  };

  // ---------- Payload ----------
  const buildPayload = (over?: { status?: ItemStatus }): ItemInput => ({
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    summary: form.summary.trim(),
    description: form.description.trim(),
    history: form.history.trim() || undefined,
    meaning: form.meaning.trim() || undefined,
    status: over?.status,
    featured: form.featured,
    categoryId: form.categoryId,
    regionId: form.regionId,
    coverMediaId: form.cover?.id ?? null,
    modelMediaId: form.model?.id ?? null,
    audioMediaId: form.audio?.id ?? null,
    galleryMediaIds: form.gallery.map((g) => g.id),
    attribution: form.attribution.trim() || undefined,
    license: form.license.trim() || undefined,
    sources: form.sources
      .filter((s) => s.title.trim())
      .map((s) => ({
        title: s.title.trim(),
        creator: s.creator.trim() || undefined,
        url: s.url.trim() || undefined,
        sourceType: s.sourceType,
        attribution: s.attribution.trim() || undefined,
        license: s.license.trim() || undefined,
        accessDate: s.accessDate || undefined,
        verificationNote: s.verificationNote.trim() || undefined,
      })),
  });

  // ---------- Aksi simpan ----------
  const doCreate = async (publish: boolean) => {
    if (!validate()) return;
    setSaving(publish ? "publish" : "draft");
    try {
      const { data } = await api.admin.items.create(buildPayload({ status: publish ? "PUBLISHED" : "DRAFT" }));
      toast.success(publish ? `Objek “${data.title}” dipublikasikan.` : "Draft objek budaya berhasil dibuat.");
      navigate(`/admin/cultural-items/${data.id}/edit`, { replace: true });
    } catch (e) {
      handleErr(e);
    } finally {
      setSaving(null);
    }
  };

  const doPatch = async (payload: Partial<ItemInput>, successMsg: string, markClean = false): Promise<CulturalItem | null> => {
    if (!itemId) return null;
    try {
      const { data } = await api.admin.items.update(itemId, payload);
      setStatus(data.status);
      if (markClean) {
        const snap = serialize(form);
        setSnapshot(snap);
        snapshotRef.current = snap;
      }
      toast.success(successMsg);
      return data;
    } catch (e) {
      handleErr(e);
      return null;
    }
  };

  const saveChanges = async () => {
    if (!validate() || !itemId) return;
    setSaving("save");
    await doPatch(buildPayload(), "Perubahan berhasil disimpan.", true);
    setSaving(null);
  };

  const saveAsDraft = async () => {
    if (!itemId) return;
    setSaving("draft");
    await doPatch({ status: "DRAFT" }, "Objek disimpan sebagai draft.");
    setSaving(null);
  };

  const publish = async () => {
    if (!validate() || !itemId) return;
    setSaving("publish");
    await doPatch({ status: "PUBLISHED" }, "Objek budaya berhasil dipublikasikan.");
    setSaving(null);
  };

  const archive = async () => {
    if (!itemId) return;
    setSaving("archive");
    await doPatch({ status: "ARCHIVED" }, "Objek budaya diarsipkan.");
    setSaving(null);
  };

  const remove = async () => {
    if (!itemId) return;
    setSaving("delete");
    try {
      await api.admin.items.delete(itemId);
      toast.success("Objek budaya dihapus permanen.");
      navigate("/admin/cultural-items");
    } catch (e) {
      handleErr(e);
    } finally {
      setSaving(null);
    }
  };

  // ---------- Hotspot ----------
  const saveHotspot = async (h: HotspotRow) => {
    if (!itemId) return;
    if (!h.title.trim()) {
      toast.error("Judul hotspot wajib diisi.");
      return;
    }
    setSaving(`hotspot-${h.id}`);
    try {
      const { data } = await api.admin.hotspots.update(itemId, h.id, {
        title: h.title.trim(),
        description: h.description.trim(),
        x: toNum(h._x),
        y: toNum(h._y),
        z: toNum(h._z),
        published: h.published,
      });
      setHotspots((rows) => rows.map((r) => (r.id === h.id ? { ...r, x: data.x, y: data.y, z: data.z } : r)));
      toast.success(`Hotspot “${h.title}” disimpan.`);
    } catch (e) {
      handleErr(e);
    } finally {
      setSaving(null);
    }
  };

  const deleteHotspot = async (h: HotspotRow) => {
    if (!itemId) return;
    setSaving(`hotspot-del-${h.id}`);
    try {
      await api.admin.hotspots.delete(itemId, h.id);
      setHotspots((rows) => rows.filter((r) => r.id !== h.id));
      toast.success(`Hotspot “${h.title}” dihapus.`);
    } catch (e) {
      handleErr(e);
    } finally {
      setSaving(null);
    }
  };

  const addHotspot = async () => {
    if (!itemId) return;
    setSaving("hotspot-add");
    try {
      const { data } = await api.admin.hotspots.create(itemId, {
        title: "Hotspot Baru",
        description: "",
        x: 0,
        y: 1,
        z: 0,
        published: false,
      });
      setHotspots((rows) => [...rows, hotspotRow(data)]);
      toast.success("Hotspot ditambahkan — atur posisi lalu simpan.");
    } catch (e) {
      handleErr(e);
    } finally {
      setSaving(null);
    }
  };

  // ---------- Sumber (array lokal) ----------
  const addSource = () =>
    setForm((f) => ({
      ...f,
      sources: [...f.sources, { key: newKey(), title: "", creator: "", url: "", sourceType: "WEBSITE", attribution: "", license: "", accessDate: "", verificationNote: "" }],
    }));
  const removeSource = (idx: number) => setForm((f) => ({ ...f, sources: f.sources.filter((_, i) => i !== idx) }));
  const patchSource = (idx: number, patch: Partial<SourceRow>) =>
    setForm((f) => ({ ...f, sources: f.sources.map((s, i) => (i === idx ? { ...s, ...patch } : s)) }));

  // ---------- Pratinjau ----------
  const previewItem: CulturalItem = useMemo(() => {
    const cat = (catsQ.data ?? []).find((c) => c.id === form.categoryId) ?? { id: "-", slug: "-", name: "-" };
    const reg =
      (regionsQ.data ?? []).find((r) => r.id === form.regionId) ??
      { id: "-", code: "ID-XX", name: "-", islandGroup: "JAWA", summary: "-", lat: 0, lng: 0 };
    return {
      id: itemId ?? "preview",
      slug: form.slug || "pratinjau",
      title: form.title || "Tanpa Judul",
      summary: form.summary,
      description: form.description,
      history: form.history || null,
      meaning: form.meaning || null,
      status,
      featured: form.featured,
      viewCount: detail?.viewCount ?? 0,
      category: cat,
      region: reg,
      coverMedia: form.cover,
      modelMedia: form.model,
      audioMedia: form.audio,
      gallery: form.gallery,
      hotspots: hotspots.map((h) => ({
        id: h.id,
        itemId: h.itemId,
        title: h.title,
        description: h.description,
        x: toNum(h._x),
        y: toNum(h._y),
        z: toNum(h._z),
        published: h.published,
      })),
      attribution: form.attribution || null,
      license: form.license || null,
      createdAt: detail?.createdAt ?? new Date().toISOString(),
      updatedAt: detail?.updatedAt ?? new Date().toISOString(),
    };
  }, [form, status, hotspots, catsQ.data, regionsQ.data, detail, itemId]);

  const PROCEDURAL_DEMO_SLUGS = ["rumah-gadang", "joglo", "gamelan-jawa", "saron", "generic"];
  const isProcedural =
    PROCEDURAL_DEMO_SLUGS.includes(detail?.slug ?? "") ||
    (!!form.model && form.model.format.toLowerCase().includes("procedural"));

  // ---------- Loading / error ----------
  if (isEdit && detailQ.loading && !ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (isEdit && detailQ.error && !detail) {
    return <ErrorState message={detailQ.error} onRetry={detailQ.refetch} className="mx-auto mt-10 max-w-xl" />;
  }
  if (!canManage && !isEdit) {
    // Reviewer tidak boleh membuat objek baru
    return <ErrorState title="Tidak diizinkan" message="Peran Anda tidak memiliki akses membuat objek budaya." />;
  }

  const anchorChips = [
    { id: "bagian-identitas", label: "Identitas", icon: Landmark },
    { id: "bagian-konten", label: "Konten", icon: BookOpen },
    { id: "bagian-media", label: "Media", icon: Images },
    ...(isEdit && (!!form.model || isProcedural) ? [{ id: "bagian-hotspot", label: "Hotspot 3D", icon: Anchor }] : []),
    { id: "bagian-sumber", label: "Sumber", icon: Link2 },
    { id: "bagian-atribusi", label: "Atribusi", icon: Sparkles },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">
            {isEdit ? form.title || "Edit Objek Budaya" : "Objek Budaya Baru"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Perbarui konten, media, dan publikasi objek budaya." : "Lengkapi formulir untuk membuat objek budaya baru."}
            {dirty && <span className="ml-2 font-semibold text-brand-orange">• ada perubahan belum disimpan</span>}
          </p>
        </div>
        <nav aria-label="Navigasi bagian formulir" className="flex flex-wrap gap-1.5">
          {anchorChips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-brand-teal/60 hover:text-brand-teal"
            >
              <c.icon className="h-3.5 w-3.5" aria-hidden /> {c.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* ===== Kolom kiri: bagian A–F ===== */}
        <div className="space-y-5">
          {/* A. Identitas */}
          <Card id="bagian-identitas" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4 text-brand-teal" aria-hidden /> A. Identitas
              </CardTitle>
              <CardDescription>Nama, klasifikasi, dan penempatan objek budaya.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Judul" htmlFor="f-title" required error={fieldErrors.title}>
                <Input
                  id="f-title"
                  value={form.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, title: v, slug: !slugTouched ? slugifyLocal(v) : f.slug }));
                    setFieldErrors((er) => ({ ...er, title: "" }));
                  }}
                  placeholder="cth. Rumah Gadang Minangkabau"
                  aria-required="true"
                />
              </Field>
              <Field
                label="Slug"
                htmlFor="f-slug"
                hint="Dibuat otomatis dari judul — boleh diubah (huruf kecil & tanda hubung)."
                error={fieldErrors.slug}
              >
                <Input
                  id="f-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                  onBlur={() => set("slug", slugifyLocal(form.slug))}
                  placeholder="rumah-gadang"
                  className="font-mono text-sm"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kategori" htmlFor="f-category" required error={fieldErrors.categoryId}>
                  <Select
                    value={form.categoryId || undefined}
                    onValueChange={(v) => set("categoryId", v)}
                  >
                    <SelectTrigger id="f-category" className="w-full" aria-required="true">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {(catsQ.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Wilayah" htmlFor="f-region" required error={fieldErrors.regionId}>
                  <Select value={form.regionId || undefined} onValueChange={(v) => set("regionId", v)}>
                    <SelectTrigger id="f-region" className="w-full" aria-required="true">
                      <SelectValue placeholder="Pilih wilayah" />
                    </SelectTrigger>
                    <SelectContent>
                      {(regionsQ.data ?? []).map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
                <div className="pr-4">
                  <Label htmlFor="f-featured" className="text-sm font-semibold">
                    Tampilkan sebagai sorotan
                  </Label>
                  <p className="text-xs text-muted-foreground">Objek unggulan muncul lebih menonjol di beranda & jelajah.</p>
                </div>
                <Switch id="f-featured" checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
              </div>
            </CardContent>
          </Card>

          {/* B. Konten */}
          <Card id="bagian-konten" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-brand-teal" aria-hidden /> B. Konten
              </CardTitle>
              <CardDescription>Narasi budaya yang tampil di halaman publik.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Ringkasan"
                htmlFor="f-summary"
                required
                error={fieldErrors.summary}
                hint={
                  <span className={cn("text-xs", form.summary.length > 500 ? "font-semibold text-destructive" : "text-muted-foreground")}>
                    {form.summary.length}/500 karakter
                  </span>
                }
              >
                <Textarea
                  id="f-summary"
                  value={form.summary}
                  onChange={(e) => set("summary", e.target.value)}
                  maxLength={600}
                  rows={3}
                  placeholder="Ikhtisar 1–3 kalimat untuk kartu objek…"
                  aria-required="true"
                />
              </Field>
              <Field label="Deskripsi Lengkap" htmlFor="f-description" required error={fieldErrors.description}>
                <Textarea
                  id="f-description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={7}
                  placeholder="Uraian lengkap objek budaya: bentuk, material, cara pembuatan, penggunaan…"
                  aria-required="true"
                />
              </Field>
              <Field label="Sejarah & Konteks" htmlFor="f-history" error={fieldErrors.history}>
                <Textarea
                  id="f-history"
                  value={form.history}
                  onChange={(e) => set("history", e.target.value)}
                  rows={4}
                  placeholder="Asal-usul, perkembangan, dan konteks historis…"
                />
              </Field>
              <Field label="Makna & Fungsi" htmlFor="f-meaning" error={fieldErrors.meaning}>
                <Textarea
                  id="f-meaning"
                  value={form.meaning}
                  onChange={(e) => set("meaning", e.target.value)}
                  rows={4}
                  placeholder="Filosofi, simbolisme, dan fungsi sosial objek…"
                />
              </Field>
            </CardContent>
          </Card>

          {/* C. Media */}
          <Card id="bagian-media" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Images className="h-4 w-4 text-brand-teal" aria-hidden /> C. Media
              </CardTitle>
              <CardDescription>Sampul, model 3D, audio, dan galeri foto objek.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Gambar Sampul" error={fieldErrors.coverMediaId} hint="Tampil sebagai gambar utama objek (gambar, 1 buah).">
                <MediaPickerButton
                  type="IMAGE"
                  value={form.cover ? [form.cover] : []}
                  onChange={(assets) => set("cover", assets[0] ?? null)}
                  label="Pilih gambar sampul"
                />
              </Field>
              <Separator />
              <Field label="Model 3D" error={fieldErrors.modelMediaId} hint="Berkas GLB/GLTF atau model prosedural untuk viewer interaktif.">
                <MediaPickerButton
                  type="MODEL_3D"
                  value={form.model ? [form.model] : []}
                  onChange={(assets) => set("model", assets[0] ?? null)}
                  label="Pilih model 3D"
                />
              </Field>
              <Separator />
              <Field label="Audio" error={fieldErrors.audioMediaId} hint="Rekaman pendukung (musik, narasi, atau lingkungan).">
                <MediaPickerButton
                  type="AUDIO"
                  value={form.audio ? [form.audio] : []}
                  onChange={(assets) => set("audio", assets[0] ?? null)}
                  label="Pilih audio"
                />
              </Field>
              <Separator />
              <Field label="Galeri" hint="Koleksi foto/audio tambahan. Urutan = urutan pilihan di picker.">
                <MediaPickerButton
                  type="IMAGE"
                  multiple
                  value={form.gallery}
                  onChange={(assets) => set("gallery", assets)}
                  label="Tambah ke galeri"
                />
              </Field>
            </CardContent>
          </Card>

          {/* D. Hotspot 3D (edit-mode; tampil bila ada model ATAU slug model prosedural demo) */}
          {isEdit && (!!form.model || isProcedural) && (
            <Card id="bagian-hotspot" className="scroll-mt-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Anchor className="h-4 w-4 text-brand-teal" aria-hidden /> D. Hotspot 3D
                </CardTitle>
                <CardDescription>Titik interaktif pada model 3D — tiap hotspot disimpan sendiri.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!form.model && !isProcedural ? (
                  <Alert>
                    <Box className="h-4 w-4" />
                    <AlertDescription>
                      Pilih <span className="font-semibold">Model 3D</span> pada bagian C terlebih dahulu untuk mengatur hotspot.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {isProcedural && (
                      <Alert className="border-brand-gold/50 bg-brand-gold/10">
                        <Sparkles className="h-4 w-4 text-brand-orange" />
                        <AlertDescription className="text-brand-ink">
                          Model prosedural demo — koordinat sekitar <span className="font-mono font-semibold">x: [-1..1], y: [0..2], z: [-1..1]</span>.
                        </AlertDescription>
                      </Alert>
                    )}
                    {hotspots.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
                        Belum ada hotspot. Tambahkan titik penjelasan pada model 3D.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {hotspots.map((h, i) => (
                          <li key={h.id} className="rounded-xl border border-border bg-background p-3">
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hotspot {i + 1}</p>
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`h-pub-${h.id}`} className="text-xs font-semibold text-muted-foreground">
                                  Publik
                                </Label>
                                <Switch
                                  id={`h-pub-${h.id}`}
                                  checked={h.published}
                                  onCheckedChange={(v) => setHotspots((rows) => rows.map((r) => (r.id === h.id ? { ...r, published: v } : r)))}
                                />
                                <ConfirmDialog
                                  trigger={
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      aria-label={`Hapus hotspot ${h.title}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  }
                                  title="Hapus hotspot?"
                                  description={`Hotspot “${h.title}” akan dihapus dari model 3D.`}
                                  confirmLabel="Ya, hapus"
                                  destructive
                                  loading={saving === `hotspot-del-${h.id}`}
                                  onConfirm={() => void deleteHotspot(h)}
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="Judul" htmlFor={`h-title-${h.id}`}>
                                <Input
                                  id={`h-title-${h.id}`}
                                  value={h.title}
                                  onChange={(e) => setHotspots((rows) => rows.map((r) => (r.id === h.id ? { ...r, title: e.target.value } : r)))}
                                />
                              </Field>
                              <Field label="Deskripsi" htmlFor={`h-desc-${h.id}`}>
                                <Input
                                  id={`h-desc-${h.id}`}
                                  value={h.description}
                                  onChange={(e) => setHotspots((rows) => rows.map((r) => (r.id === h.id ? { ...r, description: e.target.value } : r)))}
                                  placeholder="Penjelasan singkat titik ini…"
                                />
                              </Field>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-3">
                              {(["_x", "_y", "_z"] as const).map((axis) => (
                                <Field key={axis} label={`Posisi ${axis.replace("_", "").toUpperCase()}`} htmlFor={`h-${axis}-${h.id}`}>
                                  <Input
                                    id={`h-${axis}-${h.id}`}
                                    type="number"
                                    step="0.1"
                                    value={h[axis]}
                                    onChange={(e) => setHotspots((rows) => rows.map((r) => (r.id === h.id ? { ...r, [axis]: e.target.value } : r)))}
                                    className="tabular-nums"
                                  />
                                </Field>
                              ))}
                            </div>
                            <div className="mt-3 flex justify-end">
                              <Button type="button" size="sm" onClick={() => void saveHotspot(h)} disabled={saving === `hotspot-${h.id}`}>
                                {saving === `hotspot-${h.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Simpan Hotspot
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button type="button" variant="outline" onClick={() => void addHotspot()} disabled={saving === "hotspot-add"}>
                      {saving === "hotspot-add" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Tambah Hotspot
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* E. Sumber */}
          <Card id="bagian-sumber" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4 text-brand-teal" aria-hidden /> E. Sumber
              </CardTitle>
              <CardDescription>Referensi & atribusi keilmuan — tersimpan bersama objek.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.sources.length === 0 && (
                <p className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
                  Belum ada sumber. Tambahkan referensi buku, jurnal, situs web, atau museum.
                </p>
              )}
              {form.sources.map((s, i) => (
                <div key={s.key} className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sumber {i + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeSource(i)}
                      aria-label={`Hapus sumber ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Judul" htmlFor={`s-title-${s.key}`} required>
                      <Input id={`s-title-${s.key}`} value={s.title} onChange={(e) => patchSource(i, { title: e.target.value })} placeholder="cth. Ensiklopedia Minangkabau" />
                    </Field>
                    <Field label="Creator / Penulis" htmlFor={`s-creator-${s.key}`}>
                      <Input id={`s-creator-${s.key}`} value={s.creator} onChange={(e) => patchSource(i, { creator: e.target.value })} placeholder="cth. A. Datuk Rangkayo" />
                    </Field>
                    <Field label="URL" htmlFor={`s-url-${s.key}`}>
                      <Input id={`s-url-${s.key}`} type="url" value={s.url} onChange={(e) => patchSource(i, { url: e.target.value })} placeholder="https://…" />
                    </Field>
                    <Field label="Tipe Sumber" htmlFor={`s-type-${s.key}`}>
                      <Select value={s.sourceType} onValueChange={(v) => patchSource(i, { sourceType: v as SourceType })}>
                        <SelectTrigger id={`s-type-${s.key}`} className="w-full">
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
                    </Field>
                    <Field label="Atribusi" htmlFor={`s-attr-${s.key}`}>
                      <Input id={`s-attr-${s.key}`} value={s.attribution} onChange={(e) => patchSource(i, { attribution: e.target.value })} placeholder="cth. Dokumentasi Museum Adityawarman" />
                    </Field>
                    <Field label="Lisensi" htmlFor={`s-lic-${s.key}`}>
                      <Input id={`s-lic-${s.key}`} value={s.license} onChange={(e) => patchSource(i, { license: e.target.value })} placeholder="cth. CC BY-SA 4.0" />
                    </Field>
                    <Field label="Tanggal Akses" htmlFor={`s-date-${s.key}`}>
                      <Input id={`s-date-${s.key}`} type="date" value={s.accessDate} onChange={(e) => patchSource(i, { accessDate: e.target.value })} />
                    </Field>
                    <Field label="Catatan Verifikasi" htmlFor={`s-note-${s.key}`}>
                      <Input id={`s-note-${s.key}`} value={s.verificationNote} onChange={(e) => patchSource(i, { verificationNote: e.target.value })} placeholder="cth. Diverifikasi editor, Maret 2025" />
                    </Field>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSource}>
                <Plus className="h-4 w-4" /> Tambah Sumber
              </Button>
            </CardContent>
          </Card>

          {/* F. Atribusi & Lisensi */}
          <Card id="bagian-atribusi" className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-brand-teal" aria-hidden /> F. Atribusi & Lisensi
              </CardTitle>
              <CardDescription>Kredit yang tampil di halaman publik objek.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Atribusi" htmlFor="f-attribution" hint="Pemilik karya / dokumentasi.">
                <Input id="f-attribution" value={form.attribution} onChange={(e) => set("attribution", e.target.value)} placeholder="cth. Dokumentasi WaraNusa" />
              </Field>
              <Field label="Lisensi" htmlFor="f-license" hint="cth. CC BY-SA 4.0, Hak cipta museum.">
                <Input id="f-license" value={form.license} onChange={(e) => set("license", e.target.value)} placeholder="cth. CC BY-SA 4.0" />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* ===== Panel kanan: G. Status & Aksi ===== */}
        <aside id="bagian-status" className="space-y-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shapes className="h-4 w-4 text-brand-teal" aria-hidden /> G. Status & Aksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-3 py-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Status saat ini</span>
                <StatusBadge status={status} />
              </div>

              <dl className="space-y-1.5 text-xs">
                {detail && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Dilihat</dt>
                      <dd className="font-bold tabular-nums text-brand-ink">{detail.viewCount}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Dibuat</dt>
                      <dd className="font-semibold text-brand-ink">
                        {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(detail.createdAt))}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Diperbarui</dt>
                      <dd className="font-semibold text-brand-ink">
                        {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(detail.updatedAt))}
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              <Separator />

              <div className="grid gap-2">
                {isEdit ? (
                  <>
                    <Button onClick={() => void saveChanges()} disabled={saving !== null}>
                      {saving === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Simpan Perubahan
                    </Button>
                    {status !== "DRAFT" && (
                      <Button variant="outline" onClick={() => void saveAsDraft()} disabled={saving !== null}>
                        {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Simpan sebagai Draft
                      </Button>
                    )}
                    {status !== "PUBLISHED" && (
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" disabled={saving !== null} className="w-full">
                            <Globe2 className="h-4 w-4" /> Publikasikan
                          </Button>
                        }
                        title="Publikasikan objek budaya?"
                        description={`“${form.title || "Objek ini"}” akan tampil di situs publik. Pastikan konten dan media sudah lengkap.`}
                        confirmLabel="Ya, publikasikan"
                        loading={saving === "publish"}
                        onConfirm={() => void publish()}
                      />
                    )}
                    {status === "PUBLISHED" && (
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" disabled={saving !== null} className="w-full">
                            <Archive className="h-4 w-4" /> Arsipkan
                          </Button>
                        }
                        title="Arsipkan objek budaya?"
                        description={`“${form.title || "Objek ini"}” akan disembunyikan dari situs publik namun tetap tersimpan.`}
                        confirmLabel="Ya, arsipkan"
                        loading={saving === "archive"}
                        onConfirm={() => void archive()}
                      />
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (status === "PUBLISHED" && form.slug) {
                          window.open(`#/budaya/${form.slug}`, "_blank");
                        } else {
                          setPreviewOpen(true);
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" /> Pratinjau
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="outline" disabled={saving !== null} className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" /> Hapus Objek
                        </Button>
                      }
                      title="Hapus objek budaya?"
                      description={`“${form.title || "Objek ini"}” akan dihapus permanen beserta media, hotspot, dan sumber terkait. Tindakan ini tidak dapat dibatalkan.`}
                      confirmLabel="Ya, hapus permanen"
                      destructive
                      loading={saving === "delete"}
                      onConfirm={() => void remove()}
                    />
                  </>
                ) : (
                  <>
                    <Button onClick={() => void doCreate(false)} disabled={saving !== null}>
                      {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Simpan Draft
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="outline" disabled={saving !== null} className="w-full">
                          <Globe2 className="h-4 w-4" /> Publikasikan
                        </Button>
                      }
                      title="Publikasikan objek baru?"
                      description={`“${form.title || "Objek ini"}” akan dibuat dan langsung tampil di situs publik. Pastikan konten dan media sudah lengkap.`}
                      confirmLabel="Ya, buat & publikasikan"
                      loading={saving === "publish"}
                      onConfirm={() => void doCreate(true)}
                    />
                    <p className="rounded-xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                      Hotspot 3D dapat diatur setelah objek disimpan dan memiliki model 3D.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-teal/5">
            <CardContent className="flex items-start gap-2.5 p-4">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" aria-hidden />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Keamanan sesungguhnya divalidasi di server — peran Anda:{" "}
                <span className="font-bold text-brand-ink">{user?.role ?? "-"}</span>.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Dialog pratinjau draft */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Pratinjau Draft</DialogTitle>
            <DialogDescription>Berikut tampilan model 3D & ringkasan objek sebelum dipublikasikan.</DialogDescription>
          </DialogHeader>
          <Alert className="border-brand-gold/50 bg-brand-gold/10">
            <Sparkles className="h-4 w-4 text-brand-orange" />
            <AlertDescription className="text-sm text-brand-ink">
              Ini pratinjau draft — objek <span className="font-semibold">belum dipublikasikan</span> di situs publik.
            </AlertDescription>
          </Alert>
          {form.model && <ModelViewer item={previewItem} height={360} showHotspots />}
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-brand-ink">{previewItem.title}</h3>
            <p className="text-sm text-muted-foreground">{previewItem.summary || "Ringkasan belum diisi."}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
