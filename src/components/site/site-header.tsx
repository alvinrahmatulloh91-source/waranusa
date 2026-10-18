"use client";

import { useState } from "react";
import { HashLink as Link } from "@/components/shared/hash-link";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-store";
import { navigate, type Route } from "@/lib/router";
import { labelRole } from "@/lib/constants";
import { Compass, LayoutGrid, Music4, Archive, Menu, LogIn, UserCircle2, LayoutDashboard, LogOut, HandHeart } from "lucide-react";

const NAV = [
  { href: "#/jelajah", label: "Jelajahi", icon: Compass },
  { href: "#/katalog", label: "Katalog Budaya", icon: LayoutGrid },
  { href: "#/instrumen", label: "Instrumen Virtual", icon: Music4 },
  { href: "#/arsip", label: "Arsip Budaya", icon: Archive },
];

export function SiteHeader({ route }: { route: Route }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => route.raw.startsWith(href.slice(1));
  const cmsUser = user && ["SUPER_ADMIN", "EDITOR", "REVIEWER"].includes(user.role);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive(n.href)
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "text-foreground/75 hover:bg-secondary hover:text-foreground"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="#/kontribusi">
              <HandHeart className="mr-1.5 h-4 w-4 text-brand-orange" /> Kontribusi
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 rounded-full pl-1.5 pr-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="max-w-28 truncate font-semibold">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-bold">{user.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                  <div className="mt-1 text-[11px] font-semibold text-brand-teal">{labelRole(user.role)}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {cmsUser && (
                  <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Panel Pengelolaan
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/kontribusi-saya")}>
                  <UserCircle2 className="mr-2 h-4 w-4" /> Kontribusi Saya
                </DropdownMenuItem>
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
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link href="#/masuk">
                <LogIn className="mr-1.5 h-4 w-4" /> Masuk
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Buka menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
            <div className="mt-2">
              <BrandLogo />
            </div>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Navigasi seluler">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                    isActive(n.href) ? "bg-brand-teal/10 text-brand-teal" : "hover:bg-secondary"
                  )}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              ))}
              <Link
                href="#/kontribusi"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                <HandHeart className="h-4 w-4 text-brand-orange" /> Kontribusi
              </Link>
              {user && (
                <Link
                  href="#/kontribusi-saya"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
                >
                  <UserCircle2 className="h-4 w-4" /> Kontribusi Saya
                </Link>
              )}
              {cmsUser && (
                <Link
                  href="#/admin/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary"
                >
                  <LayoutDashboard className="h-4 w-4" /> Panel Pengelolaan
                </Link>
              )}
              <div className="my-2 border-t border-border" />
              {user ? (
                <button
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                    navigate("/");
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Keluar ({user.name})
                </button>
              ) : (
                <Button asChild className="mt-1">
                  <Link href="#/masuk" onClick={() => setOpen(false)}>
                    <LogIn className="mr-2 h-4 w-4" /> Masuk / Daftar
                  </Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
