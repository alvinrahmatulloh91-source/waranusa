'use client'

/**
 * SiteHeader — navbar WaraNusa: logo resmi, navigasi utama, tombol akun.
 * Navigasi: Jelajahi • Katalog Budaya • Instrumen Virtual • Arsip Budaya + Akun.
 */
import {
  Map,
  LibraryBig,
  Music4,
  Archive,
  LogIn,
  LogOut,
  UserRound,
  History,
  ShieldCheck,
  HandHeart,
  ChevronDown,
} from 'lucide-react'
import { useWaranusa, type MainView } from '@/store/waranusa'
import { useMe, useLogout } from '@/hooks/use-waradata'
import { ROLE_LABEL } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const NAV: { key: MainView; label: string; icon: typeof Map }[] = [
  { key: 'jelajah', label: 'Jelajahi', icon: Map },
  { key: 'katalog', label: 'Katalog Budaya', icon: LibraryBig },
  { key: 'instrumen', label: 'Instrumen Virtual', icon: Music4 },
  { key: 'arsip', label: 'Arsip Budaya', icon: Archive },
]

export function SiteHeader() {
  const view = useWaranusa((s) => s.view)
  const setView = useWaranusa((s) => s.setView)
  const { data: user } = useMe()
  const logout = useLogout()

  const go = (v: MainView) => {
    setView(v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const canAdmin = user && (user.role === 'EDITOR' || user.role === 'REVIEWER' || user.role === 'SUPER_ADMIN')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo */}
        <button
          className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 pr-2 focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => go('jelajah')}
          aria-label="Beranda WaraNusa"
        >
          {/* Emblem dari aset logo resmi (dipotong dari banner brand) */}
          <img
            src="/images/brand/emblem.png"
            alt="Logo WaraNusa"
            className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-border"
            width={40}
            height={40}
          />
          <span className="flex shrink-0 flex-col items-start leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">WaraNusa</span>
            <span className="hidden text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
              Eksplorasi &amp; Pelestarian Budaya
            </span>
          </span>
        </button>

        {/* Navigasi utama */}
        <nav aria-label="Navigasi utama" className="flex items-center gap-1 sm:gap-1.5">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => go(key)}
              aria-label={label}
              aria-current={view === key ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors sm:px-3.5 sm:text-sm',
                view === key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}

          {/* Akun */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="ml-1 h-10 gap-2 border-border bg-card px-2.5 text-foreground hover:bg-accent sm:px-3"
                  aria-label="Menu akun"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <span className="hidden max-w-[9rem] truncate text-[13px] font-semibold lg:inline">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                  <p className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground">
                    {ROLE_LABEL[user.role]}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go('kontribusi')} className="gap-2">
                  <HandHeart className="h-4 w-4" /> Kirim Kontribusi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('riwayat')} className="gap-2">
                  <History className="h-4 w-4" /> Riwayat Kontribusi
                </DropdownMenuItem>
                {canAdmin && (
                  <DropdownMenuItem onClick={() => go('admin')} className="gap-2">
                    <ShieldCheck className="h-4 w-4" /> Panel Pengelola
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout.mutate()
                    go('jelajah')
                  }}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              className="ml-1 h-10 gap-1.5 bg-primary px-3 text-[13px] text-primary-foreground shadow-sm hover:bg-primary/90 sm:text-sm"
              onClick={() => go('masuk')}
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Masuk</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
