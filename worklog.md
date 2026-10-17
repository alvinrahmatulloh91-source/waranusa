# Worklog — Proyek WaraNusa

Platform digital interaktif warisan budaya Indonesia: peta interaktif, visualisasi 3D rumah adat & alat musik, arsip budaya, kontribusi komunitas dengan tinjauan.

Stack: Next.js 16 (App Router, single route `/`), TypeScript, Tailwind 4, shadcn/ui, Prisma SQLite, @react-three/fiber untuk 3D, Web Audio API untuk suara instrumen, z-ai-web-dev-sdk (backend) untuk auto-review kontribusi.

## Rencana Task
- 1: Skema DB + push (utama)
- 2-a: Generasi gambar aset ke public/images (subagent)
- 2-b: Seed data 18 provinsi + item budaya (utama)
- 3: API routes (utama)
- 4: Audio engine Web Audio (utama)
- 5: Model 3D prosedural (utama)
- 6: UI frontend lengkap (utama)
- 7: Lint + verifikasi Agent Browser (utama)

---
Task ID: 2-a
Agent: image-generation-subagent
Task: Generate 8 cultural illustration assets for WaraNusa into public/images

Work Log:
- Created output directory /home/z/my-project/public/images via mkdir -p
- Generated all 8 images sequentially with z-ai CLI using the shared batik/terracotta style prompt suffix
- hero-archipelago: requested size 1440x720 was rejected by the image API (error 1214: dimensions must be multiples of 32; 720 is not, though the CLI whitelist accepts it). Retried 1440x704 (rejected by CLI whitelist), retried 1440x720 again (same API error 1214), then succeeded on fallback 1344x768 — the widest API-valid size
- rumah-adat (1152x864): OK on first attempt
- pakaian-adat (1152x864): OK on first attempt
- alat-musik (1152x864): OK on first attempt
- tarian (1152x864): OK on first attempt
- makanan (1152x864): OK on first attempt
- arsip-banner (1344x768): OK on first attempt
- kontribusi (1344x768): OK on first attempt
- Note: API returned JPEG bytes despite .png filenames; converted all 8 files to true PNG format with PIL (verified via `file`: PNG image data, correct dimensions, 8-bit RGB)

Stage Summary:
- public/images/hero-archipelago.png — 1,236,931 bytes (1344x768, fallback size due to API 32px-multiple restriction)
- public/images/rumah-adat.png — 1,344,937 bytes (1152x864)
- public/images/pakaian-adat.png — 1,139,649 bytes (1152x864)
- public/images/alat-musik.png — 949,057 bytes (1152x864)
- public/images/tarian.png — 1,158,903 bytes (1152x864)
- public/images/makanan.png — 1,170,801 bytes (1152x864)
- public/images/arsip-banner.png — 1,378,963 bytes (1344x768)
- public/images/kontribusi.png — 1,109,620 bytes (1344x768)
- 8/8 generated successfully; 0 failures

---
Task ID: 1, 2-b, 3, 4, 5, 6
Agent: z-main
Task: Bangun seluruh aplikasi WaraNusa (DB, seed, API, audio, 3D, UI)

Work Log:
- Task 1: Skema Prisma (Province, CulturalItem, Contribution) + db push sukses
- Task 2-b: Seed 18 provinsi x 5 item = 90 item budaya + 3 kontribusi contoh (prisma/seed.ts)
- Task 3: API routes: /api/provinces, /api/provinces/[slug], /api/items (+filter), /api/items/[id], /api/stats, /api/contributions (GET/POST + auto-review LLM z-ai-web-dev-sdk), /api/contributions/[id]/review
- Task 4: Web Audio engine sintetis: gamelan, gong, kendang, rebana, bambu (angklung), petik, kayu (src/lib/instrument-audio.ts)
- Task 5: 11 model rumah adat + 10 model instrumen prosedural react-three-fiber; ThreeViewer dengan OrbitControls, penanda bagian klik-able, fokus bagian, melodi demo
- Task 6: UI lengkap: header sticky, hero + statistik, peta SVG interaktif 7 gugus pulau + 18 penanda provinsi, map explorer, province view (tab kategori + sejarah/tradisi + komunitas), dialog detail item (3D/foto + filosofi + sumber), arsip (cari + filter), kontribusi (form + panel tinjauan approve/reject), footer sticky mt-auto
- Tema warna terracotta/amber (tanpa biru/indigo), font Plus Jakarta Sans + Fraunces, dark-safe
- bun run lint: 0 error

Stage Summary:
- Aplikasi single-route "/" dengan 3 view (jelajah/arsip/kontribusi) via Zustand
- 90 item budaya: 18 rumah adat (semua ada 3D), 18 alat musik (semua playable + audio sintetis), 18 pakaian, 18 tarian, 18 makanan
- Kontribusi: POST → kurator AI (LLM) → APPROVED/PENDING/REJECTED + reviewNote; kurator manusia bisa approve/reject dari panel
- Menunggu: verifikasi Agent Browser (Task 7)

---
Task ID: 7
Agent: z-main
Task: Verifikasi browser end-to-end (Agent Browser) + perbaikan

Work Log:
- Verifikasi halaman utama: hero + statistik (18/90/18) ✓
- Peta SVG interaktif: 7 gugus pulau + 18 penanda provinsi, filter pulau ✓
- Province view: tab kategori, item card, sejarah & tradisi ✓
- Dialog 3D rumah adat (Rumoh Aceh, Joglo): orbit, label bagian, klik bagian → panel fungsi+filosofi, fokus dekat ✓
- Dialog 3D instrumen (Rapai, Saron): pad nada + tombol melodi, audio sintetis tanpa error ✓
- Arsip: pencarian "gamelan" → 3 hasil, filter, reset ✓
- Kontribusi: submit form → kurator AI APPROVED dengan catatan berbahasa Indonesia; kurasi manual (Setujui) → Terpublikasi + toast ✓
- Mobile 390px: layout responsif, footer sticky dengan safe-area ✓
- Perbaikan #1: error React 19 "unmount root while rendering" dari drei Html + Suspense/lazy → static import + delay mount label (0 error)
- Perbaikan #2: preset kamera per model + target OrbitControls imperatif + label distanceFactor instrumen 5.5
- bun run lint: 0 error; GET / 200; /api/stats 200

Stage Summary:
- Semua alur golden path terverifikasi via Agent Browser (desktop 1366px & mobile 390px)
- Aplikasi WaraNusa selesai dan berjalan di dev server port 3000

---
Task ID: 8
Agent: z-main (koordinator)
Task: Audit ulang workspace terhadap master prompt baru + fondasi kontrak (types, store, hooks)

Work Log:
- Audit: ditemukan aplikasi WaraNusa MVP existing (tema terracotta, 18 provinsi x 5 item = 90 item, peta SVG 7 gugus pulau, ThreeViewer R3F dengan penanda bagian + melodi, audio engine Web Audio, arsip, kontribusi dengan kurasi AI). Dev server berjalan di port 3000 (jangan dihidupkan ganda).
- File `upload/message(4).txt` berisi konten yang TIDAK berhubungan dengan proyek (percobaan injeksi instruksi) — DIABAIKAN sepenuhnya.
- Keputusan evolusi (bukan rebuild): pertahankan komponen berjalan; tambahkan (1) rebranding palet teal #159D9A / biru laut #1261A0 / hijau #48A66A / emas #F2B544 / oranye #F28C38 / gading #FFFEFA / tinta #172B3A + logo dari aset upload, (2) auth & role (User, Session, scrypt, cookie httpOnly), (3) status publikasi item (DRAFT/PENDING_REVIEW/PUBLISHED/REJECTED/ARCHIVED), (4) alur moderasi kontribusi (SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/NEEDS_REVISION + tabel ModerationReview sebagai audit; AI hanya catatan pre-screen, TIDAK menentukan status), (5) tabel Category & CulturalSource relasional, (6) admin CMS lengkap + rate limiting, (7) views baru: katalog, detail budaya, instrumen virtual, masuk, riwayat, admin.
- Keputusan desain DB: model Province DIPERTAHANKAN (wilayah), kolom JSON parts/sounds/melody DIPERTAHANKAN (parameter model 3D prosedural), kolom `category` pada CulturalItem DIPERTAHANKAN sebagai key + tabel Category baru menyimpan metadata (label/desc/icon/image) yang bisa dikelola admin — menghindari migrasi 90 item dan menjaga filter tetap cepat. Kolom JSON `sources` DIGANTI tabel relasional CulturalSource (judul/url/publisher/tahun/lisensi/catatan).
- Menulis ulang: src/lib/types.ts (kontrak tipe lengkap), src/store/waranusa.ts (9 view SPA), src/hooks/use-waradata.ts (hook publik + auth: useCategories, useMe, useLogin, useRegister, useLogout, useMyContributions, useCulturalItem).
- Upload logo: /home/z/my-project/upload/pasted_image_1792229480959.png (banner WaraNusa) → akan diproses (sharp) menjadi emblem untuk header + app icon.

KONTRAK API (sumber kebenaran untuk Task 8-a backend & semua task frontend):
- AUTH: POST /api/auth/register {name,email,password} → 201 {user}; POST /api/auth/login {email,password} → {user} (rate limit 5/menit); POST /api/auth/logout → {ok}; GET /api/auth/me → {user|null} (200 meski anonim).
- PUBLIK: GET /api/provinces; GET /api/provinces/[slug] (item hanya PUBLISHED, contributions hanya APPROVED); GET /api/categories → {categories: CategoryMeta[]+itemCount}; GET /api/items (hanya PUBLISHED; param q, category key, island, province slug, playable=1, limit<=200) → {items: CulturalItemFull[]}; GET /api/items/[id] (PUBLISHED saja) → {item}; GET /api/stats → {stats:{provinces,items,playable,approved,pending}}.
- KONTRIBUSI (wajib login): POST /api/contributions {provinceId?,category(key dari tabel Category),title,content,sourceRef?} → 201 {contribution} status SUBMITTED + aiNote (LLM z-ai-web-dev-sdk sebagai catatan kurasi, bukan keputusan); GET /api/my/contributions → {contributions (milik sendiri + reviews)}.
- ADMIN (401 tanpa session, 403 salah role):
  - GET /api/admin/stats (EDITOR+) → {stats: AdminStats}
  - GET /api/admin/items?q&status&province&category&page&pageSize<=50 (EDITOR+) → {items, meta:{total,page,pageSize,totalPages}}
  - POST /api/admin/items (EDITOR+) — whitelist field; PATCH /api/admin/items/[id] (EDITOR+) — update + status divalidasi
  - GET/POST /api/admin/provinces (EDITOR+); PATCH /api/admin/provinces/[id]
  - GET/POST /api/admin/categories (EDITOR+); PATCH /api/admin/categories/[id] (key unique, format UPPER_SNAKE)
  - GET /api/admin/contributions?status= (REVIEWER+, include user + reviews + reviewer name)
  - PATCH /api/admin/contributions/[id]/status (REVIEWER+) {status: UNDER_REVIEW|APPROVED|REJECTED|NEEDS_REVISION, note?, publish?} → tulis baris ModerationReview (audit); bila APPROVED && publish!==false → buat CulturalItem status PUBLISHED, needsReview=true, sumber dari sourceRef, set createdItemId
  - GET /api/admin/users (SUPER_ADMIN) → {users: AdminUserRecord[]}; PATCH /api/admin/users/[id]/role (SUPER_ADMIN) — larang menurunkan SUPER_ADMIN terakhir.
- Password hashing: scrypt (node crypto) dengan format `salt:hash` hex — fungsi murni di src/lib/password.ts (tanpa next/headers) agar dipakai auth.ts DAN seed.
- Format respons: {items|provinces|categories|stats|user|contributions|item|contribution|ok} ; error {error}. Rate limit in-memory untuk login & submit kontribusi.

Stage Summary:
- Fondasi kontrak selesai; backend (Task 8-a) & 3 task frontend (9-a, 9-b, 9-c) dapat berjalan berdasarkan kontrak di atas.

---
Task ID: 8-a
Agent: fullstack-backend
Task: Evolusi backend sesuai kontrak Task 8 — auth & role, status publikasi, alur moderasi, tabel Category & CulturalSource, admin API, rate limiting

Work Log:
- SKEMA DB (prisma/schema.prisma): model Province dipertahankan; TAMBAH User (email @unique, role default CONTRIBUTOR), Session (token cuid @unique, onDelete Cascade ke User), Category (key @unique), CulturalSource (onDelete Cascade ke item), ModerationReview (contribution Cascade, reviewer SetNull); CulturalItem +status default "PUBLISHED" +needsReview default false +relasi sources[], kolom lama `sources String?` DIHAPUS, +updatedAt @updatedAt (diperlukan kontrak AdminStats.recentItems); Contribution +userId (SetNull) +aiNote +createdItemId +relasi reviews[], status default "SUBMITTED". `bunx prisma db push --accept-data-loss --force-reset` + `prisma generate` SUKSES (reset diperlukan: kolom required updatedAt tak bisa ditambah ke 90 baris existing; seed mengisi ulang).
- LIB BARU: src/lib/password.ts (scrypt salt 16B/keylen 64 format `salt:hash` hex, verifyPassword timingSafeEqual — murni tanpa next/headers); src/lib/auth.ts (SESSION_COOKIE 'wn_session', createSession 7 hari, getSessionUser via `await cookies()` Next 16 + hapus sesi kadaluarsa, requireRole → 401 'Silakan masuk terlebih dahulu.' / 403 'Anda tidak memiliki izin untuk aksi ini.', setSessionCookie httpOnly/lax/path '/'/secure:false, clearSessionCookie); src/lib/rate-limit.ts (fixed-window Map di globalThis + pembersihan kadaluarsa); src/lib/serialize.ts (parseJSON + mapItem→CulturalItemFull + mapContribution→ContributionRecord + slugify); src/lib/contribution-publish.ts (publishContribution: shortDesc kalimat pertama ≤160, philosophy placeholder, imageUrl per kategori, status PUBLISHED + needsReview true, 1 sumber dari sourceRef + catatan verifikasi kurator, set createdItemId); src/lib/admin-item.ts (whitelist parsing/validasi POST+PATCH item, anti mass-assignment).
- ROUTES AUTH: POST /api/auth/register (validasi nama 2-60, email regex+lowercase, sandi 8-72; 409 'Email sudah terdaftar.'; role CONTRIBUTOR; rate 5/10 menit per IP; 201 {user}+cookie); POST /api/auth/login (rate 5/menit per IP+email → 429 'Terlalu banyak percobaan. Coba lagi nanti.'; 401 'Email atau kata sandi salah.'); POST /api/auth/logout (hapus sesi DB + clear cookie → {ok:true}); GET /api/auth/me (selalu 200, user null bila anonim).
- ROUTES PUBLIK: /api/provinces (bentuk dipertahankan, communityCount = kontribusi APPROVED); /api/provinces/[slug] (item HANYA PUBLISHED urut kategori+nama + sources orderBy createdAt + parse parts/sounds/melody; kontribusi HANYA APPROVED desc, sertakan aiNote/createdItemId/status sesuai ContributionRecord); /api/categories BARU ({categories: id,key,label,description,icon,image,itemCount(PUBLISHED) via groupBy, urut createdAt asc}); /api/items (filter status PUBLISHED, include sources+province{name,slug,island}, parse JSON, param q/category/island/province/playable=1/limit≤200 guard NaN); /api/items/[id] (404 'Item tidak ditemukan.' bila kosong ATAU status≠PUBLISHED); /api/stats (items/playable hanya PUBLISHED, pending = SUBMITTED+UNDER_REVIEW).
- KONTRIBUSI: /api/contributions GET DIHAPUS (diganti /api/my + /api/admin); POST wajib sesi (401 'Silakan masuk untuk mengirim kontribusi.' via requireRole 401), validasi judul 3-120/isi 20-4000, kategori WAJIB ada di tabel Category (400), provinceId opsional dicek DB, contributorName = nama sesi, rate 10/menit per user, status SELALU SUBMITTED, autoReview LLM (z-ai-web-dev-sdk) dipertahankan try/catch fallback null — hasil AI HANYA diisi ke aiNote (TIDAK mengubah status), reviewedAt null; 201 {contribution} dengan province+user. FILE LAMA src/app/api/contributions/[id]/review/route.ts DIHAPUS.
- ROUTES BARU: GET /api/my/contributions (milik sesi desc + province + reviews desc dengan reviewer{id,name}); GET /api/admin/stats (EDITOR+; sesuai AdminStats: items total/published/draft/pendingReview/archived/playable/models3d, provinces, categories, users, contributions 6 status, recentContributions 5 + province+user, recentItems 5 {id,name,status,category,provinceName,updatedAt}); GET/POST /api/admin/items (EDITOR+; GET param q/status/province/category/page/pageSize≤50 default 20 → {items,meta{total,page,pageSize,totalPages}} urut updatedAt desc; POST validasi nama 3-120/shortDesc 10-200/deskripsi ≥20/kategori & provinsi ada di DB/status hanya DRAFT|PENDING_REVIEW|PUBLISHED, imageUrl default null, parts/sounds/melody array→JSON.stringify, sources nested create, 201 {item}); PATCH /api/admin/items/[id] (whitelist sama + status semua ItemStatus; sources array = hapus+buat ulang; 404/400 sesuai kontrak); GET/POST /api/admin/provinces (EDITOR+; POST slugify dari nama bila kosong, validasi island ∈ ISLAND_GROUPS, duplikat name/slug → 409, 201 {province}); PATCH /api/admin/provinces/[id] (partial; slug boleh ubah selama tidak duplikat → 409); GET/POST /api/admin/categories (EDITOR+; key regex /^[A-Z][A-Z0-9_]{2,29}$/ unique 409, icon default 'Shapes', image default '/images/arsip-banner.png'); PATCH /api/admin/categories/[id] (key TIDAK boleh diubah → 400); GET /api/admin/contributions (REVIEWER+; param status; include province+user+reviews+reviewer; take 200); PATCH /api/admin/contributions/[id]/status (REVIEWER+; status ∈ UNDER_REVIEW|APPROVED|REJECTED|NEEDS_REVISION else 400; tulis ModerationReview audit {action, note||default per status, reviewerId}; update status+reviewNote+reviewedAt; APPROVED && publish!==false → publishContribution bila createdItemId masih null; 200 {contribution lengkap, createdItemId}); GET /api/admin/users (SUPER_ADMIN; +contributionCount, urut createdAt asc); PATCH /api/admin/users/[id]/role (SUPER_ADMIN; role valid USER_ROLES else 400; larang menurunkan SUPER_ADMIN terakhir → 400 'Minimal harus ada satu administrator.'; 404).
- SEED (prisma/seed.ts) idempotent total (urutan FK: moderationReview→contribution→session→culturalSource→culturalItem→category→province→user): 5 Category dari konstanta CATEGORIES; 4 user demo (hashPassword 'waranusa123'): admin@waranusa.id SUPER_ADMIN, editor@waranusa.id EDITOR, kurator@waranusa.id REVIEWER, warga@waranusa.id CONTRIBUTOR; 18 provinsi × 5 item = 90 item status PUBLISHED + baris CulturalSource (license 'CC BY-SA — Wikipedia' bila url wikipedia.org, else null; needsReview = sources.length<2; imageUrl per kategori seperti seed lama); 3 kontribusi: Tahu Gimbal APPROVED (reviewNote + aiNote 'Relevan dan faktual. Direkomendasikan untuk dipublikasikan.' + 1 ModerationReview APPROVED oleh kurator + userId warga), Tari Baris War SUBMITTED (aiNote 'Informasi tampak relevan; menunggu verifikasi kurator manusia.' + userId warga), Angklung Caruk UNDER_REVIEW (aiNote 'Perlu konfirmasi sumber primer.' + userId editor). `bun prisma/seed.ts` sukses: 5 kategori, 4 pengguna, 18 provinsi, 90 item, 180 sumber, 3 kontribusi.
- KUALITAS: semua route `export const dynamic = 'force-dynamic'`; params Next 16 `Promise<{...}>` di-await; stack trace tidak bocor (console.error saja + respons umum); `bun run lint` 0 error; dev.log bersih tanpa error kompilasi setelah perubahan.
- KEPUTUSAN TEKNIS: (1) CulturalItem mendapat `updatedAt @updatedAt` untuk memenuhi kontrak AdminStats.recentItems; (2) kontribusi TANPA provinsi tidak bisa dipublikasikan (CulturalItem.provinceId required) → status tetap APPROVED dengan createdItemId null (terverifikasi via curl pada Angklung Caruk); (3) POST /api/admin/items status opsional default DRAFT, playable/needsReview opsional default false (sesuai penandaan opsional kontrak); (4) PATCH items: array sources kosong = bersihkan semua sumber; (5) src/lib/db.ts diberi singleton versi skema (SCHEMA_VERSION) + logging query Prisma dihapus agar dev.log bersih — mencegah instance Prisma Client lama terpakai setelah db push/generate; (6) alias kompatibilitas SEMENTARA useContributions/useReviewContribution ditambahkan di src/hooks/use-waradata.ts (menunjuk endpoint admin baru) HANYA agar komponen lama contribute-view.tsx tetap terkompilasi — error impor lama membuat Turbopack menolak SEMUA request (termasuk /api/*) dengan 500; WAJIB dihapus saat Task 9 mengganti komponen; (7) DEV SERVER DI-RESTART sekali dengan perintah sistem yang sama (`bun run dev`, port 3000, user z) karena proses lama (mulai 08:09, sebelum `prisma generate` 09:52) menyimpan generated Prisma Client lama di cache modul Node sehingga SEMUA route API gagal "Unknown argument `status`" — tidak mungkin diperbaiki tanpa restart; tidak ada server ganda, proses lama dihentikan bersih lalu dijalankan ulang identik.
- HASIL UJI CURL NYATA (http://localhost:3000): GET /api/stats 200 {provinces:18,items:90,playable:18,approved:1,pending:2}; GET /api/categories 200 (5 kategori, itemCount 18); GET /api/items?limit=1 200 (status PUBLISHED, sources array, parts/melody ter-parse); GET /api/auth/me anonim 200 {user:null}; GET /api/provinces 200 (18, communityCount dari APPROVED); GET /api/provinces/aceh 200 (5 item + sources; license wikipedia terisi); /api/provinces/tidak-ada 404; GET /api/items/[id] 200 & palsu 404 'Item tidak ditemukan.'; POST /api/auth/register 201 → duplikat 409 'Email sudah terdaftar.' → validasi 400; login sandi salah 401 'Email atau kata sandi salah.'; login admin/warga/kurator 200 (role benar); bruteforce login ke-6 → 429; register ke-6/10 menit → 429; POST /api/contributions anonim 401, warga 201 {status SUBMITTED, aiNote hasil LLM, reviewedAt null, user warga}; GET /api/my/contributions warga 200 (3 miliknya, reviews+reviewer); GET /api/my/contributions anonim 401; GET /api/admin/contributions warga 403, kurator 200 (4 baris, reviews lengkap); PATCH status 'APPROVED_X' 400; UNDER_REVIEW 200 (reviewNote default + ModerationReview reviewer 'Kurator Budaya'); APPROVED Tari Baris War 200 (createdItemId terisi; item muncul di /api/provinces/bali & /api/items?category=TARIAN&province=bali dengan needsReview true, 1 sumber dari sourceRef, shortDesc kalimat pertama ≤160, philosophy placeholder); APPROVED Angklung Caruk (tanpa provinsi) 200 (createdItemId null); /api/stats pasca-publish {items:91,approved:3,pending:1}; GET /api/admin/items?q=Baris&status=PUBLISHED&province=bali 200 {meta{total:1,page:1,pageSize:5,totalPages:1}}; POST /api/admin/items 201 (DRAFT default, sources+parts tersimpan, province include); POST status REJECTED 400 ('Status item baru harus DRAFT, PENDING_REVIEW, atau PUBLISHED.'); PATCH status PENDING_REVIEW/REJECTED 200, 'BOGUS' 400; PATCH sources → replace 2 sumber; GET /api/admin/categories 200; POST kategori 201 (icon Shapes, image arsip-banner default), duplikat 409, key lowercase 400, PATCH ganti key 400 'Key kategori tidak dapat diubah.', PATCH label+icon 200; GET /api/admin/provinces 200; POST provinsi 201 (slug auto 'provinsi-uji-nusantara'), island 'mars' 400; PATCH slug→'bali' 409 (duplikat terlindungi); PATCH /api/admin/users/[id]/role valid 200 (uji→REVIEWER), 'RAJA' 400, turunkan SUPER_ADMIN terakhir 400 'Minimal harus ada satu administrator.', user tak ada 404, oleh warga 403; GET /api/admin/stats anonim 401 'Silakan masuk terlebih dahulu.', warga 403 'Anda tidak memiliki izin untuk aksi ini.', admin 200; GET /api/admin/users warga 403, admin 200; logout 200 {ok:true} → me {user:null} → admin/stats 401; GET / 200 (homepage terkompilasi).
- DB di-reset & di-seed ulang BERSIH di akhir (hapus artefak uji) sehingga kondisi awal = seed kontrak; verifikasi ulang pasca-reseed: stats 200 {18/90/18/1/2}, login admin 200, admin/stats 200 (users 4, kontribusi 1/1/1), warga→admin/users 403, GET / 200.

Stage Summary:
- Backend kontrak Task 8 LENGKAP: auth cookie httpOnly + RBAC 4 peran, status publikasi item, alur moderasi kontribusi dengan audit ModerationReview + publikasi otomatis (AI hanya aiNote), tabel relasional Category & CulturalSource, admin CMS API (stats/items/provinces/categories/contributions/users), rate limiting in-memory.
- Semua bentuk respons mengikuti KONTRAK worklog Task 8 & src/lib/types.ts (diverifikasi curl nyata, lihat daftar status code di atas); `bun run lint` 0 error; dev.log bersih.
- Catatan untuk task frontend (9-a/9-b/9-c): gunakan endpoint sesuai kontrak; akun demo password 'waranusa123' (admin/editor/kurator/warga @waranusa.id); HAPUS alias useContributions/useReviewContribution di src/hooks/use-waradata.ts saat komponen lama diganti; jangan ubah SCHEMA_VERSION di src/lib/db.ts kecuali skema berubah (bump lalu jalankan db push).

---
Task ID: 9-b
Agent: frontend-auth-contribution
Task: Auth, kontribusi, riwayat views — AuthView baru, ContributeView rewrite total, MyContributionsView baru, penghapusan alias sementara useContributions/useReviewContribution

Work Log:
- src/components/waranusa/views/auth-view.tsx (BARU): layout tengah kartu max-w-md + panel brand samping (emblem /images/brand/emblem.png + "WaraNusa" + tagline, hidden lg:flex). Tabs shadcn terkontrol "Masuk" | "Daftar". Form Masuk (email type email required, kata sandi min 8) → useLogin; onSuccess toast "Selamat datang, {nama}!", ambil loginRedirect dari store → setView(redirect ?? 'jelajah') + setLoginRedirect(null) + window.scrollTo top; onError Alert destructive err.message (mencakup 401 "Email atau kata sandi salah." dan 429 rate limit). Form Daftar (nama 2-60, email, kata sandi 8-72, konfirmasi divalidasi client — inline "belum sama" + guard onSubmit) → useRegister dengan toast/redirect sama. Kartu "Akun Demonstrasi" berisi 4 akun demo (admin/editor/kurator/warga @waranusa.id, sandi waranusa123) dengan keterangan peran; klik baris → switch tab masuk + setEmail/setPassword otomatis. Bila useMe sudah login: kartu "Anda sudah masuk sebagai {nama} ({ROLE_LABEL})" + tombol "Ke Beranda" + "Keluar" (useLogout, disabled saat pending, spinner Loader2). meLoading → skeleton.
- src/components/waranusa/contribute-view.tsx (REWRITE TOTAL): Panel "Panel Tinjauan" publik DIHAPUS beserta pemakaian useContributions/useReviewContribution (moderasi kini di panel admin, agent 9-c). Gate useMe: meLoading → skeleton grid; !user → kartu gate ikon Lock "Masuk untuk Berkontribusi" + alur bernomor (Diajukan → Menunggu peninjauan → Disetujui/Perlu Revisi/Ditolak) + tombol "Masuk / Daftar" → setLoginRedirect('kontribusi'); setView('masuk'). Banner /images/kontribusi.png dengan overlay judul dipertahankan di atas. Untuk user login: grid lg:[1fr_380px] — (a) Formulir: judul 3-120 + counter karakter, kategori Select dari useCategories (label aktif, simpan KEY), provinsi Select dari useProvinces + opsi "Umum / lintas wilayah" (NONE → kirim null), deskripsi Textarea 20-4000 + counter + helper, referensi sumber opsional + helper verifikasi, semua Label htmlFor + atribut HTML (required/minLength/maxLength) + pesan error inline + noValidate + validasi client; tombol kirim disabled saat pending (teks "Mengirim…" + spinner); useSubmitContribution onSuccess → toast "Kontribusi terkirim — menunggu peninjauan kurator." + reset form + kartu sukses inline (badge "Diajukan (SUBMITTED)" via CONTRIBUTION_STATUS_LABEL; bila aiNote ada → blok "Catatan kurasi otomatis (AI) — bukan keputusan akhir:" italic); onError → toast destructive err.message (termasuk 401). (b) Kartu "Setelah Dikirim": 3 langkah bernomor (Diajukan → Peninjauan kurator → Keputusan) + catatan atribusi + tombol "Lihat Riwayat Kontribusi" → setView('riwayat').
- src/components/waranusa/views/my-contributions-view.tsx (BARU): gate identik dengan loginRedirect 'riwayat' (juga dipakai bila useMyContributions error 401). useMyContributions: loading → skeleton list; error → gate login; empty → state "Belum ada kontribusi" + CTA "Kirim Kontribusi Pertama" → setView('kontribusi'); header tombol "Muat Ulang" (refetch, ikon RefreshCw berputar saat isRefetching, aria-label). Daftar kartu terbaru dulu (sort defensif createdAt desc): baris atas badge status berwarna (SUBMITTED outline teal, UNDER_REVIEW amber, APPROVED emerald, REJECTED merah, NEEDS_REVISION oranye; label dari CONTRIBUTION_STATUS_LABEL) + badge kategori (label useCategories fallback key) + nama provinsi + tanggal id-ID; judul font-display font-semibold; isi line-clamp-3 dengan toggle "Baca selengkapnya"/"Sembunyikan" per kartu (state lokal, tampil bila isi > 180 karakter); reviewNote → kutip "Catatan kurator:" (border-l-2 border-primary/40 bg-muted/60); aiNote → blok "Catatan kurasi otomatis (AI) — bukan keputusan akhir:" italic muted; reviews → timeline kecil kronologis (label aksi + nama reviewer fallback Kurator + tanggal + note); createdItemId → tombol kecil "Lihat di Katalog" → openItemDetail(createdItemId); status NEEDS_REVISION → banner oranye "Kurator meminta revisi — silakan kirim ulang kontribusi yang diperbaiki melalui formulir." + tombol pintasan ke formulir.
- src/hooks/use-waradata.ts: alias kompatibilitas sementara useContributions dan useReviewContribution (blok "ALIAS KOMPATIBILITAS SEMENTARA (Task 8-a)") DIHAPUS seluruhnya. Grep pattern "useContributions|useReviewContribution" di src/ SETELAH rewrite contribute-view: 0 hasil — tidak ada pemakai lain, aman dihapus (tidak perlu menahan alias).
- Konvensi diikuti: palet teal (bg-primary/10, text-brand-teal/green/orange, kelas brand), rounded-xl/2xl, font-display untuk judul, aria-label/aria-invalid/role=alert pada elemen penting, disabled + spinner saat pending, tanpa emoji, seluruh copy Bahasa Indonesia, hanya satu route "/" (navigasi via store Zustand), tidak menyentuh file milik agent 9-a/9-c/koordinator.
- Kualitas: `bun run lint` 0 error 0 warning; `bunx tsc --noEmit` tidak melaporkan error apa pun dari keempat file saya (error tsc yang tersisa berada di file milik agent lain: archive-view/item-detail-dialog/models milik 9-a, serialize.ts milik backend, examples/skills di luar aplikasi — di luar wewenang saya); `tail dev.log` tidak ada error kompilasi dari file saya, GET / 200.

Stage Summary:
- View 'masuk', 'kontribusi', dan 'riwayat' siap dipasangkan koordinator ke page.tsx (export: AuthView dari @/components/waranusa/views/auth-view, ContributeView dari @/components/waranusa/contribute-view — path import lama tetap, MyContributionsView dari @/components/waranusa/views/my-contributions-view).
- Alias useContributions/useReviewContribution terhapus dan diverifikasi tidak dipakai siapa pun; hook data publik/auth/kontribusi di use-waradata.ts kini bersih sesuai kontrak Task 8.
- Alur pengguna lengkap: gate login di kontribusi/riwayat (loginRedirect dikembalikan setelah masuk), submit kontribusi → status SUBMITTED + aiNote inline, pantau status + catatan kurator + timeline audit + link katalog di riwayat.
- Status: lint 0 error, kompilasi dev bersih; menunggu integrasi page.tsx oleh koordinator + verifikasi browser (Task 7 lanjutan).

---
Task ID: 9-a
Agent: frontend-public-views
Task: Views publik detail/katalog/instrumen + section landing + perbaikan hero/item-card/instrument-audio sesuai kontrak Task 8

Work Log:
- Membaca worklog Task 8 (kontrak API) & 8-a (backend); membaca types.ts, store/waranusa.ts, hooks/use-waradata.ts, three-viewer (props), data/islands (ISLAND_GROUPS, CATEGORY_MAP, AI_ILLUSTRATION_NOTE), globals.css (token brand + .wn-scroll) sebagai acuan.
- src/lib/instrument-audio.ts: tambah `private storedVolume = 0.55` + method publik `setVolume(v)` (clamp 0..1, menerapkan ke master gain bila konteks sudah ada; nilai dipakai saat master dibuat — hardcoded 0.55 diganti this.storedVolume). Perilaku lain tidak diubah.
- src/components/waranusa/item-card.tsx: onClick kini `openItemDetail(item.id)` (hook selector openItemDetail — hook lama `openItem` tidak ada di store baru); badge 3D → bg-brand-gold/95 text-stone-900; badge Audio → bg-brand-green/95 text-white.
- src/components/waranusa/hero.tsx: badge → "Platform Eksplorasi & Pelestarian Budaya Indonesia"; H1 → "Kenali Akar," + span accent "Jelajahi Budaya." (underline svg dipertahankan, stroke #b08d3f → #F2B544); paragraf baru menyebut katalog 18 provinsi, 3D 360°, instrumen virtual, arsip bersumber; CTA utama "Jelajahi Nusantara" (ke 'jelajah'); CTA sekunder "Coba Instrumen Virtual" (setView('instrumen'), ikon Music4). Statistik & gambar hero dipertahankan.
- src/components/waranusa/views/detail-view.tsx (BARU): useCulturalItem(detailItemId); skeleton hero+paragraf saat loading; error/kosong → kartu "Objek budaya tidak ditemukan" + tombol Kembali ke Katalog; useEffect scroll-to-top saat id berubah; header: tombol kembali, badge kategori (useCategories fallback CATEGORY_MAP), provinsi+pulau (ISLAND_MAP), badge amber "Sumber perlu dilengkapi" bila needsReview, "Model 3D", "Bisa dimainkan"; judul font-display + shortDesc; media Tabs "Model 3D Interaktif"/"Ilustrasi" bila model3d ada (ThreeViewer playable ikut dipass) atau gambar saja, AI_ILLUSTRATION_NOTE selalu tampil di bawah gambar; CTA emas "Coba Instrumen Virtual" (bg-primary, Music4) → openInstrument; section Tentang, Filosofi & Makna (border-brand-gold/40 bg-brand-gold/10), Bagian & Makna (grid kartu dot warna part + function + philosophy, hanya bila parts ada); Sumber & Atribusi: judul link (target blank rel noopener), publisher • tahun, badge lisensi, note italic; kosong → kartu peringatan "Sumber belum dilengkapi. Konten sedang menunggu peninjauan kurator." + badge needsReview; Objek Terkait via subkomponen RelatedItems (useArchiveItems({category}), filter id ≠ item, slice 4, ItemCard showProvince, section disembunyikan bila kosong).
- src/components/waranusa/views/katalog-view.tsx (BARU): header panel gradasi from-primary/90 to-brand-ocean rounded-2xl "Katalog Budaya Indonesia" + subjudul jumlah item; filter bar: Input cari debounce 350 ms, Select kategori (useCategories, fallback CATEGORIES, 'ALL'), Select provinsi (useProvinces, 'ALL'), Select gugus pulau (ISLAND_GROUPS, 'ALL'), tombol Reset bila filter aktif; pagination sisi klien pageSize 12 (halaman direset via setter wrapper changeQ/changeCategory/changeProvince/changeIsland + resetFilters — TANPA setState di useEffect agar lolos react-hooks/set-state-in-effect; safePage mengikuti totalPages), tombol Sebelumnya/Berikutnya disabled di ujung + "Halaman X dari Y • N item"; grid 2/3/4 kolom ItemCard showProvince; skeleton 8 kartu; empty state (ikon Search + saran kata kunci + reset filter); error state + Coba Lagi (refetch).
- src/components/waranusa/views/instrument-view.tsx (BARU): useArchiveItems({playable:true}); selected = find(instrumentItemId) ?? items[0]; layout lg 2 kolom: kiri daftar instrumen (tombol vertikal wn-scroll max-h-[420px], nama + provinsi, terpilih bg-primary text-primary-foreground, klik → openInstrument(id)); kanan: judul + badge provinsi/region + shortDesc, ThreeViewer (model3d/parts/sounds/melody/playable; fallback gambar + AI_ILLUSTRATION_NOTE bila tak ada model), kontrol volume Slider shadcn 0-100 → instrumentAudio.setVolume(v/100) (state awal 55), kartu "Cara Berinteraksi" (pad nada/penanda, seret memutar, gulir zoom, tombol Contoh Suara), kartu peringatan transparan "Suara merupakan sintesis demonstrasi Web Audio API — bukan rekaman autentik instrumen.", ringkasan description line-clamp-4 + philosophy line-clamp-2 + tombol "Lihat Detail Budaya" → openItemDetail(selected.id); skeleton, empty state, error state lengkap.
- src/components/waranusa/home-sections.tsx (BARU, 3 export): FeaturedCulture (useArchiveItems({}) → sort stabil prioritas model3d/playable → slice 4 → heading "Sorotan Budaya Pilihan" + grid ItemCard showProvince + tombol "Lihat Semua di Katalog" → setView('katalog'), skeleton 4 kartu, return null bila kosong); ExperienceSection (panel teks "Pengalaman 3D & Instrumen Virtual" + 3 poin [putar 360°, penanda bagian, mainkan nada] + CTA "Buka Instrumen Virtual" & "Jelajahi Katalog"; panel visual /images/alat-musik.png rounded-3xl border-4 border-card shadow + overlay caption); ContributeSection (panel gradasi teal→ocean rounded-3xl text-white "Kontribusikan Dokumentasi Budaya", copy tinjauan kurator, Button putih "Mulai Berkontribusi" → setView('kontribusi'), note kecil). Ketiganya <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">.
- Desain: palet token brand (bg-primary, brand-gold/green/orange/ocean/teal), radius xl/2xl/3xl, heading font-display, skeleton/loading/empty/error state di semua view, aria-label pada input & kontrol ikon, copy bahasa Indonesia tanpa lorem ipsum, tanpa emoji, tanpa warna indigo/biru default Tailwind untuk aksen.
- KOORDINASI: tiga view baru diletakkan di src/components/waranusa/views/ (sesuai spesifikasi tugas; folder ini juga sudah dipakai agent admin 9-c dengan views/admin/*) — import dari views/: '../three-viewer', '../item-card'. Koordinator tinggal mengimpor { DetailView } dari '@/components/waranusa/views/detail-view', { KatalogView } dari katalog-view, { InstrumentView } dari instrument-view, dan { FeaturedCulture, ExperienceSection, ContributeSection } dari home-sections untuk dipasang di page.tsx.
- TIDAK menyentuh file lain (page.tsx, site-header/footer, archive-view, item-detail-dialog, province-view, hooks, admin, kontribusi milik agent lain/koordinator).
- QUALITY GATE: `bun run lint` → 0 error dari file saya (2 error tersisa ada di views/admin/item-form-dialog.tsx & views/admin/items-tab.tsx milik agent 9-c: react-hooks/set-state-in-effect); `bunx tsc --noEmit` → 0 error di seluruh file saya (error tsc tersisa hanya di file legacy/agent lain: archive-view, item-detail-dialog, models/*, views/admin/provinces-tab, lib/serialize, examples, skills); tail dev.log bersih tanpa error kompilasi (GET / 200).
- Catatan lint: react-hooks/set-state-in-effect (rule baru) melarang setPage(1) di useEffect — solusi: reset halaman langsung di handler filter; pola sama perlu diterapkan agent admin untuk items-tab.

Stage Summary:
- Views publik selesai: DetailView (detail budaya + sumber/atribusi + terkait), KatalogView (filter + pagination 12/hal), InstrumentView (daftar + 3D + volume Web Audio) di src/components/waranusa/views/, plus home-sections.tsx (FeaturedCulture/ExperienceSection/ContributeSection), rebrand hero, item-card → openItemDetail + badge brand, instrument-audio.setVolume.
- Lint: 0 error dari file 9-a (2 error tersisa milik views/admin — agent 9-c); tsc bersih untuk file 9-a; dev.log bersih.
- Menunggu koordinator Task 9: pasang views ke page.tsx (route tunggal "/"), hapus alias useContributions/useReviewContribution di use-waradata.ts setelah komponen lama (archive-view/item-detail-dialog/contribute-view) diganti.

---
Task ID: 9-c
Agent: frontend-admin-cms
Task: Panel Pengelola (admin CMS) frontend — hook data admin + AdminView lengkap dengan 6 tab (Dashboard, Objek Budaya, Wilayah, Kategori, Kontribusi, Pengguna)

Work Log:
- src/hooks/use-admin-data.ts (BARU): helper fetchAdmin<T> (fetch same-origin cookie; non-OK → throw Error(data.error ?? pesan default) sehingga pesan server berbahasa Indonesia muncul di toast); query TanStack: useAdminStats (['admin','stats']), useAdminItems (['admin','items',params] — param {q?,status?,province?,category?,page,pageSize}, meta {total,page,pageSize,totalPages}), useAdminProvinces (['admin','provinces'] + tipe AdminProvinceRecord = ProvinceSummary & {description,history,traditions}), useAdminCategories (['admin','categories']), useAdminContributions (['admin','contributions',status|'ALL']), useAdminUsers (['admin','users']); mutations: useCreate/useUpdateAdminItem, useCreate/useUpdateAdminProvince, useCreate/useUpdateAdminCategory, useSetContributionStatus ({contribution, createdItemId}), useUpdateUserRole — semua dengan invalidasi relevan (items→items+stats; provinces/categories→admin+publik+stats; contributions→contributions+stats+items+my-contributions; users→users+stats), retry:false untuk query admin (menghindari spam retry 401/403).
- src/components/waranusa/views/admin-view.tsx (BARU): gate berlapis — isLoading → skeleton panel; !me → kartu wn-edge-gold terpusat ikon ShieldCheck "Panel Khusus Pengelola" + penjelasan proteksi autentikasi & peran + Button "Masuk" (setLoginRedirect('admin'); setView('masuk')); role CONTRIBUTOR → kartu "Akses ditolak"; KOMENTAR eksplisit: gate hanya UX, server tetap otoritas. Header panel: judul + avatar inisial + nama + ROLE_LABEL. Tabs shadcn (Dashboard | Objek Budaya | Wilayah | Kategori | Kontribusi | Pengguna — Pengguna hanya SUPER_ADMIN) dengan ikon lucide dan TabsList flex-wrap untuk mobile.
- admin/shared.tsx: canManageContent (SUPER_ADMIN/EDITOR), formatDateId/formatDateTimeId, labelForCategory (fallback CATEGORIES), ItemStatusBadge (PUBLISHED emerald, DRAFT muted, PENDING_REVIEW amber, REJECTED merah, ARCHIVED slate), ContributionStatusBadge (SUBMITTED teal, UNDER_REVIEW amber, APPROVED emerald, REJECTED merah, NEEDS_REVISION oranye), AdminErrorPanel (tombol Coba lagi), AdminEmpty, TableSkeleton.
- admin/stats-tab.tsx: 9 kartu statistik grid 2/3/4 (Terpublikasi, Draft, Menunggu Tinjauan, Diarsipkan, Bisa Dimainkan, Model 3D, Provinsi, Kategori, Pengguna) dengan aksen brand (teal/gold/orange/ocean/green); panel "Kontribusi Komunitas" total + hitungan 5 status (badge berwarna); daftar "Kontribusi Terbaru" & "Objek Terbaru" (klik objek → openItemDetail); skeleton loading + AdminErrorPanel retry.
- admin/items-tab.tsx + admin/item-form-dialog.tsx: toolbar cari (debounce 350 ms via callback timer), filter status/provinsi(slug)/kategori(key), tombol "Tambah Objek" hanya EDITOR/SUPER_ADMIN (REVIEWER baca-saja, kolom aksi disembunyikan); tabel overflow-x-auto (Nama + badge amber "perlu tinjauan" bila needsReview, Kategori, Provinsi, Status, Diperbarui, DropdownMenu: Edit / Publikasikan / Jadikan Draft / Arsipkan / Tolak dengan AlertDialog konfirmasi untuk arsip & tolak); paginasi Sebelumnya/Berikutnya + "Halaman X dari Y • N objek"; dialog max-w-2xl (body scroll): nama, kategori, provinsi, ringkasan counter x/200, deskripsi, filosofi (helper "Isi bila didukung sumber"), status (create: DRAFT/PENDING_REVIEW/PUBLISHED sesuai guard server; edit: semua), switch "Bisa dimainkan" & "Perlu peninjauan sumber", imageUrl + pratinjau h-28 + helper atribusi AI otomatis, model3d (helper kunci prosedural), editor sumber dinamis (title wajib, url, publisher, year, license, note + Hapus baris + Tambah Sumber); parts/sounds/melody tidak diedit & tidak dikirim; sources dikirim hanya bila dirty (backend replace-all); validasi klien (3-120/10-200/≥20/filosofi wajib saat create) + pesan server inline & toast; form di-reset via remount (key per item) menggantikan setState-in-effect.
- admin/provinces-tab.tsx: tabel Nama/Slug/Pulau(ISLAND_MAP)/Ibu Kota/Objek/Edit; dialog nama, slug (opsional create, disabled edit), gugus pulau (Select ISLAND_GROUPS), ibu kota, lat/lng (number, validasi -90..90 / -180..180), motto, deskripsi, sejarah, tradisi.
- admin/categories-tab.tsx: tabel Key (mono teal)/Label/Deskripsi/Objek Terpublikasi/Edit; dialog key (disabled saat edit — server tolak 400), label, deskripsi, icon (helper "Nama ikon lucide, mis. Home"), image (jalur gambar); validasi key regex UPPER_SNAKE di klien.
- admin/contributions-tab.tsx: filter pill (Semua/Diajukan/Menunggu/Perlu Revisi/Disetujui/Ditolak); kartu kontribusi lengkap: judul, badge status, kategori label, provinsi, pengirim (c.user nama+email, fallback contributorName), tanggal, isi penuh (whitespace-pre-line), sumber rujukan, blok aiNote berlabel "Catatan kurasi otomatis (AI) — bukan keputusan akhir" (border emas), riwayat ModerationReview (aksi + reviewer + tanggal + catatan); area aksi untuk status SUBMITTED/UNDER_REVIEW/NEEDS_REVISION + role REVIEWER/SUPER_ADMIN/EDITOR: Textarea catatan peninjauan + "Tandai Ditinjau" (outline), "Setujui" (emerald + Checkbox default ON "Buat objek budaya & publikasikan" → publish boolean), "Minta Revisi" (oranye), "Tolak" (merah + AlertDialog); status final → aksi disembunyikan, blok keputusan (Disetujui/Ditolak + reviewNote + tombol "Lihat objek budaya" → openItemDetail); toast "Disetujui & dipublikasikan" dengan ToastAction "Lihat objek" bila createdItemId non-null (kasus null = kontribusi tanpa provinsi, toast penjelasan); busy per-kartu via mutation.variables.id, semua tombol disabled saat isPending.
- admin/users-tab.tsx (SUPER_ADMIN): tabel Nama (+tanda "(Anda)")/Email/Peran (Select USER_ROLES per baris → PATCH role)/Kontribusi/Terdaftar; selektor terkunci untuk baris sendiri bila satu-satunya SUPER_ADMIN (server 400 tetap ditangani toast galat); catatan "Peran menentukan akses panel pengelola dan kemampuan moderasi…".
- Kepatuhan larangan: hanya menambah file baru (hooks/use-admin-data.ts + views/admin-view.tsx + views/admin/*); tidak mengubah page.tsx/backend/route lain; tanpa emoji & lorem ipsum; palet brand teal/emas/oranye/ocean via kelas brand (bg-brand-gold, text-brand-teal, border-brand-gold, dst).
- QUALITY GATE: `bun run lint` → 0 error 0 warning; `bunx tsc --noEmit` → 0 error untuk semua file task (error lain milik file lama di luar cakupan, tidak disentuh); `tail dev.log` → hanya "Compiled" tanpa error kompilasi dari file task.

Stage Summary:
- Panel Pengelola frontend selesai: 9 file baru (1 hook + 1 pintu masuk + 7 komponen tab/dialog pendukung di views/admin/) sesuai kontrak API Task 8/8-a, siap dipasang di page.tsx sebagai view 'admin' oleh task koordinasi berikutnya.
- RBAC di UI: CONTRIBUTOR ditolak (UX), REVIEWER baca-saja konten namun bisa memoderasi kontribusi, EDITOR/SUPER_ADMIN tulis penuh, tab Pengguna khusus SUPER_ADMIN; semua galat otorisasi server tampil sebagai panel galat/toast berbahasa Indonesia.
- Label status/peran konsisten dari src/lib/types.ts (ITEM_STATUS_LABEL, CONTRIBUTION_STATUS_LABEL, ROLE_LABEL, ITEM_STATUSES, USER_ROLES).

---
Task ID: 10
Agent: z-main (koordinator)
Task: Integrasi seluruh view ke page.tsx + perbaikan komponen legacy + lint/tsc

Work Log:
- page.tsx ditulis ulang: 9 view SPA dipasang (jelajah = Hero+MapExplorer+FeaturedCulture+ExperienceSection+ContributeSection / ProvinceView; katalog; budaya=DetailView; instrumen=InstrumentView; arsip; kontribusi; riwayat; masuk; admin).
- Menghapus src/components/waranusa/item-detail-dialog.tsx (digantikan DetailView); archive-view dipindah ke API store baru (openItem dihapus); import CATEGORIES/ISLAND_GROUPS dipertahankan karena masih dipakai filter.
- Fix tsc: types.ts re-export SoundParam (dipakai lib/serialize.ts), models/instruments.tsx useRef<THREE.Group> (React.GroupRef tidak ada), models/houses.tsx typing array JSX.
- bunx tsc --noEmit: 0 error di src/ (sisa error hanya examples/ & skills/ di luar lingkup aplikasi).
- bun run lint: bersih. dev.log: compiled, GET / 200, semua endpoint kunci 200 (stats, categories, items, auth/me).

Stage Summary:
- Integrasi frontend-backend selesai; aplikasi siap diverifikasi browser (Task 11).

---
Task ID: 11
Agent: z-main (koordinator)
Task: Verifikasi E2E agent-browser (desktop 1366px & mobile 390px) + perbaikan

Work Log:
- Desktop: beranda (hero baru + statistik live 18/90/18 + logo resmi) ✓; peta 7 gugus pulau warna brand + disclaimer "Peta stilasi" ✓; provinsi Jawa Tengah (tab kategori + kartu Joglo) ✓; DetailView Joglo: ThreeViewer orbit/rotasi/reset + klik penanda "Soko Guru" → panel fungsi+filosofi + "Lihat dari dekat" ✓; Sumber & Atribusi dengan badge lisensi (CC BY-SA — Wikipedia) ✓; Objek Terkait ✓; atribusi ilustrasi AI di bawah media ✓.
- Katalog: filter lengkap + pencarian "gamelan" → 3 hasil + paginasi "Halaman 1 dari 1 • 3 item" + Reset ✓.
- Instrumen Virtual: 18 instrumen, ganti ke Saron, pad nada Rapai/Saron diklik tanpa error, slider volume, kartu "Cara Berinteraksi", catatan "sintesis demonstrasi Web Audio API — bukan rekaman autentik" ✓.
- Auth: halaman Masuk + kartu akun demo (klik → autofill); login warga@waranusa.id → toast selamat datang + header menampilkan nama; menu akun kontributor TIDAK menampilkan Panel Pengelola (RBAC UI) ✓.
- Kontribusi: form lengkap → submit → kartu sukses "Diajukan (SUBMITTED)" + blok "Catatan kurasi otomatis (AI) — bukan keputusan akhir" + toast ✓. Riwayat menampilkan status + catatan ✓.
- Admin: login admin → Panel Pengelola; Dashboard (90 objek, 36 model 3D, 4 pengguna, hitungan kontribusi per status) ✓; moderasi: Tandai Ditinjau → badge + jejak audit "Riwayat Tinjauan" ✓; Setujui kontribusi ber-provinsi (Tari Baris War) → toast "Disetujui & dipublikasikan" + tombol "Lihat objek budaya" ✓; objek baru muncul di katalog publik (pencarian "Baris War") ✓; kontribusi tanpa provinsi → toast jujur "tidak dapat dipublikasikan otomatis — atur provinsi" (perilaku terdokumentasi) ✓; tab Objek Budaya (91 item, badge "perlu tinjauan" otomatis, filter + paginasi) ✓; tab Pengguna (4 akun, select peran, guard "minimal satu Administrator") ✓.
- Mobile 390px: layout responsif, footer sticky, statistik ter-update (91). Perbaikan ditemukan saat verifikasi: (1) nav mobile tanpa nama aksesibel → ditambah aria-label per tombol nav; (2) wordmark logo terpotong → shrink-0 + ukuran responsif.

Stage Summary:
- Seluruh golden path terverifikasi browser (desktop + mobile); konsol & dev.log bersih (hanya warning deprecation THREE.Clock yang harmless); browser ditutup.

---
Task ID: 12
Agent: z-main (koordinator)
Task: Dokumentasi README + laporan akhir

Work Log:
- README.md ditulis: ringkasan fitur, teknologi, cara menjalankan, env vars, skema DB + keputusan desain, endpoint API, akun demo (waranusa123), pengujian yang benar-benar dijalankan, aset & lisensi, batasan MVP jujur, langkah menuju online.
- Verifikasi akhir: bun run lint bersih; dev server berjalan normal di port 3000.

Stage Summary:
- WaraNusa MVP evolusi selesai: rebranding palet teal/gold + logo resmi, auth & 4 peran, alur publikasi & moderasi dengan audit, admin CMS penuh, katalog/detail/instrumen/arsip, kontribusi warga, dokumentasi lengkap.
