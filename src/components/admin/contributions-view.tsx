"use client";

/**
 * WaraNusa CMS — Moderasi Kontribusi
 * Tab per status + panel detail (deskripsi, riwayat peninjauan) dengan aksi:
 * mulai peninjauan, minta revisi (note wajib), setujui (note opsional + opsi
 * publikasi otomatis), dan tolak (note wajib).
 */
import { useState } from "react";
import { buildQuery, navigate, type Route } from "@/lib/router";
import { api, ApiError, contributionStatusColor } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import type { Contribution } from "@/lib/types";
import { labelContributionStatus } from "@/lib/constants";
import { toast } from "sonner";
import { fmtDateID, MiniPager } from "./media-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  HandHeart,
  MapPin,
  MessageSquareWarning,
  PlayCircle,
  ThumbsDown,
  UserRound,
  XCircle,
} from "lucide-react";

const TABS = [
  { value: "SUBMITTED", label: "Diajukan" },
  { value: "IN_REVIEW", label: "Menunggu Peninjauan" },
  { value: "NEEDS_REVISION", label: "Perlu Revisi" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "ALL", label: "Semua" },
] as const;

const ACTION_LABELS: Record<string, string> = {
  SUBMIT: "Diajukan",
  START_REVIEW: "Mulai Peninjauan",
  REQUEST_REVISION: "Revisi Diminta",
  APPROVE: "Disetujui",
  REJECT: "Ditolak",
};

type ModerationAction = "revise" | "approve" | "reject";

type StatusResult = Contribution & { culturalItemId?: string | null };

export function ContributionsView({ route }: { route: Route }) {
  const user = useAuth((s) => s.user);
  const canPublish = !!user && (user.role === "SUPER_ADMIN" || user.role === "EDITOR");

  const active = TABS.some((t) => t.value === route.query.status) ? (route.query.status as string) : "ALL";
  const page = Math.max(1, Number(route.query.page ?? "1") || 1);

  const listQ = useAsyncData(
    () => api.admin.contributions.list({ status: active === "ALL" ? undefined : active, page, pageSize: 12 }),
    [active, page]
  );

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Contribution | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Dialog aksi moderasi
  const [modAction, setModAction] = useState<ModerationAction | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [publishNow, setPublishNow] = useState(false);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await api.admin.contributions.detail(id);
      setDetail(data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat detail kontribusi.");
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const startReview = async (c: Contribution) => {
    setActionBusy(true);
    try {
      await api.admin.contributions.setStatus(c.id, { status: "IN_REVIEW" });
      toast.success(`Peninjauan dimulai untuk “${c.title}”.`);
      await listQ.refetch();
      if (detailId === c.id) await openDetail(c.id);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memulai peninjauan.");
    } finally {
      setActionBusy(false);
    }
  };

  const openModDialog = (action: ModerationAction) => {
    setModAction(action);
    setNote("");
    setNoteError("");
    setPublishNow(false);
  };

  const runModeration = async () => {
    if (!detail || !modAction) return;
    const requiresNote = modAction !== "approve";
    if (requiresNote && !note.trim()) {
      setNoteError(modAction === "revise" ? "Catatan revisi wajib diisi untuk kontributor." : "Alasan penolakan wajib diisi.");
      return;
    }
    setActionBusy(true);
    try {
      const payload =
        modAction === "revise"
          ? { status: "NEEDS_REVISION" as const, note: note.trim() }
          : modAction === "reject"
            ? { status: "REJECTED" as const, note: note.trim() }
            : { status: "APPROVED" as const, note: note.trim() || undefined, publishItemId: publishNow && canPublish ? true : undefined };
      const res = await api.admin.contributions.setStatus(detail.id, payload);
      const created = (res.data as StatusResult).culturalItemId;
      toast.success(
        modAction === "revise"
          ? "Permintaan revisi dikirim ke kontributor."
          : modAction === "reject"
            ? "Kontribusi ditolak."
            : "Kontribusi disetujui."
      );
      if (modAction === "approve" && publishNow && canPublish) {
        toast.info("Objek budaya draft dibuat" + (created ? " (ID: " + created.slice(0, 8) + "…)" : "") + " — lanjutkan penyuntingan di menu Objek Budaya.");
      }
      setModAction(null);
      setDetailId(null);
      await listQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Aksi moderasi gagal.");
    } finally {
      setActionBusy(false);
    }
  };

  const items = listQ.data ?? [];
  const metaInfo = listQ.meta;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">Kontribusi Masyarakat</h1>
        <p className="text-sm text-muted-foreground">Tinjau, revisi, atau setujui usulan konten budaya dari publik.</p>
      </div>

      <Tabs value={active} onValueChange={(v) => navigate(buildQuery("admin/contributions", { status: v === "ALL" ? undefined : v }))}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-card p-1.5">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs font-semibold data-[state=active]:text-brand-ink">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {listQ.error ? (
        <ErrorState message={listQ.error} onRetry={listQ.refetch} />
      ) : listQ.loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={HandHeart}
          title={active === "ALL" ? "Belum ada kontribusi" : `Tidak ada kontribusi berstatus “${labelContributionStatus(active)}”`}
          message="Kontribusi dari halaman publik akan muncul di sini untuk ditinjau."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((c) => (
            <Card
              key={c.id}
              className="card-hover cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`Buka detail kontribusi ${c.title}`}
              onClick={() => void openDetail(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void openDetail(c.id);
                }
              }}
            >
              <CardContent className="space-y-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 flex-1 truncate text-sm font-extrabold text-brand-ink" title={c.title}>
                    {c.title}
                  </h3>
                  <Badge variant="outline" className={cn("shrink-0 text-[10px] font-bold", contributionStatusColor(c.status))}>
                    {labelContributionStatus(c.status)}
                  </Badge>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {c.submitterName} · {c.submitterEmail}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden /> {c.categorySlug}
                  </span>
                  {c.region && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> {c.region.name}
                    </span>
                  )}
                  <span>{fmtDateID(c.createdAt)}</span>
                </div>
                <p className="font-mono text-[10px] font-semibold text-brand-teal">{c.refCode}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {metaInfo && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Total <span className="font-bold text-brand-ink">{metaInfo.total}</span> kontribusi
          </p>
          <MiniPager page={metaInfo.page} totalPages={metaInfo.totalPages} onPage={(p) => navigate(buildQuery("admin/contributions", { status: active === "ALL" ? undefined : active, page: String(p) }))} />
        </div>
      )}

      {/* Dialog detail + moderasi */}
      <Dialog open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          {detailLoading || !detail ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-7 w-2/3 rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 pr-6">
                  <DialogTitle className="text-left">{detail.title}</DialogTitle>
                  <Badge variant="outline" className={cn("text-[10px] font-bold", contributionStatusColor(detail.status))}>
                    {labelContributionStatus(detail.status)}
                  </Badge>
                </div>
                <DialogDescription>
                  <span className="font-mono font-semibold text-brand-teal">{detail.refCode}</span> · diajukan {fmtDateID(detail.createdAt, true)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-xs sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-brand-ink">Pengirim:</span> {detail.submitterName}
                  </p>
                  <p className="truncate">
                    <span className="font-semibold text-brand-ink">Email:</span> {detail.submitterEmail}
                  </p>
                  <p>
                    <span className="font-semibold text-brand-ink">Kategori:</span> {detail.categorySlug}
                  </p>
                  <p>
                    <span className="font-semibold text-brand-ink">Wilayah:</span> {detail.region?.name ?? "-"}
                  </p>
                  {detail.sourceRef && (
                    <p className="sm:col-span-2">
                      <span className="font-semibold text-brand-ink">Referensi:</span> {detail.sourceRef}
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Deskripsi</p>
                  <p className="whitespace-pre-line rounded-xl border border-border p-3 text-sm leading-relaxed">{detail.description}</p>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Riwayat Peninjauan</p>
                  {(detail.reviews ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada riwayat.</p>
                  ) : (
                    <ol className="space-y-0">
                      {(detail.reviews ?? [])
                        .slice()
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((r, i, arr) => (
                          <li key={r.id} className="relative flex gap-3 pb-4 last:pb-0">
                            {i < arr.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />}
                            <span className="relative mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 border-brand-teal bg-background" aria-hidden />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-brand-ink">{ACTION_LABELS[r.action] ?? r.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {r.reviewer?.name ?? "Sistem"} · {fmtDateID(r.createdAt, true)}
                              </p>
                              {r.note && <p className="mt-1 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs italic">“{r.note}”</p>}
                            </div>
                          </li>
                        ))}
                    </ol>
                  )}
                </div>

                {/* Aksi sesuai status */}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {detail.status === "SUBMITTED" && (
                    <Button onClick={() => void startReview(detail)} disabled={actionBusy}>
                      {actionBusy ? <span className="mr-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden /> : <PlayCircle className="h-4 w-4" />}
                      Mulai Peninjauan
                    </Button>
                  )}
                  {(detail.status === "IN_REVIEW" || detail.status === "NEEDS_REVISION") && (
                    <>
                      <Button onClick={() => openModDialog("approve")} disabled={actionBusy}>
                        <CheckCircle2 className="h-4 w-4" /> Setujui
                      </Button>
                      <Button variant="outline" onClick={() => openModDialog("revise")} disabled={actionBusy}>
                        <MessageSquareWarning className="h-4 w-4" /> Minta Revisi
                      </Button>
                      <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => openModDialog("reject")} disabled={actionBusy}>
                        <ThumbsDown className="h-4 w-4" /> Tolak
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" onClick={() => setDetailId(null)}>
                    <Eye className="h-4 w-4" /> Tutup
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog catatan moderasi */}
      <Dialog open={!!modAction} onOpenChange={(v) => !v && setModAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modAction === "approve" ? <CheckCircle2 className="h-5 w-5 text-brand-tropic" aria-hidden /> : modAction === "revise" ? <MessageSquareWarning className="h-5 w-5 text-brand-orange" aria-hidden /> : <XCircle className="h-5 w-5 text-destructive" aria-hidden />}
              {modAction === "approve" ? "Setujui Kontribusi" : modAction === "revise" ? "Minta Revisi" : "Tolak Kontribusi"}
            </DialogTitle>
            <DialogDescription>
              {modAction === "approve"
                ? "Kontribusi akan ditandai disetujui. Catatan bersifat opsional."
                : modAction === "revise"
                  ? "Kontributor akan menerima permintaan revisi beserta catatan Anda."
                  : "Kontribusi akan ditolak — sampaikan alasan yang jelas."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="mod-note">
                Catatan {modAction !== "approve" && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="mod-note"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setNoteError("");
                }}
                rows={4}
                placeholder={
                  modAction === "approve"
                    ? "cth. Terima kasih, narasi sudah lengkap dan akurat."
                    : modAction === "revise"
                      ? "cth. Mohon lengkapi sejarah dan tambahkan foto asli."
                      : "cth. Informasi tidak dapat diverifikasi."
                }
                aria-required={modAction !== "approve"}
                aria-invalid={!!noteError}
              />
              {noteError && <p className="text-xs font-medium text-destructive">{noteError}</p>}
            </div>
            {modAction === "approve" && canPublish && (
              <div className="flex items-start gap-2.5 rounded-xl border border-brand-gold/50 bg-brand-gold/10 p-3">
                <Checkbox id="mod-publish" checked={publishNow} onCheckedChange={(v) => setPublishNow(v === true)} className="mt-0.5" />
                <Label htmlFor="mod-publish" className="cursor-pointer text-xs font-semibold leading-relaxed text-brand-ink">
                  Publikasikan langsung sebagai objek budaya
                  <span className="block font-normal text-muted-foreground">Membuat draft objek budaya dari kontribusi ini.</span>
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModAction(null)} disabled={actionBusy}>
              Batal
            </Button>
            <Button
              onClick={() => void runModeration()}
              disabled={actionBusy}
              className={modAction === "reject" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            >
              {actionBusy && <ClipboardCheck className="h-4 w-4 animate-pulse" />}
              {modAction === "approve" ? "Setujui" : modAction === "revise" ? "Kirim Permintaan Revisi" : "Tolak Kontribusi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
