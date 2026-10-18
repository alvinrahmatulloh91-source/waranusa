"use client";

/**
 * WaraNusa CMS — Dashboard
 * Kartu ringkasan dari api.admin.stats(), aktivitas terbaru (api.admin.activity),
 * dan panel aksi cepat. Semua angka datang dari API nyata.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { navigate } from "@/lib/router";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ErrorState, SectionHeading } from "@/components/shared/states";
import { fmtDateID } from "./media-picker";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Activity,
  Archive,
  ArrowRight,
  AudioLines,
  Boxes,
  CheckCircle2,
  ClipboardList,
  HandHeart,
  History,
  ImagePlus,
  LayoutGrid,
  LogIn,
  MapPin,
  PencilLine,
  PlusCircle,
  Shapes,
  Trash2,
  Upload,
  Users2,
  type LucideIcon,
} from "lucide-react";

/**
 * Ikon per jenis aktivitas — dipetakan dari kontrak action:
 * item.create→PlusCircle · item.publish→Upload · media.upload→ImagePlus ·
 * contribution.approve→CheckCircle2 · auth.login→LogIn · default→Activity.
 */
function activityIcon(action: string): LucideIcon {
  const a = action.toLowerCase();
  if (a.includes("login")) return LogIn;
  if (a.includes("media.upload") || (a.includes("upload") && a.includes("media"))) return ImagePlus;
  if (a.includes("item.create") || (a.includes("create") && !a.includes("media"))) return PlusCircle;
  if (a.includes("item.publish") || a.includes("publish")) return Upload;
  if (a.includes("contribution.approve") || a.includes("approve")) return CheckCircle2;
  if (a.includes("media.upload")) return ImagePlus;
  if (a.includes("update") || a.includes("edit") || a.includes("revision") || a.includes("review")) return PencilLine;
  if (a.includes("delete")) return Trash2;
  if (a.includes("archive")) return Archive;
  if (a.includes("submit")) return PlusCircle;
  return Activity;
}

function relTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "baru saja";
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} hari lalu`;
    return fmtDateID(iso);
  } catch {
    return "-";
  }
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  sub?: React.ReactNode;
  tone?: "default" | "gold";
  index?: number;
  onClick?: () => void;
}

function StatCard({ icon: Icon, label, value, sub, tone = "default", index = 0, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `Buka ${label}` : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          tone === "gold" && "card-hover border-brand-gold/60 bg-brand-gold/10",
          tone !== "gold" && "card-hover",
          onClick && "cursor-pointer focus-visible:outline-2 focus-visible:outline-brand-teal"
        )}
      >
        <CardContent className="flex items-start gap-3 p-4 sm:p-5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              tone === "gold" ? "bg-brand-gold/25 text-brand-orange" : "bg-brand-teal/10 text-brand-teal"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-brand-ink">{value}</p>
            {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardView() {
  const user = useAuth((s) => s.user);
  const canManage = !!user && (user.role === "SUPER_ADMIN" || user.role === "EDITOR");

  const statsQ = useAsyncData(() => api.admin.stats(), []);
  const activityQ = useAsyncData(() => api.admin.activity({ page: 1, pageSize: 8 }), []);

  useEffect(() => {
    if (statsQ.error) toast.error(statsQ.error);
  }, [statsQ.error]);

  const stats = statsQ.data;
  const loading = statsQ.loading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SectionHeading
        eyebrow="Dashboard CMS"
        title={`Selamat datang, ${user?.name?.split(" ")[0] ?? "Admin"} 👋`}
        description="Ringkasan koleksi budaya nusantara, media, dan antrean moderasi hari ini."
      />

      {statsQ.error ? (
        <ErrorState message={statsQ.error} onRetry={statsQ.refetch} />
      ) : loading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            index={0}
            icon={LayoutGrid}
            label="Objek Budaya"
            value={stats.itemsTotal}
            sub={
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-brand-tropic" aria-hidden />
                  {stats.itemsPublished} terpublikasi
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden />
                  {stats.itemsDraft} draft
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-stone-400" aria-hidden />
                  {stats.itemsArchived} arsip
                </span>
              </span>
            }
          />
          <StatCard index={1} icon={Shapes} label="Kategori" value={stats.categoriesTotal} />
          <StatCard index={2} icon={MapPin} label="Wilayah" value={stats.regionsTotal} />
          <StatCard
            index={3}
            icon={Boxes}
            label="Media"
            value={stats.mediaTotal}
            sub={
              <span className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Boxes className="h-3.5 w-3.5" aria-hidden /> {stats.models3dTotal} Model 3D
                </span>
                <span className="inline-flex items-center gap-1">
                  <AudioLines className="h-3.5 w-3.5" aria-hidden /> {stats.audioTotal} Audio
                </span>
              </span>
            }
          />
          <StatCard
            index={4}
            tone="gold"
            icon={HandHeart}
            label="Kontribusi"
            value={stats.contributionsPending}
            sub="Menunggu peninjauan — klik untuk meninjau"
            onClick={() => navigate("/admin/contributions")}
          />
          <StatCard index={5} icon={Users2} label="Pengguna" value={stats.usersTotal} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Aktivitas terbaru */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-brand-teal" aria-hidden /> Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {activityQ.error ? (
              <ErrorState title="Gagal memuat aktivitas" message={activityQ.error} onRetry={activityQ.refetch} className="py-8" />
            ) : activityQ.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : !activityQ.data || activityQ.data.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
            ) : (
              <ul className="divide-y divide-border">
                {activityQ.data.map((a) => {
                  const Icon = activityIcon(a.action);
                  return (
                    <li key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-brand-teal">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-brand-ink">
                          {a.detail ?? a.action.replace(/_/g, " ").toLowerCase()}
                          {a.entityType && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{a.entityType}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.user?.name ?? "Sistem"} · {relTime(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Aksi cepat */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-brand-teal" aria-hidden /> Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 pt-0">
            {canManage && (
              <Button className="justify-between" onClick={() => navigate("/admin/cultural-items/create")}>
                <span className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" aria-hidden /> Objek Budaya Baru
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            )}
            {canManage && (
              <Button variant="outline" className="justify-between" onClick={() => navigate("/admin/media")}>
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" aria-hidden /> Unggah Media
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            )}
            <Button variant="outline" className="justify-between" onClick={() => navigate("/admin/contributions")}>
              <span className="flex items-center gap-2">
                <HandHeart className="h-4 w-4" aria-hidden /> Tinjau Kontribusi
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant="outline" className="justify-between" onClick={() => navigate("/admin/regions")}>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden /> Kelola Wilayah
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Separator className="my-1" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Semua perubahan konten terekam di riwayat aktivitas. Objek berstatus{" "}
              <span className="font-semibold text-brand-ink">Draft</span> tidak tampil di situs publik hingga dipublikasikan.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
