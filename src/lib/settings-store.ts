/**
 * WaraNusa — Store pengaturan situs (publik, read-only)
 */
import { create } from "zustand";

interface SettingsState {
  settings: Record<string, string>;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useSiteSettings = create<SettingsState>((set, get) => ({
  settings: {},
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const res = await fetch("/api/settings", { credentials: "same-origin" });
      const json = await res.json();
      if (res.ok && json?.data) set({ settings: json.data, loaded: true });
    } catch {
      // biarkan default
    }
  },
}));
