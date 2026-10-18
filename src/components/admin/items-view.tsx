"use client";

/**
 * WaraNusa CMS — Daftar Objek Budaya
 * Tabel dengan filter (cari/status/kategori dari route query), pagination,
 * dan aksi baris: edit, lihat publik, publikasikan/arsipkan, hapus.
 */
import { useEffect, useRef, useState } from "react";
import { buildQuery, navigate, type Route } from "@/lib/router";
import { api, ApiError } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { useAuth } from "@/lib/auth-store";
import type { CulturalItem } from "@/lib/types";
import { labelItemStatus, type ItemStatus } from "@/lib/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { MiniPager, fmtDateID } from "./media-picker";
import { cn } from "@/lib/utils";
import {
  Archive,
  ExternalLink,
  Eye,
  Globe2,
  Image as ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  Star,
  Trash2,
} from "lucide-react";

type ConfirmKind = "publish" | "archive" | "delete";

export function ItemsView({ route }: { route: Route }) {
  const user = useAuth((s) => s.user);
  const canManage = !!user && (user.role === "SUPER_ADMIN" || user.role === "EDITOR");

  // ---- Filter dari route query (?q=&status=&category=&page=) ----
  const q = route.query.q ?? "";
  const status = (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(route.query.status ?? "") ? route.query.status : "") as ItemStatus | "";
  const category = route.query.category ?? "";
  const page = Math.max(1, Number(route.query.page ?? "1") || 1);

  const [search, setSearch] = useState(q);
  const firstSearch = useRef(true);
  useEffect(() => {
    setSearch(q);
  }, [q]);
  // Debounce ketikan pencarian → tulis ke URL
  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      navigate(
        buildQuery("admin/cultural-items", { q: search || undefined, status: status || undefined, category: category || undefined }),
        { replace: true }
      );
    }, 400);
    return () => window.clearTimeout(t);
  }, [search]);

  const applyFilter = (patch: Record<string, string | undefined>) => {
    navigate(
      buildQuery("admin/cultural-items", {
        q: q || undefined,
        status: status || undefined,
        category: category || undefined,
        page: page > 1 ? String(page) : undefined,
        ...patch,
      })
    );
  };

  // ---- Data ----
  const itemsQ = useAsyncData(
    () =>
      api.admin.items.list({
        page,
        pageSize: 10,
        search: q || undefined,
        status: status || undefined,
        categorySlug: category || undefined,
        sort: "newest",
      }),
    [page, q, status, category]
  );
  const catsQ = useAsyncData(() => api.categories.list(), []);

  // ---- Aksi baris + konfirmasi terkontrol ----
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; item: CulturalItem } | null>(null);
  const [busy, setBusy] = useState(false);

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, item } = confirm;
    setBusy(true);
    try {
      if (kind === "delete") {
        await api.admin.items.delete(item.id);
        toast.success(`Objek “${item.title}” dihapus.`);
      } else {
        await api.admin.items.update(item.id, { status: kind === "publish" ? "PUBLISHED" : "ARCHIVED" });
        toast.success(kind === "publish" ? `Objek “${item.title}” dipublikasikan.` : `Objek “${item.title}” diarsipkan.`);
      }
      setConfirm(null);
      await itemsQ.refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Aksi gagal dilakukan.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCopy: Record<ConfirmKind, { title: string; desc: string; label: string }> = {
    publish: {
      title: "Publikasikan objek budaya?",
      desc: `“${confirm?.item.title ?? ""}” akan tampil di situs publik dan dapat dilihat pengunjung.`,
      label: "Ya, publikasikan",
    },
    archive: {
      title: "Arsipkan objek budaya?",
      desc: `“${confirm?.item.title ?? ""}” akan disembunyikan dari situs publik namun tetap tersimpan.`,
      label: "Ya, arsipkan",
    },
    delete: {
      title: "Hapus objek budaya?",
      desc: `“${confirm?.item.title ?? ""}” akan dihapus permanen beserta relasinya. Tindakan ini tidak dapat dibatalkan.`,
      label: "Ya, hapus permanen",
    },
  };

  const items = itemsQ.data ?? [];
  const meta = itemsQ.meta;
  const hasFilter = !!(q || status || category);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-brand-ink sm:text-2xl">Objek Budaya</h1>
          <p className="text-sm text-muted-foreground">Kelola koleksi budaya nusantara — draft, publikasi, dan arsip.</p>
        </div>
        {canManage && (
          <Button onClick={() => navigate("/admin/cultural-items/create")}>
            <PlusCircle className="h-4 w-4" /> Objek Budaya
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_180px_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul objek…"
              className="pl-9"
              aria-label="Cari objek budaya"
            />
          </div>
          <div>
            <Label htmlFor="filter-status" className="sr-only">
              Filter status
            </Label>
            <Select
              value={status || "ALL"}
              onValueChange={(v) => applyFilter({ status: v === "ALL" ? undefined : v, page: undefined })}
            >
              <SelectTrigger id="filter-status" className="w-full">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">{labelItemStatus("DRAFT")}</SelectItem>
                <SelectItem value="PUBLISHED">{labelItemStatus("PUBLISHED")}</SelectItem>
                <SelectItem value="ARCHIVED">{labelItemStatus("ARCHIVED")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-category" className="sr-only">
              Filter kategori
            </Label>
            <Select
              value={category || "ALL"}
              onValueChange={(v) => applyFilter({ category: v === "ALL" ? undefined : v, page: undefined })}
            >
              <SelectTrigger id="filter-category" className="w-full">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>
                {(catsQ.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabel */}
      <Card className="overflow-hidden">
        {itemsQ.error ? (
          <ErrorState message={itemsQ.error} onRetry={itemsQ.refetch} className="m-4" />
        ) : itemsQ.loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={hasFilter ? "Tidak ada hasil" : "Belum ada objek budaya"}
            message={hasFilter ? "Coba ubah kata kunci atau reset filter." : "Mulai dengan membuat objek budaya pertama Anda."}
            action={
              canManage && !hasFilter ? (
                <Button onClick={() => navigate("/admin/cultural-items/create")}>
                  <PlusCircle className="h-4 w-4" /> Buat Objek Budaya
                </Button>
              ) : undefined
            }
            className="border-0 bg-transparent"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Gambar</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead className="hidden md:table-cell">Kategori</TableHead>
                <TableHead className="hidden md:table-cell">Wilayah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16 text-center">Unggulan</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Dilihat</TableHead>
                <TableHead className="hidden lg:table-cell">Diperbarui</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                      {item.coverMedia ? (
                        <img src={item.coverMedia.url} alt={`Sampul ${item.title}`} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56">
                    <p className="truncate font-semibold text-brand-ink" title={item.title}>
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={item.slug}>
                      {item.slug}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">{item.category?.name}</TableCell>
                  <TableCell className="hidden text-sm md:table-cell">{item.region?.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {item.featured ? (
                      <span className="inline-flex" title="Objek unggulan">
                        <Star className="h-4 w-4 fill-brand-gold text-brand-gold" aria-label="Unggulan" />
                      </span>
                    ) : (
                      <span className="inline-flex">
                        <Star className="h-4 w-4 text-muted-foreground/40" aria-label="Bukan unggulan" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      {item.viewCount}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{fmtDateID(item.updatedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Aksi untuk ${item.title}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="truncate text-xs">{item.title}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {canManage && (
                          <DropdownMenuItem onClick={() => navigate(`/admin/cultural-items/${item.id}/edit`)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          disabled={item.status !== "PUBLISHED"}
                          onClick={() => window.open(`#/budaya/${item.slug}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" /> Lihat publik
                        </DropdownMenuItem>
                        {canManage && item.status !== "PUBLISHED" && (
                          <DropdownMenuItem onClick={() => setConfirm({ kind: "publish", item })}>
                            <Globe2 className="h-4 w-4" /> Publikasikan
                          </DropdownMenuItem>
                        )}
                        {canManage && item.status === "PUBLISHED" && (
                          <DropdownMenuItem onClick={() => setConfirm({ kind: "archive", item })}>
                            <Archive className="h-4 w-4" /> Arsipkan
                          </DropdownMenuItem>
                        )}
                        {canManage && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setConfirm({ kind: "delete", item })}
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {meta && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Total <span className="font-bold text-brand-ink">{meta.total}</span> objek
          </p>
          <MiniPager page={meta.page} totalPages={meta.totalPages} onPage={(p) => applyFilter({ page: String(p) })} />
        </div>
      )}

      {/* Dialog konfirmasi aksi baris */}
      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm ? confirmCopy[confirm.kind].title : ""}</AlertDialogTitle>
            <AlertDialogDescription>{confirm ? confirmCopy[confirm.kind].desc : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void runConfirm();
              }}
              className={cn(
                confirm?.kind === "delete" && "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive"
              )}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirm ? confirmCopy[confirm.kind].label : "Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
