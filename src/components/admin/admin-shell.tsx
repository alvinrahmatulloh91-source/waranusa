"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/shared/brand-logo";
import { useAuth } from "@/lib/auth-store";
import { navigate, type Route } from "@/lib/router";
import { labelRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Shapes,
  Images,
  BookMarked,
  HandHeart,
  Users2,
  Settings2,
  Menu,
  LogOut,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const SIDEBAR = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cultural-items", label: "Objek Budaya", icon: LayoutGrid },
  { href: "/admin/regions", label: "Wilayah", icon: MapPin },
  { href: "/admin/categories", label: "Kategori", icon: Shapes },
  { href: "/admin/media", label: "Media Manager", icon: Images },
  { href: "/admin/sources", label: "Sumber & Atribusi", icon: BookMarked },
  { href: "/admin/contributions", label: "Kontribusi", icon: HandHeart },
  { href: "/admin/users", label: "Pengguna", icon: Users2, superAdminOnly: true },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings2, superAdminOnly: true },
];

export function breadcrumbsFor(path: string): { label: string; href?: string }[] {
  const segs = path.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [{ label: "Beranda", href: "/admin/dashboard" }];
  if (segs[0] !== "admin") return crumbs;
  const known: Record<string, string> = {
    dashboard: "Dashboard",
    "cultural-items": "Objek Budaya",
    regions: "Wilayah",
    categories: "Kategori",
    media: "Media Manager",
    sources: "Sumber & Atribusi",
    contributions: "Kontribusi",
    users: "Pengguna",
    settings: "Pengaturan",
  };
  for (let i = 1; i < segs.length; i++) {
    const s = segs[i];
    const label = known[s] ?? (s === "create" ? "Tambah Baru" : s.length === 24 ? "Detail" : s);
    const href = i < segs.length - 1 ? `/${segs.slice(0, i + 1).join("/")}` : undefined;
    crumbs.push({ label, href });
  }
  return crumbs;
}

export function AdminShell({ route, children }: { route: Route; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const initialized = useAuth((s) => s.initialized);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Guard sisi klien hanyalah UX; otorisasi sebenarnya di server (API).
    // Bergantung juga pada `initialized` agar sesi yang ternyata mati tetap
    // dialihkan ke halaman masuk setelah init() selesai (bukan dashboard rusak).
    if (initialized && !useAuth.getState().canAccessCMS()) {
      navigate("/masuk", { replace: true });
    }
  }, [route.path, initialized]);

  const crumbs = breadcrumbsFor(route.path);
  const items = SIDEBAR.filter((s) => !s.superAdminOnly || user?.role === "SUPER_ADMIN");

  const navList = (
    <nav className="flex flex-col gap-1 px-3" aria-label="Navigasi CMS">
      {items.map((s) => {
        const active = route.path === s.href.slice(1) || (s.href !== "/admin/dashboard" && route.path.startsWith(s.href.slice(1)));
        return (
          <a
            key={s.href}
            href={`#${s.href}`}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-brand-teal text-white shadow-sm"
                : "text-foreground/70 hover:bg-secondary hover:text-foreground"
            )}
          >
            <s.icon className="h-4 w-4 shrink-0" />
            {s.label}
            {s.href === "/admin/contributions" && <span className="ml-auto rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-bold text-brand-orange">review</span>}
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-brand-soft">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center px-5 border-b border-border">
          <a href="#/" className="flex items-center gap-2.5" aria-label="Kembali ke situs publik">
            <BrandMark className="h-8 w-8" />
            <div className="leading-none">
              <div className="text-sm font-extrabold tracking-tight text-brand-ink">
                WARA<span className="text-brand-teal">NUSA</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CMS Pengelolaan</div>
            </div>
          </a>
        </div>
        <div className="flex-1 overflow-y-auto nice-scroll py-4">
          {navList}
        </div>
        <div className="border-t border-border p-3">
          <a
            href="#/"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-brand-teal"
          >
            Lihat Situs Publik <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header CMS */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          {/* Sidebar mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Buka menu CMS">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Menu CMS</SheetTitle>
              <div className="flex h-16 items-center px-5 border-b border-border">
                <BrandMark className="h-8 w-8" />
                <span className="ml-2 text-sm font-extrabold text-brand-ink">WaraNusa CMS</span>
              </div>
              <div className="py-3">
                {navList}
              </div>
            </SheetContent>
          </Sheet>

          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((c, i) => (
                <div key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>}
                  <BreadcrumbItem>
                    {c.href ? (
                      <BreadcrumbLink asChild>
                        <a href={`#${c.href}`} className="font-medium">{c.label}</a>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="font-semibold">{c.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <a href="#/" target="_self" className="hidden sm:inline-flex text-xs font-semibold text-muted-foreground hover:text-brand-teal items-center gap-1">
              Situs Publik <ExternalLink className="h-3 w-3" />
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 hover:bg-secondary transition-colors" aria-label="Menu akun">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
                    {user?.name.slice(0, 1).toUpperCase() ?? "?"}
                  </span>
                  <span className="hidden max-w-32 truncate text-xs font-bold sm:block">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <div className="text-sm font-bold">{user?.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
                  <div className="mt-1 text-[11px] font-semibold text-brand-teal">{user ? labelRole(user.role) : ""}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate("/");
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
