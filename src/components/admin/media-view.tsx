"use client";

/**
 * WaraNusa CMS — Media Manager
 * Grid pustaka media dengan pencarian, filter tipe/status, unggah (drag-drop),
 * detail aset (pratinjau, metadata, info berkas, relasi penggunaan), arsip & hapus.
 */
import { useEffect, useRef, useState } from "react";
import { buildQuery, navigate, type Route } from "@/lib/router";
import { api, ApiError } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import type { MediaAsset } from "@/lib/types";
import { MEDIA_TYPES, labelMediaType, type MediaType } from "@/lib/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/shared/states";
import {
  AudioPlayButton,
  MediaPreview,
  MiniPager,
  UploadInline,
  fakeItemForAsset,
  fmtDateID,
  humanSize,
} from "./media-picker";
import { cn } from "@/lib/utils";
import { normalizeSketchfabEmbed } from "@/lib/media-embed";
import ModelViewer from "@/components/three/model-viewer";
import {
  ArchiveRestore,
  CloudUpload,
  FileArchive,
  Images,
  Link2,
  Loader2,
  Pencil,
  Save,
  Search,
  Trash2,
  Upload,
  Users2,
} from "lucide-react";

interface MetaForm {
  name: string;
  description: string;
  license: string;
  attribution: string;
}

export function MediaView({ route }: { route: Route }) {
  const user = useAuth((s) => s.user);
  const canManage = !!user && (user.role === "SUPER_ADMIN" || user.role === "EDITOR");

  // ---- Filter dari route query (?q=&type=&page=) ----
  const q = route.query.q ?? "";
  const type = (MEDIA_TYPES.includes(route.query.type as MediaType) ? route.query.type : "") as MediaType | "";
  const page = Math.max(1, Number(route.query.page ?? "1") || 1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [search, setSearch] = useState(q);
  const firstSearch = useRef(true);
  useEffect(() => {
    setSearch(q);
  }, [q]);
  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      navigate(buildQuery("admin/media", { q: search || undefined, type: type || undefined }), { replace: true });
    }, 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const applyFilter = (patch: Record<string, string | undefined>) => {
    navigate(
      buildQuery("admin/media", {
        q: q || undefined,
        type: type || undefined,
        page: page > 1 ? String(page) : undefined,
        ...patch,
      })
    );
  };

  // ---- Daftar media ----
  const listQ = useAsyncData(
    () =>
      api.admin.media.list({
        page,
        pageSize: 18,
        type: type || undefined,
        search: q || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
    [page, q, type, statusFilter]
  );

  // ---- Upload dialog (juga menerima file dari drop area grid) ----
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadNonce, setUploadNonce] = useState(0);
  const [droppedFiles, setDroppedFiles] = useState<File[] | undefined>(undefined);
  const [dragOver, setDragOver] = useState(false);
  const [upType, setUpType] = useState<string>("AUTO");
  const [upMeta, setUpMeta] = useState<{ name: string; description: string; license: string; attribution: string }>({
    name: "",
    description: "",
    license: "",
    attribution: "",
  });

  const openUploadDialog = (files?: File[]) => {
    setDroppedFiles(files);
    setUploadNonce((n) => n + 1);
    setUpType("AUTO");
    setUpMeta({ name: "", description: "", license: "", attribution: "" });
    setUploadOpen(true);
  };

  // ---- Dialog embed Sketchfab (model 3D eksternal tanpa berkas) ----
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedSaving, setEmbedSaving] = useState(false);
  const [embedForm, setEmbedForm] = useState({ url: "", name: "", attribution: "", license: "", description: "" });
  const [embedErrors, setEmbedErrors] = useState<Record<string, string>>({});

  const openEmbedDialog = () => {
    setEmbedForm({ url: "", name: "", attribution: "", license: "", description: "" });
    setEmbedErrors({});
    setEmbedOpen(true);
  };

  const submitEmbed = async () => {
    const errs: Record<string, string> = {};
    const norm = normalizeSketchfabEmbed(embedForm.url);
    if (!norm.ok) errs.url = norm.error;
    if (!embedForm.name.trim()) errs.name = "Nama media wajib diisi.";
    setEmbedErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setEmbedSaving(true);
    try {
      const { data } = await api.admin.media.embed({
        name: embedForm.name.trim(),
        embedUrl: norm.ok ? norm.embedUrl : embedForm.url,
        attribution: embedForm.attribution.trim() || undefined,
        license: embedForm.license.trim() || undefined,
        description: embedForm.description.trim() || undefined,
      });
      toast.success(`Model embed "${data.name}" terdaftar.`);
      setEmbedOpen(false);
      await listQ.refetch();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.fields) setEmbedErrors(e.fields);
        toast.error(e.message);
      } else {
        toast.error("Gagal mendaftarkan model embed.");
      }
    } finally {
      setEmbedSaving(false);
    }
  };

  const handleDropFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    openUploadDialog(Array.from(files));
  };

  // ---- Detail dialog ----
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MediaAsset | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [meta, setMeta] = useState<MetaForm>({ name: "", description: "", license: "", attribution: "" });
  const [metaErrors, setMetaErrors] = useState<Record<string, string>>({});
  const [savingMeta, setSavingMeta] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  useEffect(() => {
    if (!detailId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetail(null);
    api.admin.media
      .detail(detailId)
      .then(({ data }) => {
        if (cancelled) return;
        setDetail(data);
        setMeta({ name: data.name, description: data.description ?? "", license: data.license ?? "", attribution: data.attribution ?? "" });
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "Gagal memuat detail media.");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const saveMeta = async () => {
    if (!detail) return;
    if (!meta.name.trim()) {
      setMetaErrors({ name: "Nama media wajib diisi." });
      return;
    }
    setMetaErrors({});
    setSavingMeta(true);
    try {
      const { data } = await api.admin.media.update(detail.id, {
        name: meta.name.trim(),
        description: meta.description.trim() || undefined,
        license: meta.license.trim() || undefined,
        attribution: meta.attribution.trim() || undefined,
      });
      setDetail(data);
      toast.success("Metadata media disimpan.");
      await listQ.refetch();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.fields) setMetaErrors(e.fields);
        toast.error(e.message);
      } else {
        toast.error("Gagal menyimpan metadata.");
      }
    } finally {
      setSavingMeta(false);
    }
  };

  const toggleStatus = async () => {
    if (!detail) return;
    setBusyStatus(true);
    try {
      const next = detail.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
      const { data } = await api.admin.media.update(detail.id, { status: next });
      setDetail(data);
      toast.success(next === "ARCHIVED" ? `“${data.name}” diarsipkan.` : `“${data.name}” diaktifkan kembali.`);
      await listQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengubah status media.");
    } finally {
      setBusyStatus(false);
    }
  };

  const doDelete = async () => {
    if (!detail) return;
    setBusyDelete(true);
    try {
      await api.admin.media.delete(detail.id);
      toast.success(`Media “${detail.name}” dihapus.`);
      setDetailId(null);
      setDetail(null);
      await listQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menghapus media.");
    } finally {
      setBusyDelete(false);
    }
  };

  const assets = listQ.data ?? [];
  const metaInfo = listQ.meta;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">Media Manager</h1>
          <p className="text-sm text-muted-foreground">Pustaka gambar, audio, model 3D, dan tekstur koleksi budaya.</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openEmbedDialog}>
              <Link2 className="h-4 w-4" /> Embed Sketchfab
            </Button>
            <Button onClick={() => openUploadDialog()}>
              <Upload className="h-4 w-4" /> Unggah Media
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar filter */}
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama media…" className="pl-9" aria-label="Cari media" />
          </div>
          <Select value={type || "ALL"} onValueChange={(v) => applyFilter({ type: v === "ALL" ? undefined : v, page: undefined })}>
            <SelectTrigger aria-label="Filter tipe media" className="w-full">
              <SelectValue placeholder="Semua tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              {MEDIA_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {labelMediaType(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); applyFilter({ page: undefined }); }}>
            <SelectTrigger aria-label="Filter status media" className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="ARCHIVED">Arsip</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Area grid — menerima drag-drop berkas */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (canManage) handleDropFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-3 transition-colors sm:p-4",
          dragOver ? "border-brand-teal bg-brand-teal/5" : "border-transparent"
        )}
      >
        {listQ.error ? (
          <ErrorState message={listQ.error} onRetry={listQ.refetch} />
        ) : listQ.loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <EmptyState
            icon={Images}
            title={q || type ? "Tidak ada media cocok" : "Belum ada media"}
            message={
              canManage
                ? "Tarik & lepas berkas ke area ini, atau tekan tombol Unggah Media."
                : "Belum ada aset media yang cocok dengan filter."
            }
            className="border-2 border-dashed"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {assets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setDetailId(a.id)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-brand-teal/60 hover:shadow-md"
                aria-label={`Buka detail media ${a.name}`}
              >
                <div className="relative aspect-square w-full overflow-hidden bg-secondary">
                  <MediaPreview asset={a} />
                  {a.type === "AUDIO" && (
                    <span className="absolute left-1.5 top-1.5" onClick={(e) => e.stopPropagation()}>
                      <AudioPlayButton src={a.url} label={a.name} />
                    </span>
                  )}
                  {a.status === "ARCHIVED" && (
                    <span className="absolute right-1.5 top-1.5">
                      <Badge className="bg-stone-600 text-[9px] text-white">ARSIP</Badge>
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 p-2">
                  <p className="truncate text-xs font-bold text-brand-ink" title={a.name}>
                    {a.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {labelMediaType(a.type)} · {humanSize(a.size)} · {fmtDateID(a.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {metaInfo && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Total <span className="font-bold text-brand-ink">{metaInfo.total}</span> aset
            </p>
            <MiniPager page={metaInfo.page} totalPages={metaInfo.totalPages} onPage={(p) => applyFilter({ page: String(p) })} />
          </div>
        )}
      </div>

      {/* Dialog unggah */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Unggah Media Baru</DialogTitle>
            <DialogDescription>
              Tipe dideteksi otomatis dari berkas, atau paksa tipe tertentu. Batas ukuran: Gambar 5 MB · Audio 15 MB · Model 3D 30 MB.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="up-type">Tipe Media</Label>
                <Select value={upType} onValueChange={setUpType}>
                  <SelectTrigger id="up-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Deteksi otomatis</SelectItem>
                    {MEDIA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {labelMediaType(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-name">Nama Media</Label>
                <Input
                  id="up-name"
                  value={upMeta.name}
                  onChange={(e) => setUpMeta((m) => ({ ...m, name: e.target.value }))}
                  placeholder="Kosongkan = nama berkas"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="up-license">Lisensi</Label>
                <Input
                  id="up-license"
                  value={upMeta.license}
                  onChange={(e) => setUpMeta((m) => ({ ...m, license: e.target.value }))}
                  placeholder="cth. CC BY-SA 4.0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="up-attr">Atribusi</Label>
                <Input
                  id="up-attr"
                  value={upMeta.attribution}
                  onChange={(e) => setUpMeta((m) => ({ ...m, attribution: e.target.value }))}
                  placeholder="cth. Museum Nasional"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-desc">Deskripsi</Label>
              <Textarea
                id="up-desc"
                value={upMeta.description}
                onChange={(e) => setUpMeta((m) => ({ ...m, description: e.target.value }))}
                rows={2}
                placeholder="Keterangan singkat aset media…"
              />
            </div>
          </div>
          <UploadInline
            key={uploadNonce}
            type={upType === "AUTO" ? undefined : (upType as MediaType)}
            metadata={upMeta}
            initialFiles={droppedFiles}
            onUploaded={() => {
              void listQ.refetch();
            }}
            onAllSettled={() => {
              void listQ.refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog embed Sketchfab */}
      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Daftarkan Model Embed Sketchfab</DialogTitle>
            <DialogDescription>
              Tempel URL halaman atau embed model dari sketchfab.com. Model tetap milik pembuatnya —
              wajib sertakan atribusi. Contoh: https://sketchfab.com/3d-models/joglo-house-4816e9b9…
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emb-url">URL Model Sketchfab *</Label>
              <Input
                id="emb-url"
                value={embedForm.url}
                onChange={(e) => setEmbedForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://sketchfab.com/models/…/embed"
                aria-invalid={!!embedErrors.url}
                inputMode="url"
              />
              {embedErrors.url && <p className="text-xs font-medium text-destructive">{embedErrors.url}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emb-name">Nama Media *</Label>
              <Input
                id="emb-name"
                value={embedForm.name}
                onChange={(e) => setEmbedForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="cth. Joglo House — Sketchfab"
                aria-invalid={!!embedErrors.name}
              />
              {embedErrors.name && <p className="text-xs font-medium text-destructive">{embedErrors.name}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="emb-attr">Atribusi</Label>
                <Input
                  id="emb-attr"
                  value={embedForm.attribution}
                  onChange={(e) => setEmbedForm((f) => ({ ...f, attribution: e.target.value }))}
                  placeholder="cth. Joglo House oleh ilhamsbi di Sketchfab"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emb-lic">Lisensi</Label>
                <Input
                  id="emb-lic"
                  value={embedForm.license}
                  onChange={(e) => setEmbedForm((f) => ({ ...f, license: e.target.value }))}
                  placeholder="Kosongkan bila merujuk halaman model"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emb-desc">Deskripsi</Label>
              <Textarea
                id="emb-desc"
                value={embedForm.description}
                onChange={(e) => setEmbedForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Keterangan singkat model…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEmbedOpen(false)} disabled={embedSaving}>
              Batal
            </Button>
            <Button onClick={() => void submitEmbed()} disabled={embedSaving}>
              {embedSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Daftarkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog detail */}
      <Dialog open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          {detailLoading || !detail ? (
            <div className="space-y-3 py-4">
              {/* Judul sr-only:DialogContent wajib punya DialogTitle sejak awal (a11y) */}
              <DialogHeader className="sr-only">
                <DialogTitle>Detail media</DialogTitle>
                <DialogDescription>Memuat detail aset media.</DialogDescription>
              </DialogHeader>
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-8 w-2/3 rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{detail.name}</DialogTitle>
                <DialogDescription>
                  Diunggah {fmtDateID(detail.createdAt, true)}
                  {detail.uploader ? ` oleh ${detail.uploader.name}` : ""}
                </DialogDescription>
              </DialogHeader>

              {/* Pratinjau besar */}
              <div className="overflow-hidden rounded-xl border border-border bg-secondary">
                {detail.type === "IMAGE" || detail.type === "TEXTURE" || detail.type === "THUMBNAIL" ? (
                  <img src={detail.url} alt={detail.name} className="mx-auto max-h-72 w-auto object-contain" />
                ) : detail.type === "AUDIO" ? (
                  <div className="flex flex-col items-center gap-3 p-6">
                    <MediaPreview asset={detail} className="h-20 w-20 rounded-2xl" />
                    <audio controls src={detail.url} className="w-full max-w-sm" aria-label={`Pemutar audio ${detail.name}`} />
                  </div>
                ) : detail.type === "MODEL_3D" ? (
                  <ModelViewer item={fakeItemForAsset(detail)} height={300} />
                ) : (
                  <MediaPreview asset={detail} className="h-40" />
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Metadata (edit) */}
                <div className="space-y-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Metadata
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-name">Nama</Label>
                    <Input
                      id="m-name"
                      value={meta.name}
                      onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
                      aria-invalid={!!metaErrors.name}
                    />
                    {metaErrors.name && <p className="text-xs font-medium text-destructive">{metaErrors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-desc">Deskripsi</Label>
                    <Textarea id="m-desc" value={meta.description} onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))} rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-lic">Lisensi</Label>
                    <Input id="m-lic" value={meta.license} onChange={(e) => setMeta((m) => ({ ...m, license: e.target.value }))} placeholder="cth. CC BY-SA 4.0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-attr">Atribusi</Label>
                    <Input id="m-attr" value={meta.attribution} onChange={(e) => setMeta((m) => ({ ...m, attribution: e.target.value }))} placeholder="cth. Museum Nasional" />
                  </div>
                  <Button size="sm" onClick={() => void saveMeta()} disabled={savingMeta}>
                    {savingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Metadata
                  </Button>
                </div>

                {/* Info berkas + relasi */}
                <div className="space-y-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <FileArchive className="h-3.5 w-3.5" aria-hidden /> Info Berkas
                  </p>
                  <dl className="space-y-1.5 rounded-xl border border-border bg-secondary/40 p-3 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Tipe</dt>
                      <dd className="font-semibold">{labelMediaType(detail.type)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Format</dt>
                      <dd className="font-mono font-semibold uppercase">{detail.format}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">MIME</dt>
                      <dd className="max-w-40 truncate font-mono" title={detail.mimeType}>
                        {detail.mimeType}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Ukuran</dt>
                      <dd className="font-semibold">{humanSize(detail.size)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>
                        <Badge variant="outline" className={detail.status === "ACTIVE" ? "border-brand-tropic/40 bg-brand-tropic/10 text-brand-tropic" : ""}>
                          {detail.status === "ACTIVE" ? "Aktif" : "Arsip"}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground">Lokasi simpan</dt>
                      <dd className="break-all font-mono text-[10px]">
                        {detail.storagePath ?? "— (embed eksternal, tanpa berkas lokal)"}
                      </dd>
                    </div>
                    {detail.embedUrl && (
                      <div className="flex flex-col gap-0.5">
                        <dt className="text-muted-foreground">URL Embed</dt>
                        <dd className="break-all font-mono text-[10px]">
                          <a href={detail.embedUrl} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">
                            {detail.embedUrl}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>

                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Users2 className="h-3.5 w-3.5" aria-hidden /> Relasi Penggunaan ({detail.usedBy?.length ?? 0})
                  </p>
                  {detail.usedBy && detail.usedBy.length > 0 ? (
                    <ul className="space-y-1.5 rounded-xl border border-border bg-secondary/40 p-3">
                      {detail.usedBy.map((u) => (
                        <li key={`${u.itemId}-${u.role}`} className="flex items-center justify-between gap-2 text-xs">
                          <span className="min-w-0 truncate font-semibold text-brand-ink" title={u.itemTitle}>
                            {u.itemTitle}
                          </span>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {u.role === "cover" ? "Sampul" : u.role === "model" ? "Model 3D" : u.role === "audio" ? "Audio" : u.role === "gallery" ? "Galeri" : u.role}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
                      Belum dipakai objek budaya mana pun.
                    </p>
                  )}
                </div>
              </div>

              {canManage && (
                <>
                  <Separator />
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => void toggleStatus()} disabled={busyStatus}>
                      {busyStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4" />}
                      {detail.status === "ACTIVE" ? "Arsipkan" : "Aktifkan"}
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" /> Hapus
                        </Button>
                      }
                      title="Hapus media?"
                      description={`“${detail.name}” akan dihapus permanen dari pustaka. Jika masih dipakai objek budaya, server akan menolak (409) — periksa relasi penggunaan di atas.`}
                      confirmLabel="Ya, hapus"
                      destructive
                      loading={busyDelete}
                      onConfirm={() => void doDelete()}
                    />
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast hint untuk drag-drop */}
      {dragOver && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center" aria-hidden>
          <span className="flex items-center gap-2 rounded-full bg-brand-ink px-4 py-2 text-xs font-bold text-white shadow-lg">
            <CloudUpload className="h-4 w-4" /> Lepaskan berkas untuk mengunggah
          </span>
        </div>
      )}
    </div>
  );
}
