"use client";

/**
 * WaraNusa CMS — AdminApp (router internal berbasis hash route #/admin/*)
 * Menerima route dari shell SPA, memetakan segments ke view CMS,
 * dan membungkus semuanya dengan AdminShell (guard, sidebar, breadcrumb, akun).
 */
import type { Route } from "@/lib/router";
import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/shared/states";
import { Compass } from "lucide-react";

import { DashboardView } from "./dashboard-view";
import { ItemsView } from "./items-view";
import { ItemEditor } from "./item-editor";
import { RegionsView } from "./regions-view";
import { CategoriesView } from "./categories-view";
import { MediaView } from "./media-view";
import { SourcesView } from "./sources-view";
import { ContributionsView } from "./contributions-view";
import { UsersView } from "./users-view";
import { SettingsView } from "./settings-view";

function CmsNotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="404 — Halaman CMS tidak ditemukan"
      message="Rute admin yang Anda tuju tidak dikenali. Gunakan menu di sisi kiri untuk kembali."
    />
  );
}

export default function AdminApp({ route }: { route: Route }) {
  const seg = route.segments;
  const section = seg[1];

  let view: React.ReactNode;

  if (section === undefined || section === "dashboard") {
    view = <DashboardView />;
  } else if (section === "cultural-items") {
    if (seg.length === 2) {
      view = <ItemsView route={route} />;
    } else if (seg[2] === "create" && seg.length === 3) {
      view = <ItemEditor mode="create" />;
    } else if (seg.length === 4 && seg[3] === "edit" && seg[2]) {
      view = <ItemEditor mode="edit" itemId={seg[2]} />;
    } else {
      view = <CmsNotFound />;
    }
  } else if (section === "regions") {
    view = <RegionsView />;
  } else if (section === "categories") {
    view = <CategoriesView />;
  } else if (section === "media") {
    view = <MediaView route={route} />;
  } else if (section === "sources") {
    view = <SourcesView />;
  } else if (section === "contributions") {
    view = <ContributionsView route={route} />;
  } else if (section === "users") {
    view = <UsersView />;
  } else if (section === "settings") {
    view = <SettingsView />;
  } else {
    view = <CmsNotFound />;
  }

  return <AdminShell route={route}>{view}</AdminShell>;
}
