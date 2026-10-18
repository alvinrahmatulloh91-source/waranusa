'use client'

/**
 * AdminView — pintu masuk Panel Pengelola WaraNusa (view 'admin').
 *
 * GATE DI BAWAH INI HANYA LAPISAN UX: seluruh endpoint /api/admin/* tetap
 * memvalidasi sesi & peran di server, yang merupakan otoritas sebenarnya.
 * Peran Kurator (REVIEWER) bersifat baca-saja untuk konten; tab Pengguna
 * hanya dirender untuk Administrator (SUPER_ADMIN).
 */
import { useState } from 'react'
import { useMe } from '@/hooks/use-waradata'
import { useWaranusa } from '@/store/waranusa'
import { ROLE_LABEL, type SessionUser } from '@/lib/types'
import { StatsTab } from './admin/stats-tab'
import { ItemsTab } from './admin/items-tab'
import { ProvincesTab } from './admin/provinces-tab'
import { CategoriesTab } from './admin/categories-tab'
import { MediaTab } from './admin/media-tab'
import { SourcesTab } from './admin/sources-tab'
import { ContributionsTab } from './admin/contributions-tab'
import { UsersTab } from './admin/users-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookMarked,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Library,
  LogIn,
  Map,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react'

function PanelSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full max-w-2xl rounded-xl" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[74px] rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function AdminView({ initialTab }: { initialTab?: string }) {
  const { data: me, isLoading } = useMe()
  const setView = useWaranusa((s) => s.setView)
  const setLoginRedirect = useWaranusa((s) => s.setLoginRedirect)

  // Normalisasi tab agar cocok dengan Section 14
  const normalizeTab = (tab?: string) => {
    if (!tab) return 'dashboard'
    if (tab === 'objek') return 'cultural-items'
    if (tab === 'wilayah') return 'regions'
    if (tab === 'kategori') return 'categories'
    if (tab === 'sumber') return 'sources'
    if (tab === 'kontribusi') return 'contributions'
    if (tab === 'pengguna') return 'users'
    return tab
  }

  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab))

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    if (typeof window !== 'undefined') {
      const targetUrl = `/admin/${val}`
      if (window.location.pathname !== targetUrl) {
        window.history.replaceState(null, '', targetUrl)
      }
    }
  }

  /* ---- Gate UX: hanya untuk tampilan; server tetap otoritas ---- */

  if (isLoading) return <PanelSkeleton />

  // Belum masuk: ajak login dengan redirect kembali ke panel admin.
  if (!me) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="wn-edge-gold mx-auto max-w-md rounded-2xl bg-card p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Panel Khusus Pengelola</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Panel ini dilindungi autentikasi dan peran. Masuk dengan akun Editor, Kurator, atau Administrator
            untuk mengelola objek budaya, wilayah, kategori, serta meninjau kontribusi komunitas.
          </p>
          <Button
            className="mt-5 w-full gap-2 sm:w-auto"
            onClick={() => {
              setLoginRedirect('admin')
              setView('masuk')
            }}
          >
            <LogIn className="h-4 w-4" /> Masuk
          </Button>
        </div>
      </section>
    )
  }

  // Peran kontributor tidak memiliki izin panel pengelola (server juga menolak).
  if (me.role === 'CONTRIBUTOR') {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Akses ditolak</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Peran {ROLE_LABEL[me.role]} tidak memiliki izin untuk membuka panel pengelola. Panel ini hanya
            dapat diakses oleh Editor, Kurator, dan Administrator.
          </p>
          <Button variant="outline" className="mt-5 w-full sm:w-auto" onClick={() => setView('jelajah')}>
            Kembali ke Jelajah
          </Button>
        </div>
      </section>
    )
  }

  /* ---- Panel utama ---- */
  const isSuper = me.role === 'SUPER_ADMIN'
  const initial = me.name.trim().charAt(0).toUpperCase() || 'W'

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Panel Pengelola WaraNusa (CMS)</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Kelola arsip budaya, wilayah, kategori, media, sumber, dan moderasi kontribusi.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2 shadow-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal/10 font-display text-sm font-bold text-brand-teal">
            {initial}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{me.name}</p>
            <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[me.role]}</p>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl p-1">
          <TabsTrigger value="dashboard" className="flex-none gap-1.5 px-3 py-1.5 text-[13px]">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="cultural-items" className="flex-none gap-1.5 px-3 py-1.5 text-[13px]">
            <Library className="h-4 w-4" /> Objek Budaya
          </TabsTrigger>
          <TabsTrigger value="regions" className="flex-none gap-1.5 px-3 py-1.5 text-[13px]">
            <Map className="h-4 w-4" /> Wilayah
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex-none gap-1.5 px-3 py-1.5 text-[13px]">
            <Library className="h-4 w-4" /> Kategori
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-none gap-1.5 px-3 py-1.5 text-[13px]">
            <ImageIcon className="h-4 w-4" /> Media
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex-none gap-1.5 px-3 py-1.5 text-[13px]">
            <BookMarked className="h-4 w-4" /> Sumber &amp; Atribusi
          </TabsTrigger>
          <TabsTrigger value="contributions" className="flex-none gap-1.5 px-3 py-1.5 text-[13px]">
            <Inbox className="h-4 w-4" /> Moderasi
          </TabsTrigger>
          {isSuper && (
            <TabsTrigger value="users" className="flex-none gap-1.5 px-3 py-1.5 text-[13px]">
              <Users className="h-4 w-4" /> Pengguna
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard">
          <StatsTab />
        </TabsContent>
        <TabsContent value="cultural-items">
          <ItemsTab role={me.role} />
        </TabsContent>
        <TabsContent value="regions">
          <ProvincesTab role={me.role} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab role={me.role} />
        </TabsContent>
        <TabsContent value="media">
          <MediaTab role={me.role} />
        </TabsContent>
        <TabsContent value="sources">
          <SourcesTab role={me.role} />
        </TabsContent>
        <TabsContent value="contributions">
          <ContributionsTab role={me.role} />
        </TabsContent>
        {isSuper && (
          <TabsContent value="users">
            <UsersTab me={me as SessionUser} />
          </TabsContent>
        )}
      </Tabs>
    </section>
  )
}
