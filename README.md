# WaraNusa — Platform Eksplorasi & Pelestarian Budaya Indonesia

**Digital Cultural Heritage Explorer.** WaraNusa menghubungkan wilayah geografis Indonesia dengan kekayaan budayanya: peta interaktif, katalog budaya bersumber, visualisasi model 3D, instrumen musik virtual, arsip sumber, serta CMS lengkap untuk pengelolaan konten dan moderasi kontribusi masyarakat.

> Tagline: *Kenali Akar, Jelajahi Budaya.*

---

## 1. Ringkasan Aplikasi

| Bagian | Isi |
|---|---|
| **Situs publik** | Landing page, peta wilayah (Leaflet + OpenStreetMap), katalog dengan filter/pencarian/pagination, halaman detail budaya (galeri, model 3D + hotspot, sumber & atribusi, konten terkait), instrumen musik virtual (Gamelan Saron — Web Audio API), arsip sumber, formulir kontribusi + lacak status. |
| **CMS (`#/admin/*`)** | Dashboard statistik nyata dari DB, CRUD objek budaya (editor lengkap: identitas, konten, media, hotspot 3D, sumber, atribusi, status), wilayah, kategori, Media Manager (upload/validasi/arsip/hapus ber-guard relasi), sumber & atribusi, moderasi kontribusi (alur review), pengguna (Super Admin), pengaturan situs. |
| **API REST** | ±35 endpoint di `src/app/api/**` dengan pola ala Laravel: Route → Controller → Service → Validator (zod) + Serializer. Respons konsisten `{ data, meta? }` / `{ error }`. |
| **Keamanan** | Session token opaque (cookie httpOnly, pola Sanctum), otorisasi role di server, validasi zod per endpoint, validasi upload via **magic bytes** (bukan ekstensi), rate limiting login & kontribusi, anti path-traversal, audit log. |

### Arsitektur

```
Browser (SPA hash-router, satu route "/")
   │  fetch /api/* (same-origin)
   ▼
REST API (Next.js Route Handlers — pola Laravel)
   Route → Controller → Service/Validator(zod) → Prisma
   │                                   │
   ▼                                   ▼
File storage (uploads/media,        SQLite (db/custom.db)
disajik via /api/media/file/*)
```

**Keputusan stack (transparan):** master prompt menyarankan Laravel + MySQL + Vite. Audit lingkungan menunjukkan **PHP/Composer/MySQL tidak tersedia** di sandbox ini (hanya bun/node), dan proyek sudah berjalan di Next.js 16. Sesuai aturan prompt sendiri ("*jika workspace sudah menggunakan stack lain yang berjalan dengan baik, pertahankan*"), stack dipertahankan dengan **pola arsitektur Laravel dipetakan 1:1**: controller/service/validator terpisah, validasi server, session-token auth ala Sanctum, migration + seeder, media storage dikelola backend.

---

## 2. Stack yang Digunakan

- **Frontend**: React 19 + TypeScript 5 (Next.js 16 App Router, Tailwind CSS 4, shadcn/ui New York, Lucide, Framer Motion, Zustand)
- **Peta**: Leaflet + react-leaflet, tile OpenStreetMap (tanpa API key)
- **3D**: Three.js + React Three Fiber + Drei (viewer GLB + model prosedural + hotspot)
- **Audio**: Web Audio API (sintesis metalofon — dijelaskan jujur sebagai demo sintetis)
- **Backend**: Next.js Route Handlers (REST), zod v4, bcryptjs
- **Database**: SQLite via Prisma ORM (13 tabel, FK, index, cascade, timestamp)
- **Storage media**: `<root>/uploads/media` (di luar `public/`) — hanya diakses via endpoint API

---

## 3. Menjalankan Aplikasi

### Prasyarat
- Node.js ≥ 20 / Bun ≥ 1.3
- Tidak ada layanan eksternal (DB SQLite berkas lokal)

### Langkah

```bash
# 1. Instal dependensi
bun install

# 2. Konfigurasi environment
cp .env.example .env        # sudah berisi nilai default yang jalan

# 3. Siapkan skema database (Prisma push)
bun run db:push

# 4. Isi data demonstrasi (4 wilayah, 6 kategori, 8 objek, 13 sumber, 8 media, 4 akun)
bun run db:seed

# 5. Jalankan server pengembangan
bun run dev                 # http://localhost:3000
```

Perintah lain: `bun run lint` (ESLint), `bunx tsc --noEmit` (cek tipe), `bun run db:seed` (ulang seeder — menimpa data), `bun run db:reset` (reset migration).

> Catatan: aplikasi menggunakan SPA hash-router sehingga seluruh halaman hidup di path `/` dengan URL `#/...` (contoh `#/katalog`, `#/admin/dashboard`). Ini menyesuaikan batasan lingkungan preview yang hanya mengekspos satu route.

### Akun Demo (hanya untuk pengembangan)

| Peran | Email | Kata sandi |
|---|---|---|
| Super Admin | `admin@waranusa.id` | `Admin#2025` |
| Editor | `editor@waranusa.id` | `Editor#2025` |
| Reviewer | `reviewer@waranusa.id` | `Reviewer#2025` |
| Kontributor | `kontributor@waranusa.id` | `Kontrib#2025` |

**Untuk produksi: buat akun admin baru via CLI/CMS lalu hapus/nonaktifkan akun demo.** Password di-hash bcrypt (10 rounds).

---

## 4. Struktur Folder Utama

```
src/
├─ app/
│  ├─ page.tsx                # Shell SPA + hash router (satu-satunya route)
│  ├─ layout.tsx              # Font Plus Jakarta Sans, metadata, toaster
│  └─ api/                    # REST API (±35 endpoint)
│     ├─ auth/{login,logout,me}/route.ts
│     ├─ regions | categories | settings | sources
│     ├─ cultural-items/[id]{,/sources,/media}
│     ├─ contributions{,/track} | my/contributions
│     ├─ media/file/[...path]         # penyajian berkas dengan guard
│     └─ admin/{stats,activity,cultural-items,regions,categories,
│              media,sources,contributions,users,settings}
├─ server/                    # Lapisan ala Laravel
│  ├─ controllers/            # 14 controller
│  ├─ services/               # audit, slug, dsb.
│  ├─ validators/             # skema zod
│  └─ serializers.ts          # transformasi bentuk respons
├─ lib/                       # db, auth, storage, api-client, types, router, rate-limit, constants
├─ components/
│  ├─ site/                   # header & footer publik
│  ├─ landing/ explore/ catalog/ culture/ instrument/ archive/ contribute/ account/
│  ├─ admin/                  # 13 layar CMS (admin-app, item-editor, media-view, ...)
│  ├─ three/                  # model-viewer, procedural-models, saron-instrument, saron-audio
│  ├─ map/indonesia-map.tsx
│  └─ shared/                 # brand-logo, states, status-badge, confirm-dialog
├─ hooks/                     # use-async-data
prisma/
├─ schema.prisma              # 13 model
└─ seed.ts                    # seeder data demonstrasi
uploads/media/                # berkas unggahan (di luar public)
public/uploads/seed/          # gambar ilustrasi demo (generator AI)
scripts/gen-seed-images.ts    # pembuat gambar seed (opsional)
```

---

## 5. Skema Database (13 tabel)

`users`, `sessions`, `regions`, `categories`, `cultural_items`, `cultural_item_media` (M:N galeri), `media_assets`, `cultural_sources`, `model_hotspots`, `contributions`, `moderation_reviews`, `activity_logs`, `settings`.

- FK dengan onDelete yang tepat (Cascade untuk relasi milik item, SetNull untuk referensi media).
- Index pada kolom filter (`status`, `categoryId`, `regionId`, `type`, `submitterEmail`, `createdAt`).
- `CulturalItem.contributionId` menghubungkan item hasil konversi kontribusi.
- SQLite tidak mendukung enum Prisma — status divalidasi via konstanta + zod di server.

Migration: gunakan `bun run db:push` (dev) atau `prisma migrate dev` untuk riwayat migration formal.

---

## 6. Endpoint API Utama

**Publik**
- `GET /api/regions` · `GET /api/categories` · `GET /api/settings`
- `GET /api/cultural-items?page&pageSize&search&category&region&sort` (hanya PUBLISHED)
- `GET /api/cultural-items/{slug|id}` (+ viewCount) · `.../sources` · `.../media`
- `GET /api/sources?search&type` (arsip sumber)
- `POST /api/contributions` (publik, rate limit 5/jam/IP)
- `GET /api/contributions/track?refCode&email` · `GET /api/my/contributions` (butuh login)
- `GET /api/media/file/{path}` (penyajian berkas, immutable cache)

**Auth**
- `POST /api/auth/login` (rate limit 5/menit) · `POST /api/auth/logout` · `GET /api/auth/me`

**Admin (Semua butuh sesi; role diperiksa server)**
- `GET /api/admin/stats` · `GET /api/admin/activity`
- `GET|POST /api/admin/cultural-items` · `GET|PATCH|DELETE /api/admin/cultural-items/{id}`
- `POST|PATCH|DELETE /api/admin/cultural-items/{id}/hotspots[/{hotspotId}]`
- `GET|POST /api/admin/regions` · `PATCH|DELETE /api/admin/regions/{id}` (delete ditolak 409 bila masih dipakai)
- `GET|POST /api/admin/categories` · `PATCH|DELETE /api/admin/categories/{id}`
- `GET|POST /api/admin/media` (POST multipart, validasi magic bytes) · `GET|PATCH|DELETE /api/admin/media/{id}` (delete ditolak 409 bila masih terpakai, berikut daftar pemakai)
- `GET|POST /api/admin/sources` · `PATCH|DELETE /api/admin/sources/{id}`
- `GET /api/admin/contributions` · `GET /api/admin/contributions/{id}` · `PATCH /api/admin/contributions/{id}/status` (transisi divalidasi; APPROVE membuat objek budaya draft/terbit + riwayat review)
- `GET|POST /api/admin/users` · `PATCH /api/admin/users/{id}` (Super Admin; proteksi menonaktifkan diri sendiri / SUPER_ADMIN terakhir)
- `GET|PUT /api/admin/settings` (Super Admin)

Bentuk error konsisten: `400/401/403/404/409/422/429/500` dengan `{ error: { message, fields? } }`.

---

## 7. Mengelola Model 3D, Gambar, dan Audio (CMS)

1. Masuk CMS → **Media Manager** → "Unggah Media".
2. Pilih berkas (drag-drop atau klik). Batas: gambar 5 MB, audio 15 MB, model 3D 30 MB, tekstur 8 MB.
3. Server memvalidasi **magic bytes**:
   - Gambar: png/jpg/gif/webp · Audio: mp3/wav/ogg/m4a · Model: `.glb` (disarankan) atau `.gltf` **yang buffer-nya tertanam (data URI)** — gltf dengan `.bin`/tekstur eksternal ditolak dengan pesan jelas.
4. Isi metadata: nama, deskripsi, tipe, lisensi, atribusi.
5. Buka **Objek Budaya → Edit** → bagian Media: pilih Cover / Model 3D / Audio dari MediaPicker, susun Galeri, tambahkan **Hotspot** (judul, deskripsi, koordinat x/y/z, status).
6. Simpan → **Publikasikan**. Situs publik langsung menampilkan versi terbaru (data diambil per permintaan dari API; tidak perlu rebuild).

**Catatan jujur tentang aset 3D:** tidak ada model GLB arsitektural berlisensi yang tersedia saat pengembangan, sehingga objek seed memakai **model prosedural** (rumah gadang, joglo, saron) yang dibangun dari primitive Three.js sebagai demo edukatif, dengan hotspot sesungguhnya dari database. Begitu admin mengunggah `.glb` dan mengaitkannya ke objek, viewer otomatis memakai model GLB tersebut — tanpa perubahan kode.

**Catatan audio:** audio instrumen virtual (Saron) adalah **sintesis Web Audio API** (bukan rekaman autentik) dan diberi label demikian di UI. Admin dapat mengunggah rekaman berlisensi melalui Media Manager dan mengaitkannya ke objek budaya; pemutar audio halaman detail akan memakainya.

---

## 8. Alur Kontribusi & Moderasi

```
Pengunjung mengisi form (#/kontribusi)  →  SUBMITTED (+ refCode WN-XXXXXX)
Reviewer: Mulai Peninjauan              →  IN_REVIEW
Reviewer/Editor:                        →  NEEDS_REVISION (catatan wajib)
                                        →  REJECTED (catatan wajib)
                                        →  APPROVED → objek budaya DRAFT dibuat otomatis
Editor/Super Admin: centang "Publikasikan langsung" → item langsung PUBLISHED
```

- Setiap keputusan tercatat di `moderation_reviews` (aksi, catatan, reviewer, waktu) dan tampil sebagai timeline di CMS.
- Kontribusi anonim dapat dilacak via refCode + email di panel "Lacak Kontribusi".
- Transisi status divalidasi **di server**; konten belum disetujui tidak pernah tampil di API publik.

---

## 9. Keamanan

- Validasi input server (zod) di semua endpoint; mass assignment dicegah oleh skema payload eksplisit.
- Otorisasi per endpoint: `ALL_STAFF` (SUPER_ADMIN/EDITOR/REVIEWER), `WRITE_ROLES` (SUPER_ADMIN/EDITOR), `SUPER_ADMIN` untuk users & settings.
- Upload: batas ukuran per tipe, magic bytes, ekstensi allow-list, nama file disanitasi, penyimpanan di luar `public`, penyajian via endpoint dengan anti path-traversal, `Cache-Control immutable`.
- Rate limit: login 5/menit (per IP+email), kontribusi 5/jam (per IP), track 30/menit.
- Password bcrypt; token sesi di-hash SHA-256 di DB; cookie httpOnly `SameSite=None; Secure; Partitioned` (CHIPS) agar sesi tetap valid di konteks iframe pratinjau lintas-origin; bila cookie diblokir konteks, login menampilkan pesan dengan saran "Open in New Tab", dan 401 di tengah sesi otomatis dialihkan ke halaman masuk.
- Error internal tidak dibocorkan (pesan generik + log server).
- Audit log untuk aksi penting (login, CRUD item, upload/hapus media, moderasi, settings).
- CORS: same-origin (tidak dibuka lintas origin).

---

## 10. Environment Variables

`.env.example`:

```env
# URL database SQLite (satu-satunya varian yang didukung lingkungan ini)
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

Tidak ada secret lain yang dibutuhkan. Untuk deployment produksi sungguhan, rekomendasi: PostgreSQL/MySQL via Prisma (ubah `provider` + `DATABASE_URL`), object storage (S3-kompatibel) untuk media, dan `SESSION_COOKIE_SECURE=true` di belakang HTTPS (tambahkan pada `src/lib/auth.ts` saat menyetel cookie).

---

## 11. Backup & Restore

```bash
# Backup (database + media unggahan)
cp db/custom.db backup/waranusa-$(date +%F).db
tar czf backup/uploads-$(date +%F).tgz uploads/

# Restore
cp backup/waranusa-2025-01-01.db db/custom.db
tar xzf backup/uploads-2025-01-01.tgz
```

Jadwalkan backup harian sesuai kebijakan Anda (cron). Seeder (`bun run db:seed`) SELALU menimpa data — jangan dijalankan di produksi.

---

## 12. Pengujian yang Telah Dijalankan (hasil aktual)

Diverifikasi via browser otomatis (Agent Browser) + curl pada lingkungan dev:

| Area | Hasil |
|---|---|
| Landing page render + statistik nyata | ✅ |
| Peta Leaflet + klik wilayah → panel detail | ✅ |
| Katalog: 7 objek terpublikasi; draft tersaring; filter/pencarian/pagination tersedia | ✅ |
| Detail budaya: 3D + 3 hotspot klik, tab konten, sumber & atribusi, fallback audio jujur | ✅ |
| Instrumen Saron: klik bilah / tombol 1–7 / Demo Melodi tanpa error audio | ✅ |
| Login 4 role + guard 401 → redirect | ✅ |
| Dashboard CMS: angka dari DB (bukan hardcode) | ✅ |
| CRUD objek: ubah judul → tersimpan (PATCH 200) → tampil publik | ✅ |
| Upload media PNG: validasi magic bytes, tersimpan di disk, disajikan via `/api/media/file/...` (200 image/png) | ✅ |
| Media Manager: relasi pemakaian, arsip, hapus ter-guard 409 | ✅ (server) |
| Moderasi: SUBMITTED→IN_REVIEW→APPROVED(+publish) → objek budaya otomatis dibuat & terbit | ✅ |
| Kontribusi publik + refCode + lacak status | ✅ |
| Keamanan: draft 404 publik · admin anonim 401 · reviewer PATCH 403 · path-traversal 404 | ✅ |
| Type safety & lint | `tsc --noEmit` 0 error · ESLint 0 error |
| Footer sticky & push alami | ✅ (footerBottom == viewport saat halaman pendek) |
| Responsif 390px & 1280px | ✅ |

Pengujian otomatis unit/E2E formal (PHPUnit/Vitest) belum disusun dalam tahap ini — verifikasi dilakukan dengan smoke test manual terdokumentasi di atas. Ini dicatat sebagai keterbatasan, bukan klaim.

---

## 13. Keterbatasan & Placeholder (Transparan)

1. **Model 3D seed adalah prosedural** (bukan hasil fotogrametri) — jalur unggah GLB nyata sudah berfungsi.
2. **Audio instrumen = sintesis** — belum ada rekaman gamelan berlisensi; jalur unggah audio sudah berfungsi.
3. **Gambar seed dibuat dengan generator AI** untuk demo — bukan foto arsip; atribusi mencantumkan hal ini. Produksi wajib mengganti dengan foto berlisensi.
4. **Lampiran media pada form kontribusi** belum diaktifkan (form menyarankan menaruh tautan di kolom sumber).
5. **Angklung & Rebab virtual** berstatus "Segera/Rencana" — MVP memilih satu instrumen (Saron).
6. **Peta menggunakan titik koordinat** wilayah (bukan poligon batas administratif GeoJSON) dan diberi label jujur di UI.
7. **Hotspot berbasis koordinat manual** (bukan pemilihan mesh otomatis) — didokumentasikan di editor.
8. **Rate limiter & cache dalam memori** — untuk multi-instance produksi perlu penyimpanan bersama.
9. **Pengujian otomatis formal** (unit/E2E suite) belum disusun; verifikasi manual terdokumentasi.
10. **Deployment belum dilakukan** — tidak ada URL live yang diklaim.

---

## 14. Langkah Deployment (Rencana)

1. Provision host (VPS/container) dengan Node 20+; belakang HTTPS.
2. Ganti DB ke PostgreSQL/MySQL: ubah `provider` di `prisma/schema.prisma`, set `DATABASE_URL`, jalankan `prisma migrate deploy`.
3. Pindahkan media ke object storage (S3/R2): ganti lapisan `src/lib/storage.ts` (interface sudah terpisah).
4. `bun run build && bun run start` (standalone) di belakang reverse proxy.
5. Buat akun admin produksi; nonaktifkan akun demo; isi Settings.
6. Aktifkan backup terjadwal (bag. 11) dan monitoring log.
