'use client'

/**
 * WaraNusa — aplikasi single-route "/".
 * Semua "halaman" adalah view SPA yang diatur oleh store (src/store/waranusa.ts):
 * beranda+peta, katalog, detail budaya, instrumen virtual, arsip, kontribusi,
 * riwayat kontribusi, masuk, dan panel pengelola (admin CMS).
 */
import { Providers } from '@/components/waranusa/providers'
import { SiteHeader } from '@/components/waranusa/site-header'
import { SiteFooter } from '@/components/waranusa/site-footer'
import { Hero } from '@/components/waranusa/hero'
import { MapExplorer } from '@/components/waranusa/map-explorer'
import { ProvinceView } from '@/components/waranusa/province-view'
import { ArchiveView } from '@/components/waranusa/archive-view'
import { ContributeView } from '@/components/waranusa/contribute-view'
import { FeaturedCulture, ExperienceSection, ContributeSection } from '@/components/waranusa/home-sections'
import { DetailView } from '@/components/waranusa/views/detail-view'
import { KatalogView } from '@/components/waranusa/views/katalog-view'
import { InstrumentView } from '@/components/waranusa/views/instrument-view'
import { AuthView } from '@/components/waranusa/views/auth-view'
import { MyContributionsView } from '@/components/waranusa/views/my-contributions-view'
import { AdminView } from '@/components/waranusa/views/admin-view'
import { useWaranusa } from '@/store/waranusa'

function MainContent() {
  const { view, provinceSlug } = useWaranusa()
  return (
    <main className="flex-1">
      {view === 'jelajah' &&
        (provinceSlug ? (
          <ProvinceView />
        ) : (
          <>
            <Hero />
            <MapExplorer />
            <FeaturedCulture />
            <ExperienceSection />
            <ContributeSection />
          </>
        ))}
      {view === 'katalog' && <KatalogView />}
      {view === 'budaya' && <DetailView />}
      {view === 'instrumen' && <InstrumentView />}
      {view === 'arsip' && <ArchiveView />}
      {view === 'kontribusi' && <ContributeView />}
      {view === 'riwayat' && <MyContributionsView />}
      {view === 'masuk' && <AuthView />}
      {view === 'admin' && <AdminView />}
    </main>
  )
}

export default function Home() {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <MainContent />
        <SiteFooter />
      </div>
    </Providers>
  )
}
