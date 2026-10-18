/**
 * WaraNusa — Auth store (zustand)
 * Menyimpan user login di memori; sumber kebenaran adalah cookie session
 * yang divalidasi server via GET /api/auth/me.
 */
import { create } from "zustand";
import { toast } from "sonner";
import { api, ApiError, setUnauthorizedHandler } from "./api-client";
import { navigate } from "./router";
import type { User } from "./types";
import type { Role } from "./constants";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  canAccessCMS: () => boolean;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const { data } = await api.auth.me();
      set({ user: data, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.auth.login(email, password);
    // Verifikasi cookie sesi benar-benar tersimpan — konteks pratinjau (iframe
    // lintas-origin) dapat memblokir cookie sehingga login tampak sukses namun
    // semua panggilan berikutnya 401. Deteksi di sini agar pesannya jelas.
    const check = await api.auth.me().catch(() => null);
    if (!check?.data) {
      throw new ApiError(
        "Sesi tidak dapat disimpan oleh konteks pratinjau ini (cookie diblokir). Klik tombol \"Open in New Tab\" di panel pratinjau, lalu masuk kembali di tab tersebut.",
        401,
      );
    }
    set({ user: data, initialized: true });
    return data;
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 0)) {
        // tetap bersihkan state meski logout server gagal
      }
    }
    set({ user: null });
  },

  canAccessCMS: () => {
    const u = get().user;
    return !!u && ["SUPER_ADMIN", "EDITOR", "REVIEWER"].includes(u.role);
  },

  hasRole: (...roles) => {
    const u = get().user;
    return !!u && roles.includes(u.role);
  },
}));

// ---- Watcher 401 global ----
// Sesi mati di tengah aktivitas (kadaluarsa/dihapus/cookie hilang): bersihkan
// state dan arahkan ke halaman masuk dengan pesan jelas, alih-alih membiarkan
// CMS menampilkan dashboard penuh galat "Autentikasi diperlukan".
let lastKickAt = 0;
setUnauthorizedHandler(() => {
  const st = useAuth.getState();
  if (!st.user) return; // memang belum login — biarkan alur normal
  const now = Date.now();
  if (now - lastKickAt < 3000) return; // debounce lemparan 401 paralel
  lastKickAt = now;
  useAuth.setState({ user: null, initialized: true });
  toast.info("Sesi berakhir — silakan masuk kembali.");
  navigate("/masuk", { replace: true });
});
