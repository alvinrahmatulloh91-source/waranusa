"use client";

/**
 * WaraNusa — Shell SPA
 * Seluruh aplikasi (situs publik + CMS) hidup di path "/" dengan hash routing
 * (#/jelajah, #/katalog, #/admin/...) sesuai batasan lingkungan preview.
 * Setiap view bertanggung jawab mengambil datanya sendiri via REST API.
 */
import { useEffect } from "react";
import { useRoute, navigate } from "@/lib/router";
import { useAuth } from "@/lib/auth-store";

import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

import LandingView from "@/components/landing/landing-view";
import ExploreView from "@/components/explore/explore-view";
import CatalogView from "@/components/catalog/catalog-view";
import CultureDetailView from "@/components/culture/culture-detail-view";
import InstrumentView from "@/components/instrument/instrument-view";
import ArchiveView from "@/components/archive/archive-view";
import ContributeView from "@/components/contribute/contribute-view";
import LoginView from "@/components/account/login-view";
import MyContributionsView from "@/components/account/my-contributions-view";
import AdminApp from "@/components/admin/admin-app";

import { Loader } from "@/components/shared/states";
import { useSiteSettings } from "@/lib/settings-store";

export default function WaraNusaApp() {
  const route = useRoute();
  const { init, initialized } = useAuth();
  const settings = useSiteSettings((s) => s.settings);
  const loadSettings = useSiteSettings((s) => s.load);

  useEffect(() => {
    init();
    loadSettings();
  }, [init, loadSettings]);

  // Pengaturan situs (untuk footer) diambil ringan dari settings API publik
  const isAdmin = route.segments[0] === "admin";
  const isLogin = route.segments[0] === "masuk";

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader label="Menyiapkan WaraNusa…" />
      </div>
    );
  }

  // CMS: layout sendiri (sidebar) tanpa header/footer publik
  if (isAdmin) {
    return <AdminApp route={route} />;
  }

  // Login: tampilan mandiri
  if (isLogin) {
    return <LoginView />;
  }

  // Situs publik: header + view + footer (footer menempel di bawah, mt-auto)
  let view: React.ReactNode;
  switch (route.segments[0]) {
    case undefined:
    case "":
      view = <LandingView />;
      break;
    case "jelajah":
      view = <ExploreView route={route} />;
      break;
    case "katalog":
      view = <CatalogView route={route} />;
      break;
    case "budaya":
      view = <CultureDetailView route={route} />;
      break;
    case "instrumen":
      view = <InstrumentView route={route} />;
      break;
    case "arsip":
      view = <ArchiveView />;
      break;
    case "kontribusi":
      view = <ContributeView route={route} />;
      break;
    case "kontribusi-saya":
      view = <MyContributionsView route={route} />;
      break;
    default:
      view = (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-28 text-center">
          <p className="text-5xl">🧭</p>
          <h1 className="text-2xl font-extrabold">Halaman tidak ditemukan</h1>
          <p className="text-muted-foreground">Rute <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">#{route.path}</code> tidak dikenali.</p>
          <button onClick={() => navigate("/")} className="rounded-full bg-brand-teal px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
            Kembali ke Beranda
          </button>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader route={route} />
      <div className="flex-1">{view}</div>
      <SiteFooter
        siteName={settings.siteName}
        tagline={settings.tagline}
        contactEmail={settings.contactEmail}
        footerNote={settings.footerNote}
      />
    </div>
  );
}
