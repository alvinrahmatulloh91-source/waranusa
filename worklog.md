# WaraNusa — Worklog

---
Task ID: 0-1
Agent: main (Z.ai Code)
Task: Audit workspace & keputusan arsitektur

Work Log:
- Audit package.json: Next.js 16, React 19, TS 5, Tailwind 4, shadcn/ui lengkap, Prisma 6+SQLite, zod 4, zustand, framer-motion, sonner, recharts
- Audit runtime: PHP/Composer/MySQL TIDAK tersedia; hanya bun 1.3.14 + node 24
- Keputusan: pertahankan stack berjalan (aturan master prompt bag.2 #4 & bag.5); pola arsitektur Laravel dipetakan 1:1 ke REST API Next.js (Route->Controller->Service, zod validation, session token auth ala Sanctum, Prisma migration+seeder, backend-managed media storage)
- Instalasi: leaflet, react-leaflet, three, @react-three/fiber, @react-three/drei, bcryptjs
- Logo banner user disalin ke public/uploads/brand/waranusa-banner.png
- Prisma schema 13 tabel dipush ke db/custom.db
- Generate 9 gambar seed via z-ai image CLI (background)

Stage Summary:
- Stack final: Next.js 16 (React+TS) + REST API route handlers (pola Laravel) + Prisma/SQLite + Tailwind4/shadcn + Leaflet + R3F
- Kontrak API & tipe didefinisikan di src/lib/types.ts + api-client.ts (sumber kebenaran untuk semua agent)
- Upload file disimpan di <root>/uploads/media (di luar public), disajikan via GET /api/media/file/[...path] dengan validasi magic bytes
- SPA hash-router di src/app/page.tsx (satu-satunya route yang terekspos): #/ , #/jelajah, #/katalog, #/budaya/[slug], #/instrumen, #/arsip, #/kontribusi, #/masuk, #/admin/*
- Akun demo seed: admin@waranusa.id (SUPER_ADMIN), editor@waranusa.id (EDITOR), reviewer@waranusa.id (REVIEWER), kontributor@waranusa.id (CONTRIBUTOR) — password tercantum di README

---
Task ID: 2-b
Agent: full-stack-developer
Task: Website publik

Work Log:
- Baca worklog 0-1 + seluruh kontrak: src/lib/types.ts, api-client.ts, router.ts, constants.ts, hooks/use-async-data.ts, auth-store.ts, settings-store.ts, shared components (states, brand-logo, status-badge), site-header (konsistensi navigasi), globals.css (token warna brand + card-hover + nice-scroll).
- Buat src/components/catalog/culture-card.tsx — kartu budaya <a> ke #/budaya/[slug]: cover aspect-[4/3] dengan fallback ImageOff (onError), chip kategori teal, judul, summary line-clamp-2, footer MapPin wilayah + Eye viewCount (Intl id-ID), prop compact untuk scroll horizontal.
- Buat src/components/landing/landing-view.tsx — hero 2 kolom (eyebrow, H1 "Kenali Akar, Jelajahi Budaya", paragraf settings.aboutShort fallback, CTA #/jelajah teal + #/katalog outline) dengan visual /uploads/seed/hero-archipelago.png (fallback gradient) + 2 badge melayang framer-motion (Peta Interaktif / Model 3D) di atas bg-brand-gradient-soft + pola titik; strip statistik nyata (Promise.all items pageSize 1 → meta.total, regions, categories) dengan skeleton; 4 fitur sebagai daftar editorial bernomor (Compass/BookOpen/Box/Music4); Sorotan Budaya 3 CultureCard featured-dulu + link semua; Pengalaman 3D split (teks + ModelViewer api.items.detail("rumah-gadang") height 380 autoRotate); Instrumen Virtual split terbalik (gambar gamelan + tombol play navigate /instrumen, CTA Mainkan Saron bg-brand-gold); banner kontribusi bg-brand-gradient dengan settings.contributionNotice; MotionConfig reducedMotion="user".
- Buat src/components/explore/explore-view.tsx — SectionHeading + catatan jujur Leaflet/OSM; grid lg:col-span-8 IndonesiaMap(regions, selectedId, onSelect) / lg:col-span-4 panel detail (EmptyState + chips wilayah bila belum pilih; Card nama/pulau/ibu kota/summary/description/itemCount + tombol ke #/katalog?region=CODE); ?region=CODE pra-pilih & onSelect navigate replace; chips wilayah lg:hidden di bawah peta untuk sentuh; skeleton & ErrorState retry.
- Buat src/components/catalog/catalog-view.tsx — state penuh dari URL (q, kategori, wilayah, sort, page) via buildQuery navigate replace; search input debounce 350ms; toolbar sticky top-16 (Input + Select kategori/wilayah/urutan dari API, aria-label); grid sm:2 lg:3 CultureCard dengan skeleton 6, EmptyState reset filter, ErrorState retry; Pagination shadcn (prev/next, angka + ellipsis, disabled state, aria-label) + info "Menampilkan X–Y dari Z objek" dari meta.
- Buat src/components/culture/culture-detail-view.tsx — hook lokal useItemDetail (akses ApiError.status untuk 404 → EmptyState "Objek budaya tidak ditemukan" + kembali ke katalog); Breadcrumb Beranda/Katalog/{kategori}/{judul}; header kiri (badge kategori + wilayah MapPin, H1, summary, meta Dilihat X kali · Diperbarui tanggal id-ID, tombol Bagikan [navigator.share → clipboard + toast] & Kembali) kanan cover rounded-3xl fallback; section Model 3D Interaktif (modelMedia ATAU slug ∈ PROCEDURAL_MODELS → ModelViewer height 460 + hint seret/zoom/titik emas; bila tidak ada → info box jujur, tanpa viewer kosong); Tabs 4 konten (Deskripsi/Sejarah/Makna/Sumber) dengan EmptyState inline bila kosong; daftar sumber (ikon per sourceType, external link noopener, attribution/license/accessDate, verificationNote ShieldCheck); galeri grid + Dialog gambar besar; audio player (tanpa autoplay) + catatan "belum tersedia" bila kosong; Konten Terkait kategori sama maks 3 horizontal scroll (komponen anak useAsyncData).
- Buat src/components/instrument/instrument-view.tsx — hero + Alert kejujuran audio sintetis Web Audio API; pemilih 3 kartu (Saron aktif, Angklung "Segera", Rebab "Rencana" — non-aktif disabled + toast.info "Sedang dalam pengembangan"); layout 2 kolom: Card SaronInstrument(volume) + panel Cara Memainkan (klik/tombol 1–7/Slider volume 0–1 → prop volume), info laras pelog & balungan, sumber Wikipedia + catatan sintetis, tombol #/budaya/gamelan-jawa; deep-link ?instrumen= → toast jujur; fallback teks WebGL.
- Buat src/components/archive/archive-view.tsx — api.sources.list({search debounced 350ms, type via Select labelSourceType}); baris sumber ikon per tipe (BookMarked/BookOpen/Globe/Landmark/Archive/FolderOpen), title, creator, badge tipe, chip objek terkait (itemTitle/itemSlug opsional via tipe lokal ArchiveSource) → #/budaya/[slug], URL external, accessDate, verificationNote ShieldCheck; pagination server-meta bila ada, fallback klien 10/halaman; skeleton/EmptyState/ErrorState.
- Buat src/components/contribute/contribute-view.tsx — form validasi manual (Judul*, Wilayah opsional, Kategori*, Deskripsi* min 20 + counter, Sumber Referensi, Nama*, Email* regex) error inline per field + ApiError.fields; submit api.contributions.create → Kartu sukses besar: refCode font-mono text-2xl text-brand-teal + tombol salin, alur Diajukan → Peninjauan → Keputusan, "Cek Status Nanti" mengisi form lacak + scroll; panel Lacak (WN-XXXXXX + email → api.contributions.track) tampil status badge contributionStatusColor + riwayat reviews (aksi/nama/tanggal) + Alert perlu revisi; prefill nama/email dari useAuth; settings.contributionNotice sebagai Alert; catatan jujur lampiran media dalam pengembangan; route.query.ref untuk deep-link lacak.
- Buat src/components/account/login-view.tsx — split layar: panel kiri bg-brand-gradient (BrandLogo dark, tagline, kutipan, 3 fitur) / kanan form Email + Password (toggle Eye show/hide) → useAuth().login → toast.success "Selamat datang, {name}!" → navigate(canAccessCMS() ? /admin/dashboard : /kontribusi-saya); error inline + toast; kartu Akun Demo (4 akun seeder, tombol "Isi otomatis" hanya mengisi form) + catatan dev-only; auto-redirect bila sudah login; link kembali beranda.
- Buat src/components/account/my-contributions-view.tsx — bila !user EmptyState + tombol masuk; bila login api.contributions.my() dengan deteksi ApiError 401 → navigate /masuk replace; kartu kontribusi (judul, refCode mono, tanggal id-ID, badge status berwarna, deskripsi clamp, catatan reviewer terakhir); header tombol "Kirim Kontribusi Baru"; EmptyState/ErrorState/skeleton.
- Verifikasi: bunx tsc --noEmit → 0 error di 10 file saya (sisa error pada file agent lain: admin views belum lengkap, api-client, server controllers); dev.log tidak mencatat error kompilasi pada file saya; kontrak ModelViewer/SaronInstrument rekan 2-d sudah dicek cocok dengan pemakaian.

Stage Summary:
- 10 file publik selesai dan terpasang ke shell: landing-view, explore-view, catalog-view + culture-card, culture-detail-view, instrument-view, archive-view, contribute-view, login-view, my-contributions-view — semuanya default export (kecuali CultureCard named export) sesuai kontrak page.tsx.
- Semua data nyata via api.* (tanpa fetch manual kecuali <audio>); loading (Loader/skeleton), error (ErrorState + retry), dan empty state hadir di setiap pengambilan data; state URL sinkron untuk jelajah (?region) dan katalog (q/kategori/wilayah/sort/page) sehingga tautan dapat dibagikan.
- Kejujuran MVP dijaga: catatan peta titik-koordinat, audio instrumen sintetis, model 3D belum tersedia, lampiran media belum bisa diunggah, akun demo dev-only.
- Tidak menyentuh src/lib/**, src/app/**, admin, three, map; tanggal id-ID, target sentuh ≥44px, alt/aria/label lengkap, framer-motion hemat + reducedMotion="user".
- Menunggu integrasi: IndonesiaMap (agent map, kontrak sudah dipatuhi) dan backend admin (error kompilasi berasal dari file rekan, bukan file task 2-b).

---
Task ID: 2-d
Agent: full-stack-developer
Task: 3D viewer + instrumen virtual + peta Leaflet

Work Log:
- Baca worklog 0-1/2-b, kontrak src/lib/types.ts (CulturalItem/Hotspot/Region) & constants.ts (PROCEDURAL_MODELS), token warna brand di globals.css (--color-brand-*), API shadcn (Button size icon, Card, Slider, Badge), layout.tsx (Sonner Toaster terpasang).
- Buat src/components/three/procedural-models.tsx — 4 model R3F murni primitives (tanpa pencahayaan, dipasang pemanggil), konvensi pangkal y=0 tinggi ±2 unit: ProceduralRumahGadang (33 mesh: 8 tiang panggung, lantai, badan, lis, 4 jendela + pintu, 2 pelana atap miring + nok, 6 gonjong cone tilt, tangga 3 anak + 2 pegangan), ProceduralJoglo (24 mesh: 2 lantai batu bertingkat, 4 saka guru, ring borek, 8 kolom pendopo, ring, limas luar cone 4-seg rot PI/4, tumpang sari 3 tumpuk, mustaka + bebenah emas), ProceduralSaron (kaki, resonator + bibir + trim perunggu, 7 bilah interaktif userData noteIndex di x -0.75..0.75, 2 tabuh) — bilah aktif naik 0.05 + emissive gold via useFrame lerp yang memanggil invalidate (kompatibel frameloop demand), ProceduralGeneric (pedestal batu + torus knot perunggu + inti ikosahedron emas + ring). Export PROCEDURAL_SLUG_MAP {rumah-gadang, joglo, gamelan-jawa→saron, default generic} + DEFAULT_PROCEDURAL + SARON_KEY_XS + helper ProceduralModel; material MeshStandardMaterial (kayu #8B5A2B/#6B4423/#4E3320, ijuk #4A3524, perunggu #B08D57 metalness 0.9, emas #F2B544, batu) semua castShadow/receiveShadow.
- Buat src/components/three/saron-audio.ts — singleton SaronAudio: AudioContext lazy di interaksi pertama (+resume suspended, fallback webkitAudioContext), playNote = 3 oscillator sine (f, f×2.76, f×5.4) detune ±3 cent, envelope attack 5ms + exponential decay 1.4/0.6/0.25s, rantai voice→lowpass 8kHz→master gain=volume, noise burst 20ms bandpass 2.4kHz sebagai strike, semua node di-disconnect via osc.onended + cleanup timer, updateVolume setTargetAtTime, dispose() mematikan voice aktif & close context. Tanpa `any` (fallback webkit via tampilan tipe terbatas).
- Buat src/components/three/model-viewer.tsx — default export ModelViewer({item, height=420, showHotspots=true, autoRotate=false, className}); LAZY MOUNT via IntersectionObserver (rootMargin 220px, sekali saja; placeholder "Viewer 3D siap dimuat" + ikon Box sebelum terlihat); preflight WebGL (getContext webgl2/webgl) → panel informatif bila tak didukung; GLB bila modelMedia.url ber-akhiran .glb/.gltf (query/hash diabaikan) via drei useGLTF + Suspense fallback Html "Memuat model…", SilentErrorBoundary (class lokal) di sekeliling GltfModel dan di sekeliling Canvas → gagal GLB = fallback prosedural + toast.info sekali "Model GLB gagal dimuat, menampilkan model demo"; GltfModel men-clone scene, normalisasi skala ke 2.2 unit + pangkal y=0 + terpusat, castShadow ditraverse; Canvas shadows="soft", dpr [1,2], kamera [3,2.2,3.2] fov 45, frameloop demand (→always saat autoRotate), ambient 0.7 + directional castShadow (shadow camera ±4, bias) + spot ringan; lantai circle #F3F8F7 receiveShadow; OrbitControls makeDefault (pan off, zoom 2–9, maxPolar 1.45, damping, autoRotate dari state spin); tombol overlay reset kamera (controls.reset()) & toggle rotasi (Rotate3d/Pause) dengan aria-label; hotspots published difilter, sphere emas emissive + Html badge nomor (button aria-label) → klik membuka Card panel absolute-bottom (judul, deskripsi, tombol X), klik area kosong menutup; fatal state "Model 3D tidak dapat dimuat" + tombol "Coba lagi" (key++ remount Canvas + reset boundary via key renderKey); state direset saat ganti item.id.
- Buat src/components/three/saron-instrument.tsx — named export SaronInstrument({volume=0.7}) + PELOG_FREQUENCIES (261.63..587.33, didokumentasikan sebagai pendekatan demo — pelog sebenarnya tidak temperamen) + PELOG_LABELS 1–7; Canvas sendiri 380px (kamera [0,1.35,2.9] fov 40, frameloop demand + AutoInvalidate, OrbitControls tanpa zoom/pan agar scroll aman); ProceduralSaron di-wiring onNote→playNote + activeNote (reset 250ms); label nomor di atas bilah via Html pointer-events-none; keyboard 1–7 (abaikan input/textarea/select/contentEditable & modifier); UI: slider volume (initial dari prop, sinkron saat prop berubah, updateVolume), tombol Demo Melodi (urutan [1,2,3,5,6,5,3,2,1] interval 350ms, sekali putar, toggle hentikan; label jujur "urutan nada contoh, bukan lagu tradisional spesifik"), Badge "Web Audio API — audio sintetis", petunjuk klik/tombol 1–7, 7 Button bulat bernomor sebagai alternatif aksesibel (aria-label per nada, aktif = gold), aria-live "Nada X dibunyikan" untuk pembaca layar; cleanup unmount: timer + saronAudio.dispose() + reset kursor.
- Buat src/components/map/indonesia-map.tsx — default export IndonesiaMap({regions, selectedId, onSelect, className}); CLIENT-ONLY: mounted gate + import("react-leaflet") DINAMIS di useEffect (evaluasi leaflet tidak pernah terjadi saat SSR/prerender — lebih tegas dari sekadar gate render), import "leaflet/dist/leaflet.css" statis; skeleton "Memuat peta…" hingga siap; MapContainer center [-2.5,118] zoom 5, scrollWheelZoom false → enable saat klik peta, disable saat mouseout; fitBounds [[-11,95],[6,141]] sekali saat map siap; zoomControl + attributionControl aktif; TileLayer CARTO light_all (attribution OSM & CARTO); CircleMarker r9 teal #159D9A stroke putih w3 fillOpacity 0.95, selected r12 fill #F2B544, Tooltip permanent direction top "font-semibold" nama wilayah, click→onSelect(region); EmptyState di dalam area peta bila regions kosong; teks sumber "OpenStreetMap & CARTO — penanda titik koordinat (bukan batas administratif)" di bawah; kontainer h-[320px] sm:h-[420px] lg:h-[520px] + wrapper relative z-0 (penahan z-index leaflet ≤400).
- TEMUAN LINGKUNGAN: @types/leaflet ternyata TIDAK terpasang (tidak ada di package.json/bun.lock, meski brief menyatakan ada) → tipe bawaan react-leaflet v5 yang mengekstend `leaflet` terdegradasi (semua prop dianggap tidak ada). Patuh "JANGAN install apapun lagi": TIDAK menginstal; sebagai gantinya deklarasikan interface lokal presisi (LeafletMapLike, MapContainerProps, dst.) + konversi tipe terkendali `as unknown as` di pickComponents() — tanpa `any`, file tetap type-safe baik dengan maupun tanpa @types/leaflet (jika nanti dipasang rekan, tidak ada yang rusak).
- Verifikasi: bunx tsc --noEmit → 0 error di 5 file saya (procedural-models, saron-audio, model-viewer, saron-instrument, indonesia-map); sisa error tsc ada di file rekan (admin views, api-client, page.tsx, examples, skills) — di luar scope; dev.log hanya menunjukkan module-not-found admin milik agent lain. Lint/build/server tidak dijalankan sesuai instruksi.

Stage Summary:
- 5 file selesai: src/components/three/procedural-models.tsx, src/components/three/saron-audio.ts (file tambahan yang diizinkan), src/components/three/model-viewer.tsx, src/components/three/saron-instrument.tsx, src/components/map/indonesia-map.tsx — signature persis kontrak: ModelViewer default export {item,height,showHotspots,autoRotate,className}, SaronInstrument named + PELOG_FREQUENCIES, IndonesiaMap default {regions,selectedId,onSelect,className}.
- Alur media 3D: GLB valid → useGLTF (dinormalisasi otomatis); gagal → prosedural + toast; tanpa modelMedia → prosedural per slug (rumah-gadang/joglo/gamelan-jawa/generic). Canvas 3D lazy (IntersectionObserver) sehingga berat 3D tidak menghantam first load halaman.
- Keputusan teknis: frameloop demand + AutoInvalidate + invalidate-while-animating (hemat CPU, autoRotate switch ke always); ErrorBoundary class ganda (per-GLB & per-Canvas) dengan key renderKey agar "Coba lagi" benar-benar me-remount boundary; tipe leaflet lokal karena @types/leaflet absen di lingkungan.
- Keterbatasan: hotspots memakai koordinat apa adanya (asumsi authoring dalam ruang model pangkal-0 tinggi ±2); tooltip wilayah permanent bisa tumpang tindih pada zoom 5; audio tetap sintetis 3-parsial (bukan sampling gamelan asli); frekuensi pelog adalah pendekatan temperamen-demo; retry GLB yang gagal bisa kembali gagal bila promise yang ditolak masih tersimpan di cache loader.
---
Task ID: 2-c
Agent: full-stack-developer
Task: CMS Admin

Work Log:
- Baca kontrak sumber kebenaran dulu: worklog 0-1, src/lib/types.ts, api-client.ts, constants.ts, router.ts, use-async-data.ts, auth-store.ts, admin-shell.tsx, komponen shared (states, status-badge, confirm-dialog), page.tsx (AdminApp default-import), globals.css (palet brand), dan UI shadcn tersedia.
- Menulis 12 file di src/components/admin/ (tanpa menyentuh file lain):
  1) admin-app.tsx — default export AdminApp({route}); router internal berdasarkan route.segments (dashboard, cultural-items[/create|/{id}/edit], regions, categories, media, sources, contributions, users, settings) → dibungkus <AdminShell route={route}>; rute tak dikenal → EmptyState 404 CMS.
  2) dashboard-view.tsx — api.admin.stats() jadi 6 kartu ikon (Objek Budaya + breakdown PUBLISHED/DRAFT/ARSIP, Kategori, Wilayah, Media + jumlah Model 3D & Audio, Kontribusi Menunggu Peninjauan highlight gold, Pengguna) dengan framer-motion halus; bawah: Aktivitas Terbaru (api.admin.activity pageSize 8, ikon per action, waktu relatif, nama user) + panel Aksi Cepat (navigasi hash). Skeleton + ErrorState + toast.
  3) items-view.tsx — tabel (thumb 40px, judul+slug, kategori, wilayah, StatusBadge, Star gold bila featured, viewCount, tanggal id-ID, dropdown aksi). Filter dari route.query (q/status/category/page) dengan search debounce 400ms → navigate replace; Select status & kategori reset halaman. Aksi: Edit, Lihat publik (disabled bila bukan PUBLISHED), Publikasikan/Arsipkan (konfirmasi AlertDialog terkontrol) & Hapus via api.admin.items.update/delete; reload + toast; tombol "+ Objek Budaya".
  4) item-editor.tsx — form create/edit lengkap A–G: Identitas (judul, slug auto dari judul via slugify lokal & editable, kategori/wilayah Select, switch featured), Konten (ringkasan max 500 + counter, deskripsi, sejarah, makna), Media (cover/model 3D/audio single + galeri multi via MediaPickerButton), Hotspot 3D (edit-mode bila model ada: daftar dari detail, X/Y/Z number step 0.1, switch published, simpan/hapus per hotspot via api.admin.hotspots.*, tambah hotspot, hint koordinat model prosedural), Sumber repeatable (disimpan via sources pada POST/PATCH), Atribusi & Lisensi, panel sticky kanan Status & Aksi (Simpan Draft/Simpan Perubahan/Publikasikan/Arsipkan via ConfirmDialog, Pratinjau: window.open slug bila PUBLISHED atau Dialog ModelViewer + catatan draft, Hapus Objek destructive → navigate list). Validasi required + ApiError.fields inline, guard beforeunload, toast tiap aksi, create sukses → navigate(/admin/cultural-items/{id}/edit, replace).
  5) media-picker.tsx — MediaPicker (Dialog grid 24/hal, search, pilih radio/checkbox, pagination, tombol "Unggah baru" inline, auto-select aset baru), MediaPickerButton (single kartu preview + Ganti/Hapus + "Lihat 3D" Dialog ModelViewer; multi thumbnail grid + hapus per item), UploadInline (drag-drop + input file, XHR progress api.admin.media.upload dengan onProgress → Progress bar, validasi ukuran MAX_UPLOAD_BYTES & mismatch tipe, pesan error server 422 ditampilkan), AudioPlayButton, MiniPager, helper bersama (humanSize, fmtDateID, slugify, detectMediaType, fakeItemForAsset, MediaPreview, MediaTypeBadge).
  6) regions-view.tsx — tabel wilayah (kode mono, nama, label kelompok pulau enak dibaca, ibu kota, koordinat 4 desimal, jumlah objek) + dialog create/edit (code pattern ID-XX divalidasi klien, name, islandGroup Select, capital, summary, description, lat/lng number step 0.0001); hapus dengan ConfirmDialog, 409 dari server → toast.error pesan server.
  7) categories-view.tsx — tabel (ikon lucide, nama, slug, deskripsi, jumlah objek) + dialog create/edit (name*, slug auto dari nama & editable, deskripsi, ikon Select 8 pilihan lucide dengan preview, sortOrder).
  8) media-view.tsx — Media Manager penuh: toolbar (search debounce, Select tipe MEDIA_TYPES + label, Select status Aktif/Arsip/Semua, tombol Unggah → dialog UploadInline), grid kartu 18/hal (preview per tipe + play audio mini, nama, tipe, ukuran human, tanggal, badge ARSIP), area grid menerima drag-drop berkas (deteksi tipe dari mime/ekstensi) → dialog unggah, klik kartu → Dialog detail: pratinjau besar (img/audio player/ModelViewer fake CulturalItem via fakeItemForAsset), form metadata (name/description/license/attribution → PATCH), info berkas (format, mime, size, storagePath, uploader, tanggal), RELASI PENGGUNAAN (usedBy: judul item + peran) tampil sebelum hapus, Arsipkan/Aktifkan, Hapus (409 → toast.error pesan server). Pagination + skeleton.
  9) sources-view.tsx — tabel global sumber (judul+lisensi, creator, badge tipe berwarna, item terkait link #/budaya/{slug} via map dari api.admin.items.list, URL, tanggal akses, catatan verifikasi) + filter search debounce & tipe + dialog create/edit semua field (item Select opsional pageSize 48) + hapus ConfirmDialog.
  10) contributions-view.tsx — Tabs status (Diajukan/Menunggu Peninjauan/Perlu Revisi/Disetujui/Ditolak/Semua) tersinkron route.query; kartu (judul, submitter nama+email, kategori, wilayah, tanggal, badge contributionStatusColor, refCode mono); detail Dialog (deskripsi, sourceRef, metadata, timeline ModerationReview dengan label map {SUBMIT:'Diajukan',...}, note, reviewer, waktu); aksi per status: Mulai Peninjauan, Minta Revisi (note wajib), Setujui (note opsional + checkbox "Publikasikan langsung sebagai objek budaya" hanya SUPER_ADMIN/EDITOR → publishItemId), Tolak (note wajib); setelah aksi reload + toast + toast.info "Objek budaya draft dibuat" bila dipublikasikan.
  11) users-view.tsx — guard SUPER_ADMIN (EmptyState "Hanya Super Admin"); tabel (avatar inisial, nama + tanda (Anda), email, RoleBadge, badge Aktif/Nonaktif, sejak, aksi); dialog create (name, email, password min 8, role) & edit (name, role, switch active, password opsional "isi untuk reset"); 403 server → toast.
  12) settings-view.tsx — guard SUPER_ADMIN; form api.admin.settings.get(): siteName, tagline, aboutShort, contactEmail, footerNote, contributionNotice dengan deskripsi tiap field; Simpan → PUT; badge "Tersimpan otomatis setelah Simpan" + catatan waktu tersimpan; toast sukses.
- Keamanan peran di UI: tombol kelola konten disembunyikan untuk REVIEWER (canManage = SUPER_ADMIN/EDITOR); users & settings hanya SUPER_ADMIN; moderasi kontribusi terbuka untuk Reviewer; error 403 ditangkap → toast.
- Verifikasi: bunx tsc --noEmit → 0 error pada src/components/admin (1 error ditemukan & diperbaiki: import ItemStatus harus dari constants, bukan types); eslint scoped → file saya bersih (2 error tersisa hanya di admin-shell.tsx milis agent lain, tidak disentuh); curl / → 200, dev.log tanpa error kompilasi admin.

Stage Summary:
- CMS Admin WaraNusa lengkap 12 layar: Dashboard (statistik nyata + aktivitas + aksi cepat), Objek Budaya (list+filter+aksi), Editor objek budaya penuh (identitas, konten, media, hotspot 3D, sumber, atribusi, panel status/publikasi/pratinjau/hapus), Media Manager (grid, unggah drag-drop dengan progress, detail+metadata+relasi usedBy+arsip/hapus), Wilayah, Kategori, Sumber & Atribusi, Moderasi Kontribusi (tab status, timeline review, approve/revisi/tolak + opsi publish otomatis), Pengguna & Pengaturan (super admin only).
- Semua data lewat api.* (api-client) tanpa fetch manual; ConfirmDialog untuk semua aksi destruktif/penting; skeleton/EmptyState/ErrorState+retry di semua view; toast sonner untuk hasil aksi; TS strict tanpa any; format tanggal id-ID; tabel responsive overflow-x-auto; query filter tersimpan di URL hash (?q=&status=&category=&page=).
- media-picker.tsx menjadi fondasi bersama (MediaPicker, MediaPickerButton, UploadInline, MiniPager, helper format) dan siap dipakai ulang; kontrak endpoint dipatuhi persis (termasuk media.usedBy, stats, activity, hotspots nested).

---
Task ID: 2-a
Agent: full-stack-developer
Task: Backend REST API (RETRY — percobaan pertama gagal karena deadline jaringan; seluruh file ternyata sudah tertulis, kali ini diaudit, diperbaiki, diverifikasi, dan dicatat)

Work Log:
- Baca worklog 0-1/2-b/2-c + seluruh kontrak sumber kebenaran: src/lib/types.ts, api-client.ts (URL/method/payload), api-response.ts (ok/created/fail/unauthorized/forbidden/notFound/handleApiError/paginateMeta), auth.ts (getCurrentUser/requireRole/createSession/hash/verify, ALL_STAFF/WRITE_ROLES/CMS_ROLES), rate-limit.ts (rateLimit/clientIp), storage.ts (validateUpload magic bytes/saveUploadFile/deleteUploadFile/readUploadFile/mimeFromPath/mediaUrl), constants.ts (role/status/enum string SQLite, MAX_UPLOAD_BYTES, SESSION_COOKIE).
- AUDIT hasil percobaan pertama: seluruh 35 route handler src/app/api/**, 14 controller, 8 validator zod, serializers.ts, 5 service (audit/slug/item-query/media-usage/http) ditemukan LENGKAP — kegagalan percobaan pertama hanya terjadi sebelum worklog ditulis. Verifikasi menyeluruh lalu dilanjutkan.
- Perbaikan 1 — GET /api/cultural-items/[id]: increment viewCount diubah dari fire-and-forget menjadi await dibungkus try/catch sesuai brief (kegagalan counter tidak menggagalkan respons).
- Perbaikan 2 — PATCH /api/admin/cultural-items/[id]: audit menjadi tepat satu aksi per permintaan — status berubah ke PUBLISHED → hanya "item.publish"; ARCHIVED → hanya "item.archive"; selain itu "item.update".
- Perbaikan 3 — PATCH /api/admin/users/[id]: tambah guard penonaktifan diri sendiri (input.active===false && id===user.id → 409) di samping proteksi SUPER_ADMIN aktif terakhir yang sudah ada.
- Perbaikan 4 — POST /api/admin/media: create dengan include { uploader: true } agar serializeMediaAsset respons 201 memuat uploader {id,name}.
- Verifikasi tipe: bunx tsc --noEmit → 0 error pada scope src/server/** + src/app/api/** (sisa error berasal dari file agent lain, di luar scope).
- Smoke test end-to-end via curl terhadap dev server berjalan (port 3000):
  * Publik: GET /regions (itemCount PUBLISHED), /categories (sortOrder+itemCount), /cultural-items (paginated meta {page,pageSize,total,totalPages}), detail by slug, /media (dedupe+usageCount), /sources (filter type), /settings (whitelist 6 key) — semua 200.
  * Auth: login salah → 401 "Email atau kata sandi salah."; login admin@waranusa.id → 200 + cookie waranusa_session httpOnly; /auth/me → user; /auth/logout tersedia.
  * Rate limit login: 5× 401 lalu 429 "Terlalu banyak percobaan. Coba lagi dalam X detik."; kontribusi publik & track juga ter-limiter.
  * Kontribusi: POST publik → 201 refCode WN-XXXXXX; track refCode+email cocok → 200, email salah → 404; body JSON rusak → 400; pelanggaran zod → 422 + fields per-field.
  * Moderasi: SUBMITTED→IN_REVIEW(START_REVIEW)→NEEDS_REVISION(REQUEST_REVISION)→SUBMITTED(SUBMIT)→APPROVED(APPROVE); ModerationReview tercatat, reviewedById terisi; APPROVED membuat CulturalItem DRAFT (slug unik dari judul, summary=slice(0,200), fallback kategori/wilayah) dan createdItemId terisi; transisi ilegal ditolak 409.
  * Admin items: POST (hotspot inline ikut dibuat) → 201; PATCH status → PUBLISHED + audit "item.publish"; hotspot nested POST/PATCH/DELETE → 201/200; item muncul di endpoint publik setelah publish; DELETE → {ok:true}, akses lanjutan → 404.
  * Regions: duplikat kode → 409 "Kode wilayah sudah digunakan."; create+delete oke; zod 422 untuk payload invalid.
  * Media: upload multipart PNG (magic bytes lolos) → 201 dgn storagePath media/YYYY/MM/…, GET berkas → 200 image/png + Cache-Control immutable; PATCH metadata/status → 200; DELETE → hapus berkas fisik + row; akses berkas setelah delete → 404; path traversal → 404 (ditolak router + guard "..").
  * Guard role: anonim → 401; EDITOR ke /admin/users → 403; EDITOR ke /admin/media → 200 (ALL_STAFF); /api/my/contributions anonim → 401, CONTRIBUTOR login → daftar (empty) 200.
  * Settings: PUT admin (SUPER_ADMIN) → upsert; GET /api/settings publik langsung merefleksikan perubahan.
  * Login demo seed: admin@waranusa.id/Admin#2025, editor@waranusa.id/Editor#2025, kontributor@waranusa.id/Kontrib#2025 (kontributor untuk uji /my/contributions).
- Bersih-bersih data uji: item uji dihapus via endpoint DELETE (uji sekaligus), kontribusi & review uji (WN-GBUW35) + 5 log audit uji dihapus langsung dari DB agar seed demo tetap bersih (contributionsPending kembali ke 1 milik seed).
- dev.log: tidak ada error kompilasi; satu-satunya entri "Error" adalah Next.js menolak percobaan path traversal uji kami (perilaku aman, bukan bug).

Stage Summary:
- Backend REST API WaraNusa LENGKAP: 35 route handler mendelegasikan ke 14 controller (auth, public, contribution, media-file, admin/items, admin/hotspots, admin/media, admin/regions, admin/categories, admin/sources, admin/contributions, admin/stats, admin/users, admin/settings) — 50 endpoint kontrak api-client.ts terpenuhi persis (URL, method, payload, bentuk respons {data,meta}/{error:{message,fields}}).
- Arsitektur gaya Laravel: validators zod v4 per domain (auth/item/contribution/region/category/media/source/user), services (audit logActivity, slug slugify+uniqueSlug, item-query buildItemWhere+orderBy, media-usage usageCount/usedBy, http guard+readJson+parsePagination), serializers.ts (serializeUser/Region/Category/Source/Hotspot/MediaAsset/Item/Contribution/Activity + include siap pakai).
- Keamanan & ketahanan: cookie httpOnly sameSite lax 7 hari, rate limit (login 5/menit ip+email, kontribusi 5/jam, track 30/menit), guard role 401/403 di semua endpoint admin, konflik 409 (kode wilayah/kategori/media dipakai/transisi moderasi/user terakhir), zod 422 dengan fields, handleApiError 500 tanpa bocor internal, validasi upload magic bytes + batas ukuran, penyajian berkas hanya di bawah media/ + anti-traversal, Cache-Control immutable, audit trail untuk semua aksi staff.
- Verifikasi: tsc 0 error pada scope API; 20+ skenario curl (publik/auth/moderasi/CRUD/media/guard/rate-limit) hijau; data uji dibersihkan; dev.log sehat.
- Daftar file (ditulis percobaan pertama, diaudit & disempurnakan percobaan ini): src/app/api/** (35 route.ts) + src/server/controllers/{auth,public,contribution,media-file}.controller.ts, src/server/controllers/admin/{items,hotspots,media,regions,categories,sources,contributions,stats,users,settings}.controller.ts, src/server/validators/{auth,item,contribution,region,category,media,source,user}.ts, src/server/serializers.ts, src/server/services/{audit,slug,item-query,media-usage,http}.ts.

---
Task ID: 2-c
Agent: full-stack-developer
Task: CMS Admin (RETRY — percobaan pertama gagal karena deadline jaringan; file tertulis sebagian, verifikasi & penyempurnaan dilakukan ulang)

Work Log:
- Baca worklog.md (0-1, 2-b, 2-d, entri 2-c lama) lalu kontrak sumber kebenaran: src/lib/types.ts, api-client.ts (api.admin.* & ApiError.status/.fields & contributionStatusColor), constants.ts (ROLES/ITEM_STATUSES/MEDIA_TYPES/MAX_UPLOAD_BYTES/PROCEDURAL_MODELS/label*), router.ts (navigate/buildQuery), hooks/use-async-data.ts, auth-store.ts (hasRole), admin-shell.tsx (props {route,children}, sidebar, breadcrumb), shared (states, status-badge, confirm-dialog), page.tsx (AdminApp default-import), palet brand di globals.css.
- Kondisi temuan saat retry: 13 file src/components/admin/ ternyata sudah tertulis dari percobaan pertama namun tidak pernah terverifikasi (jaringan putus). Audit baris-per-baris ke-12 file kontrak vs spesifikasi, lalu perbaiki 5 penyimpangan:
  1) dashboard-view.tsx — pemetaan ikon aktivitas dibuat sesuai kontrak (item.create→PlusCircle, item.publish→Upload, media.upload→ImagePlus, contribution.approve→CheckCircle2, auth.login→LogIn, default→Activity; tambahan delete/archive/update); kartu statistik "Kontribusi" kini klikabel (role button + keyboard Enter/Space + fokus ring) menuju #/admin/contributions dengan sub-label "klik untuk meninjau"; import cn.
  2) item-editor.tsx — bagian D Hotspot 3D kini tampil bila modelMedia terpilih ATAU slug item prosedural (rumah-gadang/joglo/gamelan-jawa/saron/generic) sekalipun tanpa aset model (isProcedural tak lagi tergantung form.model); chip navigasi anchor mengikuti visibilitas bagian; hint koordinat "x:[-1..1] y:[0..2] z:[-1..1]" tetap.
  3) regions-view.tsx — validasi kode wilayah diganti ke regex kontrak ^[A-Z]{2}-[A-Z0-9]{1,3}$ (sebelumnya terlalu ketat ^ID-[A-Z]{2}$), maxLength 6.
  4) contributions-view.tsx — tombol "Minta Revisi" kini tersedia untuk status IN_REVIEW dan NEEDS_REVISION (sesuai spesifikasi, sebelumnya hanya IN_REVIEW).
  5) media-picker.tsx + media-view.tsx — dialog "Unggah Media" Media Manager dilengkapi sesuai kontrak: Select tipe (Deteksi otomatis/5 tipe), field Nama/Lisensi/Atribusi/Deskripsi; UploadInline menerima prop metadata baru (nama custom hanya diterapkan untuk unggahan tunggal) dan mengirimnya ke api.admin.media.upload; reset form tiap buka dialog; tombol Unggah & drop-area memakai openUploadDialog().
- Audit lengkap mengonfirmasi 12 layar sudah sesuai kontrak: admin-app (switch segments, default export, AdminShell wrapper, 404 CMS), dashboard (6 kartu stats nyata + aktivitas 8 entri + aksi cepat), items-view (filter URL ?q/status/category/page + debounce, tabel responsif, dropdown aksi publish/archive/delete terkonfirmasi), item-editor (A-G: identitas/slug auto, konten+counter 500, media via MediaPickerButton single&multi, hotspot CRUD via api.admin.hotspots.*, sumber repeatable tersinkron payload, atribusi, panel sticky: Simpan Perubahan/Draft/Publikasikan/Arsipkan ConfirmDialog/Pratinjau publik window.open atau Dialog ModelViewer draft/Hapus; ApiError.fields inline + toast; beforeunload dirty-guard; create→navigate edit replace), media-picker (MediaPicker grid 24/hal radio/checkbox + unggah inline + auto-select; MediaPickerButton preview+Ganti/Hapus+Lihat 3D; UploadInline XHR progress + validasi MAX_UPLOAD_BYTES; helper humanSize/fmtDateID/slugify/fakeItemForAsset/MiniPager/MediaPreview/AudioPlayButton), media-view (grid 18/hal, filter tipe/status/search, drag-drop area, detail: preview besar/audio/ModelViewer, PATCH metadata, info berkas + storagePath mono, RELASI usedBy wajib tampil sebelum hapus, arsip/aktif, hapus 409→toast), sources-view (tabel + badge tipe berwarna + link item publik + dialog lengkap + Select item 48), contributions-view (6 tab sinkron ?status, kartu, detail: deskripsi/sourceRef/timeline reviews berlabel, aksi Mulai Peninjauan/Revisi(note*)/Setujui(note opsional + checkbox publish hanya SUPER_ADMIN-EDITOR)/Tolak(note*)), users-view (guard SUPER_ADMIN, avatar inisial, RoleBadge, dialog create pass min 8 & edit + reset password opsional + Switch aktif), settings-view (guard SUPER_ADMIN, 6 field berdeskripsi, PUT + toast + catatan waktu tersimpan).
- Verifikasi: bunx tsc --noEmit → 0 error di seluruh src/components/admin (13 file); eslint scoped src/components/admin → hanya 2 error pada admin-shell.tsx milik agent lain (react-hooks/static-components NavList) — tidak disentuh sesuai batasan; sisa error tsc proyek berada di luar scope saya: page.tsx:83 mem-pass route ke ArchiveView() milik 2-b yang tak menerima props (integrasi antar rekan), dan api-client.ts:56-57 strictness (file kontrak, dilarang disentuh); dev.log menunjukkan seluruh endpoint admin yang dipakai UI hidup (stats/items/hotspots/regions/categories/media/settings/users 403 non-super) tanpa error kompilasi file admin; percobaan path-traversal /api/media/file/../db/custom.db ditolak server 404 (milik backend rekan).

Stage Summary:
- CMS Admin WaraNusa 12 layar selesai & terverifikasi pasca-retry: Dashboard (statistik nyata + aktivitas + aksi cepat + kartu kontribusi klikabel), Objek Budaya (list/filter URL/pagination/aksi), Editor Objek Budaya A–G (identitas, konten, media picker, hotspot 3D untuk model aset & prosedural, sumber, atribusi, panel status/aksi sticky), Media Manager (grid, unggah tipe+metadata dengan progress, detail+usedBy+arsip/hapus), Wilayah, Kategori, Sumber & Atribusi, Moderasi Kontribusi (timeline + approve/revisi/tolak + opsi publikasi draft), Pengguna & Pengaturan (SUPER_ADMIN only).
- Semua data eksklusif via api.*; ConfirmDialog untuk aksi destruktif/penting; toast sonner untuk semua hasil; Loading/Skeleton + EmptyState + ErrorState+retry di semua view; TS strict tanpa any; tanggal id-ID & ukuran human-readable; tabel overflow-x-auto; label htmlFor + aria; query filter tersimpan di URL hash.
- File milik task ini (src/components/admin/): admin-app.tsx, dashboard-view.tsx, items-view.tsx, item-editor.tsx, media-picker.tsx, regions-view.tsx, categories-view.tsx, media-view.tsx, sources-view.tsx, contributions-view.tsx, users-view.tsx, settings-view.tsx — tidak ada file lain yang diubah.

---
Task ID: 3
Agent: main (Z.ai Code)
Task: Integrasi, perbaikan lint/tipe, verifikasi E2E browser, dokumentasi

Work Log:
- Integrasi 4 agent (2-a backend, 2-b publik, 2-c CMS, 2-d 3D/peta): perbaiki prop ArchiveView di page.tsx, narrowing error api-client, exclude examples/skills/scripts dari tsc
- Perbaikan lint (0 error final): setState-in-effect (my-contributions, catalog, culture-detail) via setTimeout-defer pattern; NavList admin-shell diubah ke JSX element; useCallback router; hapus disable directive tak terpakai
- Bug peta: tile CARTO menuntut API key -> diganti OpenStreetMap standar (terverifikasi render)
- Bug React 19 + drei <Html> ("synchronously unmount a root"): buat SpriteLabel berbasis CanvasTexture di procedural-models, ganti semua <Html> di model-viewer & saron-instrument
- Bug Radix: SelectItem value="" di media-view diganti sentinel "ALL"
- Kontras logo panel login diperbaiki (mono putih)
- Generate 9 gambar seed via SDK script (foreground; 1440x720 ditolak API -> 1440x704 kelipatan 32)
- Re-seed DB agar ukuran media akurat & data demo bersih
- Verifikasi E2E Agent Browser: landing, peta+klik wilayah, katalog(7 objek, draft tersaring), detail(rumah-gadang: 3D+3 hotspot, tab sumber, fallback audio), instrumen saron (Demo Melodi tanpa error), login 4 role, dashboard CMS data nyata, editor objek (PATCH tersimpan), Media Manager (upload PNG valid -> serve 200 image/png), moderasi (SUBMITTED->IN_REVIEW->APPROVED+publish -> objek budaya otomatis terbit), kontribusi publik (refCode WN-7MTG02) + lacak status, users & regions & arsip
- Keamanan via curl: draft publik 404; admin anonim 401; reviewer PATCH 403; path traversal 404
- Footer sticky terverifikasi (footerBottom==vh saat halaman pendek; terdorong alami saat panjang); responsif 390px & 1280px
- Dokumentasi: README.md lengkap (arsitektur, keputusan stack, akun demo, endpoint, skema, pengelolaan aset, keamanan, pengujian aktual, keterbatasan, rencana deployment) + .env.example

Stage Summary:
- WaraNusa MVP LENGKAP dan terverifikasi: situs publik + CMS + REST API + DB + upload 3D/media + moderasi, 0 error tsc/lint, dev server sehat
- Semua kriteria selesai bagian 20 terpenuhi kecuali yang dinyatakan jujur sebagai keterbatasan di README bag.13 (model 3D seed prosedural, audio sintetis, gambar AI, uji otomatis formal, deployment)
- Aplikasi BELUM dideploy ke URL publik (sesuai kejujuran bag.19)

---
Task ID: hotfix-1
Agent: main (Z.ai Code)
Task: Perbaikan bug "navbar tidak berfungsi" (laporan user)

Work Log:
- Reproduksi via Agent Browser: klik link nav mengubah URL hash (#/jelajah) TAPI tampilan tetap landing — router SPA mati
- Root cause: next/link mencegat klik <Link href="#/…"> dan berpindah via history.pushState; pushState TIDAK memicu event "hashchange", sehingga useRoute() tidak pernah memperbarui view
- Fix 1: komponen baru src/components/shared/hash-link.tsx (HashLink) — <a> native untuk rute hash, memicu hashchange asli; menangani klik-ulang hash sama (dispatch manual + scroll to top); kompatibel Radix Slot (Button asChild)
- Fix 2: src/lib/router.ts useRoute() kini juga listen "popstate" (back/forward browser & patch pushState Next.js)
- Fix 3: ganti import Link next/link → HashLink (alias Link) di 5 file: brand-logo, site-header, site-footer, landing-view, login-view
- Audit 13 error console lama: seluruhnya stale HMR (BrandMark/BrandLogo sudah terimport benar di login-view, SelectItem value="" tidak ditemukan di kode; konstanta ROLES/MEDIA_TYPES/SOURCE_TYPES bersih)
- Dev server sempat mati saat verifikasi → restart (bun run dev background, port 3000)
- Verifikasi Agent Browser (sesi fresh): klik semua link nav (Jelajahi/Katalog/Instrumen/Arsip/Kontribusi/Masuk) ✓, logo → beranda ✓, back browser ✓, re-click hash sama ✓, kartu katalog → #/budaya/tari-kecak ✓, menu mobile sheet navigasi + auto-close ✓, 0 console error ✓, lint bersih ✓

Stage Summary:
- Penyebab navbar mati: next/link + pushState tidak memicu hashchange (bukan crash React)
- Semua link hash SPA kini wajib memakai HashLink dari @/components/shared/hash-link — JANGAN next/link untuk href="#/…"
- useRoute kini mendengar hashchange + popstate
- Navigasi publik terverifikasi end-to-end tanpa error console

---
Task ID: feat-sketchfab-embed
Agent: main (Z.ai Code)
Task: Integrasi model 3D Sketchfab "Joglo House" (ilhamsbi) — dukungan embed eksternal end-to-end

Work Log:
- User memberikan embed Sketchfab Joglo House (model 4816e9b904af4f64ad819609c42497b8 oleh ilhamsbi)
- Schema: MediaAsset +embedUrl (String?), storagePath kini nullable (aset embed tanpa berkas lokal); db:push OK
- Util baru src/lib/media-embed.ts: normalizeSketchfabEmbed (allowlist https sketchfab.com, ID 32-hex, terima URL halaman maupun embed, normalisasi ke /models/<id>/embed), isEmbedModel, sketchfabPageUrl
- API: POST /api/admin/media/embed (controller createEmbedMedia, WRITE_ROLES); PATCH media mendukung embedUrl (hanya MODEL_3D, dinormalisasi); DELETE null-safe (tanpa hapus berkas); serializer media menambah embedUrl & url = embedUrl untuk aset embed
- Validasi server: schema zod murni, normalisasi+allowlist di controller agar error fields bersih ("embedUrl", bukan "embedUrl.embedUrl" — zod 4 menggabungkan path transform)
- Frontend: ModelViewer mode embed — iframe Sketchfab lazy-mount (IntersectionObserver), chip hotspot di bawah viewer (panel detail tetap berfungsi), strip atribusi + tautan "Lihat di Sketchfab"; hint detail adaptif
- Admin: tombol + dialog "Embed Sketchfab" di Media Manager (nama/URL/atribusi/lisensi/deskripsi); MediaPreview embed = badge (tanpa iframe di grid); Info Berkas menampilkan URL Embed & lokasi "embed eksternal"
- Seed: prisma/seed.ts menambah aset embed + modelMediaId joglo + sumber "Sketchfab — Joglo House"; script one-off scripts/attach-joglo-embed.ts untuk DB berjalan (idempoten) — SUKSES
- Catatan operasional: setelah db:push/generate, dev server WAJIB restart (P2032 storagePath null di client lama)
- Verifikasi: API joglo mengembalikan embedUrl+atribusi+sumber; browser #/budaya/joglo → iframe Sketchfab render model asli, chip Saka Guru/Tumpang Sari → panel deskripsi OK, atribusi strip OK; regresi rumah-gadang (procedural), landing, katalog OK; admin media manager detail embed OK (iframe+URL Embed+relasi); validasi URL invalid → 422 fields.embedUrl; URL halaman → dinormalisasi; console errors 0; lint bersih

Stage Summary:
- Dukungan model 3D eksternal (Sketchfab) kini fitur CMS lengkap: daftar via UI admin, validasi allowlist server, atribusi wajib tampil, tanpa fabricasi lisensi (kosong = rujuk halaman model)
- MediaAsset.storagePath kini nullable — semua konsumsi wajib cek embedUrl/url via serializer
- Joglo menampilkan model 3D komunitas asli oleh ilhamsbi dengan atribusi sesuai embed yang diberikan user

---
Task ID: feat-joglo-glb-asset
Agent: main (Z.ai Code)
Task: Membuat asset 3D rumah Joglo (GLB mandiri, terinspirasi model Sketchfab "Joglo House") untuk ditambahkan user secara manual lewat CMS

Work Log:
- Permintaan user: asset 3D joglo berbentuk BERKAS (bukan embed) yang bisa dia pasang sendiri via CMS
- Script baru scripts/generate-joglo-glb.ts: model joglo prosedural three.js (undakan batu 2 tingkat, lantai papan, tangga undakan 4 anak + dada tangga, 4 saka guru + umpak batu, 16 soko keliling, balok banten, atap limasan bawah + tumpang sari 3 tingkat bersisik lisung gelap, wuwungan + tutup ujung) — 6 mesh bernama, 6 material PBR (stone/floor/wood/woodSaka/woodDark/roof), glTF 2.0 binary via GLTFExporter
- FileReader shim untuk bun (GLTFExporter butuh FileReader; bun tidak menyediakannya) — readAsArrayBuffer/readAsDataURL via microtask
- Output: public/downloads/joglo-house.glb (64 KB, magic bytes "glTF" tervalidasi, header GLB dicek: version 2, 6 primitives, 24 accessors, bin chunk 58800 B) + uploads/media/2026/10/joglo-house-8cc99716304b.glb via saveUploadFile (konvensi storage CMS sama persis)
- MediaAsset terdaftar (id cmvdmvtu30001q3i42uqgattb, name "Rumah Joglo — GLB prosedural", MODEL_3D/glb/model-gltf-binary, atribusi jujur "model prosedural WaraNusa — inspirasi siluet 'Joglo House' oleh ilhamsbi (Sketchfab)") — TIDAK dipasangkan ke item (user yang memasang manual); idempoten bila dijalankan ulang
- Verifikasi E2E Agent Browser: modelMediaId joglo dipasang sementara ke GLB → #/budaya/joglo → model 3D RENDERS (atap bertingkat, kolom, undakan batu terlihat), GLB diambil GET /api/media/file/media/2026/10/...glb 200, hotspot 1 (Saka Guru) diklik → panel deskripsi muncul, 0 error console; modelMediaId dikembalikan ke embed Sketchfab (cmvdjef9g0001q3mcsz9xi3kb)
- Verifikasi CMS: login admin → Media Manager → kartu aset muncul → dialog detail menampilkan preview 3D live + Info Berkas (GLB, model/gltf-binary) ✓
- Bonus fix a11y (ditemukan saat verifikasi): dialog detail Media Manager merender skeleton tanpa DialogTitle saat loading → Radix warning; ditambah DialogHeader sr-only (DialogTitle+DialogDescription) di state loading (src/components/admin/media-view.tsx) — warning hilang, diverifikasi ulang via browser (0 kecocokan)
- bun run lint bersih; dev.log sehat
- Saran koordinat hotspot utk model GLB (ruang ternormalisasi viewer): Saka Guru 0.42/0.45/0.36 · Tumpang Sari 0.35/1.20/0.28 · Pendopo 0.00/0.25/0.75 · Wuwungan 0.00/1.67/0.00

Stage Summary:
- Asset 3D GLB joglo valid & tersedia 2 jalur: Media Library CMS (siap dipilih) + unduhan statis /downloads/joglo-house.glb (untuk upload manual dari mesin user)
- Viewer GLB existing terbukti kompatibel end-to-end tanpa perubahan kode (normalisasi otomatis + fallback tetap berfungsi)
- Regenerasi model kapan pun: bun scripts/generate-joglo-glb.ts (idempoten)
- Item joglo tetap memakai embed Sketchfab ilhamsbi sampai user memasangkan GLB secara manual

---
Task ID: hotfix-2
Agent: main (Z.ai Code)
Task: Perbaikan "Autentikasi diperlukan" — login CMS sukses tapi semua API admin 401 (laporan user, screenshot dashboard rusak)

Work Log:
- Diagnosis dari dev.log: POST /api/auth/login 200 → tepat setelahnya GET /api/admin/* 401 (2 siklus login + logout oleh user) — cookie sesi TIDAK disimpan browser user, store klien tetap set user dari respons login (header tampil "Admin WaraNusa") → CMS tampak rusak
- Akar masalah: preview berjalan di iframe lintas-origin (konteks pihak ketiga); cookie lama SameSite=Lax tanpa Partitioned diblokir; sesi DB & TTL normal (dicek: 10 sesi, expiresAt 2026-10-25, tidak kedaluwarsa)
- Fix 1 (src/server/controllers/auth.controller.ts): cookie sesi kini `SameSite=None; Secure; Partitioned` (CHIPS) pada login & logout — terverifikasi via curl: Set-Cookie memuat keempat atribut
- Fix 2 (src/lib/api-client.ts): hook setUnauthorizedHandler — setiap 401 di luar /auth/* memicu handler global
- Fix 3 (src/lib/auth-store.ts): (a) login() kini memverifikasi cookie via me() setelah POST; bila cookie diblokir konteks → throw ApiError 401 dengan pesan actionable "Open in New Tab" (login-view menampilkannya di Alert + toast, user tidak masuk ke CMS rusak); (b) watcher 401 global (debounce 3 dtk) → user=null + toast "Sesi berakhir" + navigate /masuk replace
- Fix 4 (src/components/admin/admin-shell.tsx): guard kini bergantung [route.path, initialized] — menutup race init() sehingga membuka #/admin/* tanpa sesi dialihkan bersih ke /masuk (bukan dashboard error storm)
- README bag. keamanan diperbarui (atribut cookie + perilaku fallback)
- Verifikasi Agent Browser (3 skenario): (1) buka #/admin/dashboard tanpa login → redirect /masuk ✓; (2) login admin → dashboard penuh data, stats/activity 200, cookie CHIPS bekerja di localhost ✓; (3) sesi admin dihapus via DB di tengah sesi → klik Media Manager → 401 → auto-kick ke /masuk + toast "Sesi berakhir — silakan masuk kembali." ✓; console errors 0; lint bersih ✓

Stage Summary:
- Login CMS kini tangguh di konteks pratinjau: cookie CHIPS memungkinkan sesi tersimpan di iframe pihak ketiga (Chrome/Firefox); bila konteks menolak total (mis. Safari ketat/iframe sandboxed), user melihat pesan jelas + solusi "Open in New Tab", bukan dashboard penuh 401
- Ketiganya defensif: guard init-race, watcher 401 mid-session, deteksi cookie diblokir saat login
- Instruksi user: gunakan tombol "Open in New Tab" di panel preview lalu login di tab tersebut — konteks first-party selalu menerima cookie
