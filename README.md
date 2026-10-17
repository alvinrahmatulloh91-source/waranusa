# WaraNusa — Platform Eksplorasi & Pelestarian Budaya Indonesia

> *Digital Cultural Heritage Explorer* — menjelajahi kebudayaan Indonesia melalui peta interaktif,
> katalog budaya per wilayah, visualisasi 3D, instrumen musik virtual, dan arsip budaya yang
> disertai sumber serta atribusi. Dibangun untuk kebutuhan demonstrasi kompetisi (UINIC 8.0).

![WaraNusa](public/images/brand/waranusa-banner.png)

---

## 1. Ringkasan Fitur

| Area | Fitur |
| --- | --- |
| **Landing & Navigasi** | Hero "Kenali Akar, Jelajahi Budaya.", statistik langsung dari database, sorotan budaya, CTA 3D/instrumen/kontribusi, navbar + akun, footer sticky dengan keterangan transparansi aset. |
| **Peta Interaktif** | Peta SVG stilasi 7 gugus pulau + 18 penanda provinsi (klik gugus → filter; klik provinsi → view provinsi berisi kategori budaya, sejarah, tradisi, kontribusi komunitas). Peta **ilustratif**, bukan batas administratif resmi. |
| **Katalog Budaya** | 90+ objek terpublikasi dengan pencarian (debounce), filter kategori/provinsi/gugus pulau, paginasi klien, kartu dengan badge 3D/Audio. |
| **Detail Budaya** | Tab **Model 3D Interaktif** (orbit 360°, zoom, reset, penanda bagian klik-able berisi fungsi & filosofi) / ilustrasi; bagian Tentang, Filosofi & Makna, Bagian & Makna, **Sumber & Atribusi** (judul, penerbit, tahun, lisensi), Objek Terkait, atribusi ilustrasi AI. |
| **Instrumen Virtual** | 18 alat musik tradisional playable: model 3D prosedural, pad nada + melodi demo, kontrol volume, petunjuk interaksi. Suara = **sintesis demonstrasi Web Audio API**, bukan rekaman autentik. |
| **Arsip Budaya** | Pencarian + filter dengan penekanan pada metadata (kategori, wilayah, badge audio). |
| **Kontribusi & Moderasi** | Wajib login. Alur: `SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / NEEDS_REVISION`. Kurasi otomatis AI hanya menghasilkan *catatan* (`aiNote`), **tidak** menentukan status. Riwayat kontribusi pribadi menampilkan status, catatan kurator, dan jejak tinjauan. |
| **Admin CMS** | Dashboard statistik; CRUD Objek Budaya (termasuk editor sumber, status publikasi `DRAFT/PENDING_REVIEW/PUBLISHED/REJECTED/ARCHIVED`, flag *perlu tinjauan*); CRUD Wilayah & Kategori; moderasi kontribusi dengan catatan + audit trail (`ModerationReview`); manajemen pengguna & peran (khusus Administrator). |
| **Keamanan** | Autentikasi sesi cookie httpOnly (scrypt), otorisasi peran **divalidasi di server** pada setiap endpoint admin, whitelist field (anti mass-assignment), rate limiting (login & kontribusi), validasi input server, error tanpa stack trace. |

## 2. Teknologi

- **Framework**: Next.js 16 (App Router, satu route `/` — navigasi SPA via Zustand), TypeScript 5
- **UI**: Tailwind CSS 4, shadcn/ui (New York), lucide-react, framer-motion, TanStack Query
- **3D**: three.js + @react-three/fiber + drei (model **prosedural**, tanpa aset eksternal)
- **Audio**: Web Audio API (mesin sintesis di `src/lib/instrument-audio.ts`)
- **Database**: Prisma ORM + SQLite (`db/custom.db`)
- **AI**: `z-ai-web-dev-sdk` (backend) untuk catatan kurasi otomatis kontribusi

## 3. Menjalankan Aplikasi

```bash
# 1. Install dependensi
bun install

# 2. Konfigurasi environment (sudah tersedia di .env)
#    DATABASE_URL=file:/home/z/my-project/db/custom.db

# 3. Siapkan skema + seed data demonstrasi
bun run db:push      # push skema Prisma ke SQLite
bun prisma/seed.ts   # 5 kategori, 4 akun demo, 18 provinsi, 90 objek, sumber, kontribusi contoh

# 4. Jalankan dev server (port 3000)
bun run dev

# 5. Lint
bun run lint
```

> Aplikasi hanya memiliki **satu route `/`**; semua "halaman" (peta, katalog, detail, instrumen,
> arsip, kontribusi, riwayat, masuk, admin) adalah view SPA yang dikelola store Zustand.

## 4. Environment Variables

| Variabel | Nilai | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | `file:/home/z/my-project/db/custom.db` | Lokasi file SQLite (jangan menaruh kredensial di kode) |

Tidak ada API key yang diperlukan untuk menjalankan fitur inti. SDK `z-ai-web-dev-sdk`
membaca kredensialnya dari lingkungan runtime sandbox (backend only — tidak pernah dipakai di client).

## 5. Skema Database (Prisma)

```
User ── Session (sesi login)
User ── Contribution ── ModerationReview (audit keputusan; reviewer → User)
Province (wilayah) ── CulturalItem ─┬─ CulturalSource (sumber & atribusi)
Category (metadata kategori)        └─ (parts/sounds/melody: JSON untuk model 3D prosedural)
```

- `CulturalItem.status`: `DRAFT | PENDING_REVIEW | PUBLISHED | REJECTED | ARCHIVED` — API publik **hanya** menyajikan `PUBLISHED`.
- `CulturalItem.needsReview`: ditandai otomatis saat seed (sumber < 2) dan pada objek hasil kontribusi.
- Keputusan desain: kolom `parts/sounds/melody` dipertahankan sebagai JSON (parameter model 3D
  prosedural, bukan konten editorial); `category` pada item berupa key + tabel `Category` untuk
  metadata yang dapat dikelola admin (menghindari duplikasi data pada 90 item seed).

## 6. Endpoint API Utama

**Publik**
- `GET /api/provinces` · `GET /api/provinces/[slug]` — wilayah + item terpublikasi + kontribusi disetujui
- `GET /api/categories` — metadata kategori + jumlah item
- `GET /api/items?q=&category=&province=&island=&playable=1&limit=` — katalog (PUBLISHED saja)
- `GET /api/items/[id]` — detail (404 bila bukan PUBLISHED)
- `GET /api/stats` — statistik beranda

**Autentikasi**
- `POST /api/auth/register` · `POST /api/auth/login` (rate limit 5/menit) · `POST /api/auth/logout`
- `GET /api/auth/me` — `{ user | null }`

**Kontribusi (wajib login)**
- `POST /api/contributions` — status awal selalu `SUBMITTED` + `aiNote` (rate limit 10/menit)
- `GET /api/my/contributions` — riwayat milik sendiri

**Admin (otorisasi server: EDITOR+ / REVIEWER+ / SUPER_ADMIN)**
- `GET /api/admin/stats`
- `GET|POST /api/admin/items` · `PATCH /api/admin/items/[id]`
- `GET|POST /api/admin/provinces` · `PATCH /api/admin/provinces/[id]`
- `GET|POST /api/admin/categories` · `PATCH /api/admin/categories/[id]`
- `GET /api/admin/contributions?status=` · `PATCH /api/admin/contributions/[id]/status`
  (`{status, note?, publish?}` — APPROVED+publish membuat objek budaya terpublikasi + baris audit)
- `GET /api/admin/users` · `PATCH /api/admin/users/[id]/role` (SUPER_ADMIN; guard Administrator terakhir)

Format respons konsisten: `{items|provinces|categories|stats|user|contributions|item|ok}` / error `{error}`.

## 7. Akun Demonstrasi

| Akun | Peran | Keterangan |
| --- | --- | --- |
| `admin@waranusa.id` | Administrator | Akses penuh CMS, moderasi, pengguna |
| `editor@waranusa.id` | Editor | CRUD konten & wilayah/kategori |
| `kurator@waranusa.id` | Kurator | Moderasi kontribusi |
| `warga@waranusa.id` | Kontributor | Kirim & pantau kontribusi |

Kata sandi semua akun demo: **`waranusa123`** (khusus demonstrasi — ganti pada deployment nyata).

## 8. Pengujian yang Telah Dijalankan

- **Unit-level API (curl, oleh agent backend)**: seluruh endpoint publik/auth/admin — termasuk
  skenario 401/403/404/409/429, rate limit login, guard Administrator terakhir, validasi status,
  alur approve→publish hingga objek muncul di API publik.
- **E2E browser (agent-browser, desktop 1366px & mobile 390px)**: beranda + statistik, peta →
  provinsi → detail, viewer 3D (orbit, klik bagian → fungsi/filosofi), katalog + pencarian
  "gamelan" (3 hasil) + paginasi, instrumen virtual (ganti instrumen, pad nada, volume, catatan
  sintesis), masuk/daftar + akun demo, kontribusi end-to-end (SUBMITTED → ditinjau → disetujui →
  objek tayang di katalog), riwayat kontribusi, panel admin (dashboard, objek 91 item + badge
  "perlu tinjauan", moderasi dengan catatan, pengguna/peran), footer sticky, konsol tanpa error.
- `bun run lint`: 0 error. `bunx tsc --noEmit`: 0 error pada kode aplikasi (`src/`).

## 9. Aset Eksternal & Lisensi

- **Logo & banner brand**: aset resmi WaraNusa (diberikan pemilik proyek) — emblem dipotong dari
  banner via sharp (`scripts/logo-process.mjs`).
- **Ilustrasi katalog/hero**: hasil generasi AI (dibuat untuk proyek ini) — diberi atribusi
  "Ilustrasi digital hasil generasi AI (WaraNusa) … bukan foto artefak asli" pada setiap tampilan.
- **Model 3D**: prosedural (dibangun dari primitive three.js) — tidak memakai aset pihak ketiga.
- **Suara instrumen**: sintesis Web Audio API — diberi label "bukan rekaman autentik".
- **Sumber konten budaya**: tautan referensi publik (Wikipedia — konten CC BY-SA; direktori
  Warisan Budaya Takbenda Kemendikbudristek). Lisensi ditampilkan pada setiap sumber di detail.
- **Peta**: ilustrasi SVG internal, bukan data GeoJSON administratif.

## 10. Batasan & Keputusan MVP (jujur)

1. Peta = ilustrasi stilasi; arsitektur siap diganti GeoJSON/Leaflet tanpa membangun ulang halaman.
2. Upload berkas (gambar/audio/model) **belum diimplementasikan** — media dikelola lewat URL +
   metadata lisensi di admin. Menyimpan berkas besar sebagai string di DB sengaja dihindari.
3. Kontribusi tanpa provinsi disetujui **tanpa** auto-publish (harus diatur provinsinya dulu) —
   pesan ini ditampilkan ke kurator.
4. Kontribusi yang diminta revisi belum mendukung edit-resubmit dalam satu record; pengguna
   mengirim ulang lewat formulir (terdokumentasi di UI).
5. Dark mode token tersedia tetapi UI dioptimalkan untuk tema terang (identitas gading/teal).
6. 18 provinsi seed = demonstrasi cakupan, **bukan** klaim seluruh budaya Indonesia tercakup.

## 11. Langkah Lanjutan (menuju online)

1. Isi `DATABASE_URL` produksi (mis. Postgres via Prisma; skema kompatibel setelah provider diubah).
2. Ganti akun demo dengan akun nyata + rotasi kredensial; aktifkan `secure` pada cookie sesi.
3. Pasang di belakang HTTPS (mis. Vercel/VPS + Caddy); sesuaikan CORS bila frontend terpisah.
4. Ganti peta ilustrasi dengan GeoJSON provinsi resmi (mis. GADM/OpenStreetMap, cek lisensi).
5. Unggah aset GLB asli + rekaman audio berizin, lalu pasang pada `ThreeViewer` (kolom `model3d`
   saat ini menerima kunci model prosedural; viewer siap diarahkan ke URL model).
