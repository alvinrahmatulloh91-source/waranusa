"use client";

/**
 * WaraNusa CMS — Media Picker & Uploader
 * - MediaPicker      : dialog pustaka media (grid, cari, filter tipe, unggah, pilih)
 * - MediaPickerButton: tombol pembuka picker + kartu nilai terpilih (single/multi)
 * - UploadInline     : area unggah drag-drop dengan progress XHR
 * - Helper bersama   : humanSize, fmtDateID, slugify, detectMediaType, MiniPager, MediaPreview
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api-client";
import type { CulturalItem, MediaAsset, PageMeta } from "@/lib/types";
import { MAX_UPLOAD_BYTES, labelMediaType, type MediaType } from "@/lib/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState, ErrorState } from "@/components/shared/states";
import ModelViewer from "@/components/three/model-viewer";
import {
  AudioLines,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Eye,
  Globe,
  Loader2,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

// ================= Helper bersama (dipakai lintas view admin) =================

/** Ukuran file yang enak dibaca manusia. */
export function humanSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Tanggal format id-ID. */
export function fmtDateID(iso?: string | null, withTime = false): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat(
      "id-ID",
      withTime
        ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
        : { day: "numeric", month: "short", year: "numeric" }
    ).format(new Date(iso));
  } catch {
    return "-";
  }
}

/** Slug ramah URL dari judul. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Deteksi tipe media dari mime/ekstensi (fallback server yang memvalidasi). */
export function detectMediaType(file: File): MediaType {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("audio/")) return "AUDIO";
  if (file.type === "model/gltf-binary" || file.type === "model/gltf+json" || ext === "glb" || ext === "gltf") return "MODEL_3D";
  if (file.type.startsWith("image/")) return "IMAGE";
  return "IMAGE";
}

/** Item budaya minimal untuk preview ModelViewer dari sebuah aset media. */
export function fakeItemForAsset(asset: MediaAsset): CulturalItem {
  return {
    id: "preview",
    slug: "generic",
    title: asset.name,
    summary: "Pratinjau aset 3D di Media Manager WaraNusa.",
    description: "Pratinjau aset 3D di Media Manager WaraNusa.",
    status: "DRAFT",
    featured: false,
    viewCount: 0,
    category: { id: "preview", slug: "generic", name: "Pratinjau" },
    region: { id: "preview", code: "ID-XX", name: "Indonesia", islandGroup: "JAWA", summary: "Pratinjau", lat: -6.2, lng: 106.8 },
    modelMedia: asset,
    createdAt: asset.createdAt,
    updatedAt: asset.createdAt,
  };
}

/** Pager mini (sebelumnya/berikutnya + info halaman) untuk grid & tabel. */
export function MiniPager({
  page,
  totalPages,
  onPage,
  className,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className={cn("flex items-center justify-center gap-3 pt-2", className)}>
      <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Halaman sebelumnya">
        <ChevronLeft className="h-4 w-4" /> Sebelumnya
      </Button>
      <span className="text-xs font-semibold text-muted-foreground">
        Halaman {page} dari {totalPages}
      </span>
      <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Halaman berikutnya">
        Berikutnya <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Pratinjau visual aset sesuai tipe (gambar / audio / model 3D / embed). */
export function MediaPreview({ asset, className }: { asset: MediaAsset; className?: string }) {
  if (asset.type === "IMAGE" || asset.type === "THUMBNAIL" || asset.type === "TEXTURE") {
    return (
      <img src={asset.url} alt={asset.name} loading="lazy" className={cn("h-full w-full object-cover", className)} />
    );
  }
  if (asset.type === "AUDIO") {
    return (
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-1 bg-brand-teal/10 text-brand-teal", className)}>
        <AudioLines className="h-6 w-6" aria-hidden />
        <span className="px-1 text-center text-[10px] font-bold uppercase">{asset.format}</span>
      </div>
    );
  }
  if (asset.type === "MODEL_3D" && asset.embedUrl) {
    // Embed eksternal (mis. Sketchfab): JANGAN render iframe di grid — cukup badge.
    return (
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-1 bg-brand-gold/10 text-brand-gold", className)}>
        <Globe className="h-6 w-6" aria-hidden />
        <span className="px-1 text-center text-[10px] font-bold uppercase">Embed · {asset.format}</span>
      </div>
    );
  }
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-1 bg-brand-sea/10 text-brand-sea", className)}>
      <Box className="h-6 w-6" aria-hidden />
      <span className="px-1 text-center text-[10px] font-bold uppercase">{asset.format}</span>
    </div>
  );
}

/** Tombol putar/jeda audio kecil (dipakai di picker, manager, dan editor). */
export function AudioPlayButton({ src, label }: { src: string; label?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <span className="inline-flex items-center">
      <audio
        ref={ref}
        src={src}
        preload="none"
        onEnded={() => setPlaying(false)}
        className="hidden"
        aria-label={label ? `Rekaman audio ${label}` : "Rekaman audio"}
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-8 w-8 rounded-full"
        aria-label={playing ? `Jeda ${label ?? "audio"}` : `Putar ${label ?? "audio"}`}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (playing) {
            el.pause();
            setPlaying(false);
          } else {
            el.play()
              .then(() => setPlaying(true))
              .catch(() => toast.error("Audio tidak dapat diputar di peramban ini."));
          }
        }}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
    </span>
  );
}

// ================= UploadInline =================

interface UploadTask {
  id: string;
  file: File;
  type: MediaType;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  asset?: MediaAsset;
}

/**
 * Area unggah drag-drop + input file dengan progress XHR per berkas.
 * Validasi ukuran ringan di klien (MAX_UPLOAD_BYTES); pesan error server (422) tetap ditampilkan.
 */
export function UploadInline({
  type,
  initialFiles,
  metadata,
  onUploaded,
  onAllSettled,
}: {
  /** Jika diisi, berkas wajib bertipe ini (dipakai MediaPicker). */
  type?: MediaType;
  initialFiles?: File[];
  /** Metadata opsional yang dikirim bersama unggahan (dipakai Media Manager). */
  metadata?: { name?: string; description?: string; license?: string; attribution?: string };
  onUploaded?: (asset: MediaAsset) => void;
  onAllSettled?: () => void;
}) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const busyRef = useRef(false);

  const patchTask = useCallback((id: string, patch: Partial<UploadTask>) => {
    setTasks((rows) => rows.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const runUpload = useCallback(
    async (queue: UploadTask[]) => {
      if (busyRef.current) return;
      busyRef.current = true;
      for (const task of queue) {
        patchTask(task.id, { status: "uploading", progress: 0 });
        try {
          const baseName = task.file.name.replace(/\.[^.]+$/, "");
          const { data } = await api.admin.media.upload(
            task.file,
            {
              name: metadata?.name?.trim() && queue.length === 1 ? metadata.name.trim() : baseName,
              type: task.type,
              description: metadata?.description?.trim() || undefined,
              license: metadata?.license?.trim() || undefined,
              attribution: metadata?.attribution?.trim() || undefined,
            },
            (pct) => patchTask(task.id, { progress: pct })
          );
          patchTask(task.id, { status: "done", progress: 100, asset: data });
          onUploaded?.(data);
        } catch (e) {
          const msg = e instanceof ApiError ? e.message : "Unggahan gagal.";
          patchTask(task.id, { status: "error", error: msg });
        }
      }
      busyRef.current = false;
      onAllSettled?.();
    },
    [onUploaded, onAllSettled, patchTask, metadata]
  );

  const handleFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (!files) return;
      const list = Array.from(files);
      if (!list.length) return;
      const next: UploadTask[] = list.map((file, i) => {
        const detected = detectMediaType(file);
        const t: MediaType = type ?? detected;
        const max = MAX_UPLOAD_BYTES[t];
        if (type && detected !== type) {
          return {
            id: `${Date.now()}-${i}`,
            file,
            type: t,
            progress: 0,
            status: "error",
            error: `Tipe berkas (${labelMediaType(detected)}) tidak sesuai — dibutuhkan ${labelMediaType(type)}.`,
          };
        }
        if (file.size > max) {
          return {
            id: `${Date.now()}-${i}`,
            file,
            type: t,
            progress: 0,
            status: "error",
            error: `Ukuran maksimal ${humanSize(max)} (berkas ${humanSize(file.size)}).`,
          };
        }
        return { id: `${Date.now()}-${i}`, file, type: t, progress: 0, status: "pending" };
      });
      setTasks((rows) => [...rows, ...next]);
      void runUpload(next.filter((t) => t.status === "pending"));
    },
    [runUpload, type]
  );

  // Berkas yang di-drop dari luar dialog/grid Media Manager.
  useEffect(() => {
    if (initialFiles && initialFiles.length) {
      const t = window.setTimeout(() => handleFiles(initialFiles), 0);
      return () => window.clearTimeout(t);
    }
  }, [initialFiles]);

  const accept = type === "IMAGE" ? "image/*" : type === "AUDIO" ? "audio/*" : type === "MODEL_3D" ? ".glb,.gltf,model/gltf-binary" : undefined;
  const hasActive = tasks.some((t) => t.status === "uploading" || t.status === "pending");

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Area unggah berkas — klik atau jatuhkan berkas di sini"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-brand-teal bg-brand-teal/10" : "border-border bg-secondary/50 hover:border-brand-teal/60 hover:bg-brand-teal/5"
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-teal/10">
          <CloudUpload className="h-5 w-5 text-brand-teal" aria-hidden />
        </div>
        <p className="text-sm font-semibold">Tarik & lepas berkas di sini</p>
        <p className="text-xs text-muted-foreground">
          atau klik untuk memilih {type ? `(${labelMediaType(type)}, maks ${humanSize(MAX_UPLOAD_BYTES[type])})` : "berkas"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          aria-label="Pilih berkas untuk diunggah"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {tasks.length > 0 && (
        <ul className="space-y-2" aria-live="polite">
          {tasks.map((t) => (
            <li key={t.id} className="rounded-lg border border-border bg-background px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{t.file.name}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{humanSize(t.file.size)}</span>
                {t.status === "done" && <Check className="h-4 w-4 shrink-0 text-brand-tropic" aria-label="Selesai" />}
                {t.status === "error" && <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" aria-label="Gagal" />}
                {t.status === "uploading" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-teal" aria-label="Mengunggah" />}
              </div>
              {t.status === "uploading" && <Progress value={t.progress} className="mt-1.5 h-1.5" aria-label={`Progres unggah ${t.file.name}`} />}
              {t.error && <p className="mt-1 text-xs text-destructive">{t.error}</p>}
            </li>
          ))}
        </ul>
      )}

      {hasActive && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengunggah… biarkan jendela ini terbuka.
        </p>
      )}
    </div>
  );
}

// ================= MediaPicker =================

/**
 * Dialog pustaka media: grid 24/halaman, pencarian, pilih (single radio / multi checkbox),
 * unggah baru inline, dan konfirmasi yang mengembalikan MediaAsset[].
 */
export function MediaPicker({
  open,
  onOpenChange,
  type,
  multiple = false,
  selectedIds = [],
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: MediaType;
  multiple?: boolean;
  selectedIds?: string[];
  onConfirm: (assets: MediaAsset[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [known, setKnown] = useState<Record<string, MediaAsset>>({});
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Reset saat dialog dibuka
  useEffect(() => {
    if (open) {
      setSearch("");
      setDebounced("");
      setPage(1);
      setSel([...selectedIds]);
      setUploadOpen(false);
    }
  }, [open, type]);

  // Debounce pencarian
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const fetchList = useCallback(
    async (silent = false) => {
      if (!open) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await api.admin.media.list({ type, search: debounced || undefined, page, pageSize: 24 });
        setAssets(res.data);
        setMeta(res.meta ?? null);
        setKnown((k) => {
          const next = { ...k };
          for (const a of res.data) next[a.id] = a;
          return next;
        });
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Gagal memuat pustaka media.");
      } finally {
        setLoading(false);
      }
    },
    [open, type, debounced, page]
  );

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const toggle = (id: string) => {
    setSel((cur) => (multiple ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : cur[0] === id ? [] : [id]));
  };

  const confirm = () => {
    const picked = sel.map((id) => known[id]).filter(Boolean);
    onConfirm(picked);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pilih Media — {labelMediaType(type)}</DialogTitle>
          <DialogDescription>
            {multiple ? "Pilih satu atau beberapa aset, lalu tekan Gunakan." : "Pilih satu aset untuk digunakan."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama berkas…"
              className="pl-9"
              aria-label="Cari media"
            />
          </div>
          <Button type="button" variant={uploadOpen ? "secondary" : "outline"} onClick={() => setUploadOpen((v) => !v)}>
            <CloudUpload className="h-4 w-4" /> {uploadOpen ? "Tutup unggah" : "Unggah baru"}
          </Button>
        </div>

        {uploadOpen && (
          <div className="rounded-xl border border-border bg-secondary/40 p-3">
            <UploadInline
              type={type}
              onUploaded={(a) => {
                toast.success(`Media "${a.name}" berhasil diunggah.`);
                setPage(1);
                setDebounced("");
                setSearch("");
                setSel((cur) => (multiple ? [...cur, a.id] : [a.id]));
                void fetchList(true);
              }}
            />
          </div>
        )}

        <div className="min-h-0 flex-1">
          {error ? (
            <ErrorState message={error} onRetry={() => void fetchList()} />
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Tidak ada media"
              message={debounced ? `Tidak ditemukan untuk “${debounced}”.` : "Pustaka masih kosong untuk tipe ini — unggah terlebih dahulu."}
            />
          ) : (
            <ScrollArea className="h-[46vh] pr-2">
              <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-4">
                {assets.map((a) => {
                  const active = sel.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggle(a.id)}
                      aria-pressed={active}
                      aria-label={`Pilih media ${a.name}`}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border bg-background text-left transition-all",
                        active ? "border-brand-teal ring-2 ring-brand-teal" : "border-border hover:border-brand-teal/60"
                      )}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-secondary">
                        <MediaPreview asset={a} />
                      </div>
                      {a.type === "AUDIO" && (
                        <span className="absolute left-1.5 top-1.5" onClick={(e) => e.stopPropagation()}>
                          <AudioPlayButton src={a.url} label={a.name} />
                        </span>
                      )}
                      <span
                        className={cn(
                          "absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                          active ? "border-brand-teal bg-brand-teal text-white" : "border-white/70 bg-black/40 text-transparent group-hover:border-white"
                        )}
                      >
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      <div className="space-y-0.5 px-2 py-1.5">
                        <p className="truncate text-[11px] font-semibold" title={a.name}>
                          {a.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {humanSize(a.size)} · {fmtDateID(a.createdAt)}
                          {a.status === "ARCHIVED" && " · Arsip"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Halaman sebelumnya">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-muted-foreground">
                {meta.page}/{meta.totalPages}
              </span>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Halaman berikutnya">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{meta ? `${meta.total} aset` : ""}</span>
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="button" disabled={sel.length === 0} onClick={confirm}>
              Gunakan{sel.length > 0 ? ` (${sel.length})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ================= MediaPickerButton =================

/**
 * Tombol yang membuka MediaPicker dan menampilkan nilai terpilih.
 * `value` selalu array: single → 0/1 elemen, multi → banyak.
 */
export function MediaPickerButton({
  type,
  multiple = false,
  value,
  onChange,
  label,
  className,
}: {
  type: MediaType;
  multiple?: boolean;
  value: MediaAsset[];
  onChange: (assets: MediaAsset[]) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view3d, setView3d] = useState<MediaAsset | null>(null);

  const handleConfirm = (assets: MediaAsset[]) => {
    onChange(multiple ? assets : assets.slice(0, 1));
  };

  // ---- Mode multi: galeri thumbnail ----
  if (multiple) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {value.map((a) => (
            <div key={a.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
              <MediaPreview asset={a} />
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.id !== a.id))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`Hapus ${a.name} dari galeri`}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
              {a.type === "AUDIO" && (
                <span className="absolute left-1 top-1">
                  <AudioPlayButton src={a.url} label={a.name} />
                </span>
              )}
              <span className="pointer-events-none absolute inset-x-1 bottom-1 truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {a.name}
              </span>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-teal/50 bg-brand-teal/5 text-brand-teal transition hover:bg-brand-teal/10"
            aria-label={label ?? "Tambah media"}
          >
            <Plus className="h-5 w-5" aria-hidden />
            <span className="px-1 text-center text-[10px] font-bold leading-tight">{label ?? "Tambah"}</span>
          </button>
        </div>
        <MediaPicker open={open} onOpenChange={setOpen} type={type} multiple selectedIds={value.map((v) => v.id)} onConfirm={handleConfirm} />
      </div>
    );
  }

  // ---- Mode single: kartu nilai tunggal ----
  const current = value[0] ?? null;
  return (
    <div className={cn("space-y-2", className)}>
      {current ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
            <MediaPreview asset={current} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold" title={current.name}>
              {current.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {labelMediaType(current.type)} · {current.format.toUpperCase()} · {humanSize(current.size)}
            </p>
            {current.type === "MODEL_3D" && (
              <Button type="button" variant="ghost" size="sm" className="mt-1 h-7 px-2 text-xs" onClick={() => setView3d(current)}>
                <Eye className="mr-1 h-3.5 w-3.5" aria-hidden /> Lihat 3D
              </Button>
            )}
            {current.type === "AUDIO" && (
              <span className="mt-1 flex">
                <AudioPlayButton src={current.url} label={current.name} />
              </span>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Ganti
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onChange([])}>
              <Trash2 className="h-3.5 w-3.5" /> Hapus
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/40 py-7 text-sm font-semibold text-muted-foreground transition hover:border-brand-teal/60 hover:bg-brand-teal/5 hover:text-brand-teal"
          aria-label={label ?? "Pilih media"}
        >
          <CloudUpload className="h-4.5 w-4.5" aria-hidden />
          {label ?? "Pilih media"}
        </button>
      )}

      <MediaPicker open={open} onOpenChange={setOpen} type={type} selectedIds={current ? [current.id] : []} onConfirm={handleConfirm} />

      <Dialog open={!!view3d} onOpenChange={(v) => !v && setView3d(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pratinjau Model 3D</DialogTitle>
            <DialogDescription>{view3d?.name}</DialogDescription>
          </DialogHeader>
          {view3d && <ModelViewer item={fakeItemForAsset(view3d)} height={340} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Badge tipe media kecil untuk konsistensi tampilan antar view. */
export function MediaTypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-semibold", className)}>
      {labelMediaType(type)}
    </Badge>
  );
}

/** Ikon refresh kecil yang sering dipakai ulang. */
export function RefreshButton({ onClick, loading, label = "Muat ulang" }: { onClick: () => void; loading?: boolean; label?: string }) {
  return (
    <Button type="button" variant="outline" size="icon" onClick={onClick} disabled={loading} aria-label={label} title={label}>
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
    </Button>
  );
}
