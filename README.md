# WaraNusa

WaraNusa adalah platform eksplorasi dan dokumentasi budaya Indonesia dengan katalog, pemilih wilayah ilustratif, viewer 3D prosedural, instrumen virtual berbasis sintesis audio, arsip sumber, serta CMS untuk pengelolaan konten dan moderasi kontribusi.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, dan Zustand untuk navigasi tampilan publik.
- Prisma ORM dengan SQLite untuk data demonstrasi.
- Three.js / React Three Fiber untuk model prosedural dan Web Audio API untuk suara demonstrasi.
- Autentikasi sesi cookie `httpOnly`; API admin memeriksa sesi dan peran di server.

## Menjalankan secara lokal

Prasyarat: Bun atau Node.js/npm dan SQLite yang didukung Prisma.

```sh
bun install
cp .env.example .env
bun run db:generate
bun run db:deploy
bun run seed
bun run dev
```

Jika memakai npm, gunakan `npm install` dan ganti awalan `bun run` dengan `npm run`.

Buka `http://localhost:3000`. Seed mengisi akun dan konten demonstrasi. **Seed menghapus semua data aplikasi sebelum mengisi ulang; jalankan hanya pada database lokal kosong/demonstrasi, bukan database berisi data yang ingin dipertahankan.**

Untuk pemeriksaan kode:

```sh
bun run lint
bunx tsc --noEmit
bun run build
```

## Environment

Salin `.env.example` menjadi `.env` dan sesuaikan `DATABASE_URL`. Jangan commit file `.env` atau kredensial. Contoh lokal memakai `file:./db/custom.db`.

## Halaman dan fitur

- Publik: `/` menampilkan eksplorasi, katalog, detail, instrumen, arsip, kontribusi, dan riwayat melalui navigasi aplikasi.
- CMS: `/admin/dashboard`, `/admin/cultural-items`, `/admin/regions`, `/admin/categories`, `/admin/media`, `/admin/sources`, `/admin/contributions`, dan `/admin/users`.
- Editor budaya mendukung draft, pratinjau, slug, sejarah, fungsi budaya, makna, sumber, wilayah, kategori, label demonstrasi, penanda verifikasi, serta status publikasi. Perubahan status publikasi dilindungi API. Konten tanpa sumber yang dapat diperiksa atau yang masih bertanda perlu tinjauan tidak dapat diterbitkan melalui editor admin.
- Kontribusi pengguna memulai status `SUBMITTED`; keputusan moderasi dicatat di `ModerationReview`. Publik hanya menerima objek berstatus `PUBLISHED`.
- Peran: `SUPER_ADMIN`, `EDITOR`, `REVIEWER`, dan `CONTRIBUTOR`. Pengunjung anonim dapat membaca konten publik. Pengelolaan peran hanya untuk `SUPER_ADMIN`.

## Database dan API

Skema Prisma berada di `prisma/schema.prisma`, dengan baseline migration di `prisma/migrations/`. Untuk database baru gunakan `db:deploy`; untuk pengembangan skema lokal gunakan `db:migrate` atau `db:push`. Database lokal yang sebelumnya dibuat dengan `db:push` tidak memiliki riwayat migrasi. Jangan jalankan migrasi baseline langsung terhadap database tersebut; terus gunakan `db:push` atau lakukan proses baseline yang terencana sebelum migrasi. Seed demonstrasi berada di `prisma/seed.ts` dan menghapus isi tabel sebelum mengisi data contoh, jadi jangan jalankan pada database berisi data yang ingin dipertahankan. Entitas inti meliputi `User`, `Session`, `Province`, `Category`, `CulturalItem`, `CulturalSource`, `MediaAsset`, `Contribution`, dan `ModerationReview`. Item budaya memiliki foreign key ke kategori dan wilayah. Item contoh seed ditandai di kartu serta halaman detail.

Endpoint utama:

- Publik: `GET /api/provinces`, `GET /api/categories`, `GET /api/items`, `GET /api/items/{id}`, `GET /api/stats`.
- Akun: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Kontribusi: `POST /api/contributions`, `GET /api/my/contributions`.
- Admin: `/api/admin/items`, `/api/admin/provinces`, `/api/admin/categories`, `/api/admin/media`, `/api/admin/sources`, `/api/admin/contributions`, `/api/admin/users`, dan `/api/admin/stats`.

API admin menggunakan role guard di server. Batas akses berbeda menurut aksi: editor mengelola konten, reviewer memproses moderasi, dan super admin mengelola peran pengguna.

## Akun demonstrasi

Seed menyediakan akun demonstrasi untuk administrator, editor, reviewer, dan kontributor. Kredensial lokal demonstrasi didefinisikan di `prisma/seed.ts`; ganti sebelum deployment dan jangan gunakan kredensial demonstrasi di lingkungan publik.

## Aset, atribusi, dan batasan

- Peta adalah ilustrasi SVG pemilih gugus/provinsi, bukan batas administratif presisi.
- Viewer memakai model prosedural yang ada di kode; belum ada berkas model 3D eksternal.
- Instrumen menghasilkan suara sintetis Web Audio API, bukan rekaman autentik instrumen.
- Media CMS saat ini dicatat melalui URL dan metadata pencipta/lisensi/sumber; upload berkas, pemindaian file, dan penyimpanan objek belum tersedia.
- Konten seed adalah data demonstrasi dan cakupan provinsi/objeknya tidak mewakili seluruh budaya Indonesia. Periksa sumber dan izin media sebelum penggunaan publik.

## Catatan rilis

Gunakan HTTPS dan aktifkan cookie `secure` pada deployment HTTPS. Atur `DATABASE_URL` untuk penyimpanan persisten yang sesuai, siapkan backup database, ganti akun demonstrasi, lalu tinjau lisensi sumber/media dan kebijakan moderasi sebelum membuka kontribusi publik. Untuk produksi berskala besar, evaluasi migrasi SQLite ke PostgreSQL melalui konfigurasi datasource Prisma.
