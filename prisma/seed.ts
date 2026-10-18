/**
 * WaraNusa — Database Seeder
 * Data demonstrasi: 4 wilayah, 6 kategori, 9 objek budaya dengan sumber nyata
 * (Wikipedia/UNESCO), media seed hasil generator gambar, akun demo, dan
 * contoh alur kontribusi -> moderasi.
 *
 * Jalankan: bun run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const db = new PrismaClient();

const SEED_DIR = path.join(process.cwd(), "public/uploads/seed");
const today = new Date().toISOString().slice(0, 10);

function seedFileSize(file: string): number {
  try {
    return fs.statSync(path.join(SEED_DIR, file)).size;
  } catch {
    return 0;
  }
}

async function main() {
  console.log("🌱 Seeding WaraNusa database...");

  // ============ CLEANUP (urut FK) ============
  await db.moderationReview.deleteMany();
  await db.contribution.deleteMany();
  await db.activityLog.deleteMany();
  await db.setting.deleteMany();
  await db.session.deleteMany();
  await db.modelHotspot.deleteMany();
  await db.culturalSource.deleteMany();
  await db.culturalItemMedia.deleteMany();
  await db.culturalItem.deleteMany();
  await db.mediaAsset.deleteMany();
  await db.category.deleteMany();
  await db.region.deleteMany();
  await db.user.deleteMany();

  // ============ USERS ============
  const pass = (p: string) => bcrypt.hashSync(p, 10);
  const admin = await db.user.create({
    data: { name: "Admin WaraNusa", email: "admin@waranusa.id", passwordHash: pass("Admin#2025"), role: "SUPER_ADMIN" },
  });
  const editor = await db.user.create({
    data: { name: "Sari Wulandari", email: "editor@waranusa.id", passwordHash: pass("Editor#2025"), role: "EDITOR" },
  });
  const reviewer = await db.user.create({
    data: { name: "Bayu Setiawan", email: "reviewer@waranusa.id", passwordHash: pass("Reviewer#2025"), role: "REVIEWER" },
  });
  await db.user.create({
    data: { name: "Dewi Lestari", email: "kontributor@waranusa.id", passwordHash: pass("Kontrib#2025"), role: "CONTRIBUTOR" },
  });

  // ============ SETTINGS ============
  const settings: Record<string, string> = {
    siteName: "WaraNusa",
    tagline: "Platform Eksplorasi & Pelestarian Budaya Indonesia",
    aboutShort:
      "WaraNusa adalah platform digital untuk menjelajahi, mempelajari, dan melestarikan warisan budaya Indonesia melalui peta interaktif, katalog budaya bersumber, model 3D, dan instrumen musik virtual.",
    contactEmail: "kontak@waranusa.id",
    footerNote: "Dibangun untuk pelestarian budaya Indonesia. Konten menampilkan sumber dan atribusi secara terbuka.",
    contributionNotice:
      "Kontribusi Anda akan ditinjau oleh kurator sebelum dipublikasikan. Sertakan sumber referensi agar lebih mudah diverifikasi.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.create({ data: { key, value } });
  }

  // ============ REGIONS ============
  const sumbar = await db.region.create({
    data: {
      code: "ID-SB", name: "Sumatera Barat", islandGroup: "SUMATERA", capital: "Padang",
      lat: -0.9471, lng: 100.4172,
      summary: "Tanah Minangkabau dengan sistem matrilineal, rumah gadang beratap gonjong, dan tradisi rantau.",
      description:
        "Sumatera Barat adalah provinsi di pantai barat Sumatera yang menjadi pusat budaya Minangkabau. Masyarakatnya menganut sistem kekerabatan matrilineal, dengan rumah gadang sebagai pusat hidup komunal dan merantau sebagai tradisi pencarian ilmu dan rezeki.",
    },
  });
  const diy = await db.region.create({
    data: {
      code: "ID-YO", name: "Daerah Istimewa Yogyakarta", islandGroup: "JAWA", capital: "Yogyakarta",
      lat: -7.7956, lng: 110.3695,
      summary: "Daerah kesultanan dengan istana keraton, batik klasik, gamelan, dan tradisi kejawen yang hidup.",
      description:
        "DI Yogyakarta dipimpin Sultan Hamengku Buwono dan dikenal sebagai pusat kebudayaan Jawa. Keraton Yogyakarta, batik pedalaman, gamelan, wayang, serta tata nilai hidup kejawen masih dijalankan dalam keseharian masyarakat.",
    },
  });
  const jabar = await db.region.create({
    data: {
      code: "ID-JB", name: "Jawa Barat", islandGroup: "JAWA", capital: "Bandung",
      lat: -6.9147, lng: 107.6098,
      summary: "Tanah Sunda dengan angklung, jaipong, dan kerajinan bambu Priangan.",
      description:
        "Jawa Barat adalah rumah bagi budaya Sunda. Angklung yang lahir dari masyarakat Priangan kini diakui UNESCO sebagai warisan budaya takbenda, di samping tradisi wayang golek, jaipongan, dan tekstil tenun.",
    },
  });
  const bali = await db.region.create({
    data: {
      code: "ID-BA", name: "Bali", islandGroup: "BALI_NUSA_TENGGARA", capital: "Denpasar",
      lat: -8.6705, lng: 115.2126,
      summary: "Pulau Dewa dengan seni pertunjukan, pura, ukiran, dan tarian yang bersifat sakral.",
      description:
        "Bali memadukan agama Hindu dengan seni dan adat Bali. Tari kecak, legong, barong, hingga upacara di pura menjadikan seni bagian tak terpisahkan dari kehidupan spiritual masyarakatnya.",
    },
  });

  // ============ CATEGORIES ============
  const cat = async (slug: string, name: string, description: string, icon: string, sortOrder: number) =>
    db.category.create({ data: { slug, name, description, icon, sortOrder } });

  const cRumah = await cat("rumah-adat", "Rumah Adat & Arsitektur", "Arsitektur tradisional nusantara dari rumah gadang hingga joglo.", "landmark", 1);
  const cTekstil = await cat("tekstil", "Pakaian Adat & Tekstil", "Batik, tenun, songket, dan pakaian adat daerah.", "shirt", 2);
  const cMusik = await cat("alat-musik", "Alat Musik Tradisional", "Gamelan, angklung, kolintang, dan alat musik daerah lainnya.", "music", 3);
  const cTari = await cat("tarian", "Tarian & Seni Pertunjukan", "Tari tradisional, wayang, dan seni pertunjukan daerah.", "drama", 4);
  const cKuliner = await cat("kuliner", "Makanan Khas", "Kuliner nusantara dan cerita di baliknya.", "utensils-crossed", 5);
  const cTradisi = await cat("tradisi", "Tradisi & Pengetahuan Lokal", "Upacara, kearifan lokal, dan pengetahuan turun-temurun.", "book-open", 6);

  // ============ MEDIA (gambar seed dari generator) ============
  const media = async (file: string, name: string, type: "IMAGE", attribution: string, description: string) => {
    const size = seedFileSize(file);
    return db.mediaAsset.create({
      data: {
        name, description, type, format: file.split(".").pop() ?? "png", mimeType: "image/png",
        size, storagePath: `seed/${file}`, license: "Dibuat dengan generator gambar AI untuk demo WaraNusa (bukan foto arsip asli)",
        attribution, status: "ACTIVE", uploaderId: editor.id,
      },
    });
  };

  const mGadang = await media("rumah-gadang.png", "Rumah Gadang — ilustrasi", "IMAGE", "Ilustrasi AI untuk demo WaraNusa", "Ilustrasi rumah gadang Minangkabau dengan atap gonjong.");
  const mJoglo = await media("joglo.png", "Joglo — ilustrasi", "IMAGE", "Ilustrasi AI untuk demo WaraNusa", "Ilustrasi joglo Jawa dengan saka guru dan tumpang sari.");
  const mBatik = await media("batik.png", "Batik Yogyakarta — ilustrasi", "IMAGE", "Ilustrasi AI untuk demo WaraNusa", "Ilustrasi kain batik tulis motif parang dan kawung.");
  const mSongket = await media("songket.png", "Songket Pandai Sikek — ilustrasi", "IMAGE", "Ilustrasi AI untuk demo WaraNusa", "Ilustrasi tenunan songket benang emas Minangkabau.");
  const mGamelan = await media("gamelan.png", "Gamelan Saron — ilustrasi", "IMAGE", "Ilustrasi AI untuk demo WaraNusa", "Ilustrasi saron gamelan Jawa dari perunggu.");
  const mAngklung = await media("angklung.png", "Angklung — ilustrasi", "IMAGE", "Ilustrasi AI untuk demo WaraNusa", "Ilustrasi rangkaian angklung bambu Sunda.");
  const mKecak = await media("kecak.png", "Tari Kecak — ilustrasi", "IMAGE", "Ilustrasi AI untuk demo WaraNusa", "Ilustrasi pementasan kecak di tebing Uluwatu.");
  const mPiring = await media("tari-piring.png", "Tari Piring — ilustrasi", "IMAGE", "Ilustrasi AI untuk demo WaraNusa", "Ilustrasi tari piring Minangkabau.");

  // Model 3D embed Sketchfab untuk Joglo (model komunitas — atribusi ditampilkan apa adanya)
  const mJoglo3d = await db.mediaAsset.create({
    data: {
      name: "Joglo House — Sketchfab (embed)",
      description: "Model 3D rumah joglo yang ditampilkan melalui embed viewer resmi Sketchfab.",
      type: "MODEL_3D",
      format: "SKETCHFAB",
      mimeType: "text/html",
      size: 0,
      storagePath: null,
      embedUrl: "https://sketchfab.com/models/4816e9b904af4f64ad819609c42497b8/embed",
      license: null,
      attribution: "Joglo House oleh ilhamsbi di Sketchfab",
      status: "ACTIVE",
      uploaderId: editor.id,
    },
  });

  // ============ CULTURAL ITEMS ============
  type ItemSpec = {
    slug: string; title: string; summary: string; description: string; history?: string; meaning?: string;
    featured?: boolean; status?: string; categoryId: string; regionId: string;
    coverId: string; galleryIds?: string[]; modelMediaId?: string; audioMediaId?: string;
    license?: string; attribution?: string;
    sources: { title: string; creator?: string; url?: string; sourceType: string; attribution?: string; license?: string; verificationNote?: string }[];
    hotspots?: { title: string; description: string; x: number; y: number; z: number }[];
  };

  const items: ItemSpec[] = [
    {
      slug: "rumah-gadang", title: "Rumah Gadang", featured: true, status: "PUBLISHED",
      categoryId: cRumah.id, regionId: sumbar.id, coverId: mGadang.id, modelMediaId: undefined,
      summary: "Rumah adat Minangkabau beratap gonjong melengkung seperti tanduk kerbau, pusat kehidupan matrilineal.",
      description:
        "Rumah gadang adalah rumah adat suku Minangkabau yang dibangun di atas tumpukan batu dan kayu tanpa paku, dengan atap ijuk berbentuk gonjong (melengkung runcing seperti tanduk kerbau). Jumlah gonjong dan tangga umumnya mengikuti jumlah ruang bilik (kamar), dan ruang dalamnya terbagi ke milik perempuan-perempuan dari satu suku — mencerminkan garis keturunan matrilineal Minangkabau. Fungsi utamanya sebagai tempat tinggal keluarga besar, tempat musyawarah, serta tempat menyelenggarakan upacara adat seperti perkawinan dan batagak penghulu.",
      history:
        "Asal-usulnya berkaitan dengan legenda unsur tambo Minangkabau; bentuk atap gonjong populer dikaitkan dengan pertempuran kerbau dua tanduk dalam mitos pemenangan Minang melawan kerbau raksasa dari kerajaan tetangga. Arsitektur tahan gempa dengan konstruksi pasak kayu telah diwariskan lintas generasi.",
      meaning:
        "Rumah gadang melambangkan perempuan sebagai penjaga harta dan garis keturunan (bundo kanduang), serta nilai musyawarah mufakat. Gonjong menunjuk ke langit sebagai simbol kebesaran dan martabat adat.",
      license: "Teks: CC BY-SA 4.0 (mengacu Wikipedia). Media: lihat atribusi gambar.",
      attribution: "Ilustrasi AI untuk demo WaraNusa.",
      sources: [
        { title: "Wikipedia Indonesia — Rumah Gadang", url: "https://id.wikipedia.org/wiki/Rumah_Gadang", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0", verificationNote: "URL artikel Wikipedia standar; konten disaring ulang untuk ringkasan ini." },
        { title: "Warisan Budaya Takbenda Kemendikbudristek (portal)", url: "https://warisanbudaya.kemdikbud.go.id/", sourceType: "ARCHIVE", verificationNote: "Portal resmi pemerintah; rujuk pencarian 'Rumah Gadang' di dalam portal." },
      ],
      hotspots: [
        { title: "Gonjong (Atap Tanduk)", description: "Atap ijuk berujung runcing melengkung seperti tanduk kerbau; jumlah gonjong mengikuti jumlah bilik rumah.", x: 0, y: 1.9, z: 0 },
        { title: "Ukiran Dinding", description: "Panel kayu berukir motif alam dan sulur; mencerminkan kehalusan seni ukir Minangkabau.", x: 1.0, y: 0.9, z: 0.7 },
        { title: "Tiang & Pondasi Batu", description: "Konstruksi kayu diletakkan di atas batu tanpa paku, memberi kelenturan tahan gempa.", x: 0.8, y: 0.15, z: 0.9 },
      ],
    },
    {
      slug: "joglo", title: "Joglo", status: "PUBLISHED",
      categoryId: cRumah.id, regionId: diy.id, coverId: mJoglo.id, modelMediaId: mJoglo3d.id,
      summary: "Rumah tradisional Jawa dengan saka guru dan atap tumpang sari bertingkat dari kayu jati.",
      description:
        "Joglo adalah rumah tradisional Jawa bagian tengah yang ciri utamanya ada pada atap bertingkat disangga empat tiang utama (saka guru). Bagian dalam dibagi menjadi pendopo (ruang terbuka depan untuk tamu), pringgitan, dan dalem (ruang keluarga). Konstruksinya menggunakan pasak dan sambungan kayu tanpa paku besi.",
      history:
        "Joglo berkembang dari pengaruh arsitektur Hindu-Jawa; bentuk atap tumpang sari (bertingkat seperti gunungan) dipengaruhi punden berundak. Dahulu hanya diperuntukkan bagi bangsawan dan orang berpengaruh.",
      meaning:
        "Empat saka guru melambangkan penjaga empat penjuru; atap tumpang sari menggambarkan hubungan manusia dengan Sang Pencipta. Pendopo mencerminkan nilai keramahan dan musyawarah masyarakat Jawa.",
      license: "Teks: CC BY-SA 4.0 (mengacu Wikipedia). Media: lihat atribusi gambar.",
      attribution: "Ilustrasi AI untuk demo WaraNusa.",
      sources: [
        { title: "Wikipedia Indonesia — Joglo", url: "https://id.wikipedia.org/wiki/Joglo", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0", verificationNote: "URL artikel Wikipedia standar." },
        { title: "Sketchfab — Joglo House", creator: "ilhamsbi", url: "https://sketchfab.com/3d-models/joglo-house-4816e9b904af4f64ad819609c42497b8", sourceType: "OTHER", attribution: "Joglo House oleh ilhamsbi di Sketchfab", verificationNote: "Model 3D komunitas Sketchfab, ditampilkan via embed resmi Sketchfab; lisensi mengikuti halaman model." },
      ],
      hotspots: [
        { title: "Saka Guru", description: "Empat tiang utama penyangga atap; melambangkan empat penjaga arah mata angin.", x: 0.8, y: 0.8, z: 0.8 },
        { title: "Tumpang Sari", description: "Susunan balok atap bertingkat di bagian dalam; ruang paling suci rumah joglo.", x: 0, y: 1.7, z: 0 },
      ],
    },
    {
      slug: "batik-yogyakarta", title: "Batik Yogyakarta", featured: true, status: "PUBLISHED",
      categoryId: cTekstil.id, regionId: diy.id, coverId: mBatik.id, galleryIds: [mPiring.id],
      summary: "Kain batik tulis pedalaman Mataram dengan motif parang, kawung, dan sogan berwarna indigo.",
      description:
        "Batik Yogyakarta termasuk kelompok batik pedalaman (solo-yogya) dengan motif klasik seperti parang (garis diagonal mirip huruf S), kawung (empat elips seperti buah aren), serta grompol. Paletnya terbatas pada indigo (biru tarum), sogan (cokelat), dan putih gading. Batik dibuat dengan malam (lilin) yang dituliskan memakai canting, lalu dicelup berulang, dan malam dilepas dengan air panas.",
      history:
        "Pada 2 Oktober 2009 UNESCO menetapkan batik Indonesia sebagai Warisan Kemanusiaan untuk Budaya Lisan dan Takbenda. Motif-motif tertentu dahulu hanya boleh dikenakan keluarga keraton.",
      meaning:
        "Motif parang dipercaya mengandung filosofi kesinambungan perjuangan; kawung melambangkan pengendalian diri dan hati yang bersih. Setiap motif membawa doa dan nilai luhur bagi pemakainya.",
      license: "Teks: CC BY-SA 4.0 (mengacu Wikipedia/UNESCO). Media: lihat atribusi gambar.",
      attribution: "Ilustrasi AI untuk demo WaraNusa.",
      sources: [
        { title: "UNESCO ICH — Indonesian Batik", url: "https://ich.unesco.org/en/RL/indonesian-batik-00109", sourceType: "WEBSITE", attribution: "UNESCO Intangible Cultural Heritage", verificationNote: "URL resmi entri UNESCO untuk 'Indonesian Batik' (RL 00109)." },
        { title: "Wikipedia Indonesia — Batik", url: "https://id.wikipedia.org/wiki/Batik", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0" },
      ],
    },
    {
      slug: "songket-pandai-sikek", title: "Songket Pandai Sikek", status: "PUBLISHED",
      categoryId: cTekstil.id, regionId: sumbar.id, coverId: mSongket.id,
      summary: "Tenun songket benang emas dari Nagari Pandai Sikek, kaki Gunung Marapi.",
      description:
        "Songket adalah kain tenun yang diberi benang emas atau perak pada benang pakan, menghasilkan motif timbul berkilau. Nagari Pandai Sikek di kabupaten Tanah Datar adalah salah satu pusat songket Minangkabau paling dikenal, dengan motif khas seperti pucuak rabuang (pucuk rebung), saik gala manggil, dan bintang marpucak. Kain ini ditenun pada alat tenun bukan mesin (ATBM) secara turun-temurun.",
      history:
        "Tradisi menenun songket di Pandai Sikek telah berlangsung sejak ratusan tahun lalu dan menjadi mata pencaharian sampingan keluarga petani, khususnya kaum perempuan, sambil menjaga adat.",
      meaning:
        "Songket dipakai pada acara adat terpenting: perkawinan, batagak penghulu, dan pelantikan penghulu. Motif pucuak rabuang melambangkan harapan tumbuh dan maju.",
      license: "Teks: CC BY-SA 4.0 (mengacu Wikipedia). Media: lihat atribusi gambar.",
      attribution: "Ilustrasi AI untuk demo WaraNusa.",
      sources: [
        { title: "Wikipedia Indonesia — Songket", url: "https://id.wikipedia.org/wiki/Songket", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0" },
        { title: "Wikipedia Indonesia — Pandai Sikek", url: "https://id.wikipedia.org/wiki/Pandai_Sikek,_Tanjung_Datar", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0" },
      ],
    },
    {
      slug: "gamelan-jawa", title: "Gamelan Jawa (Saron)", featured: true, status: "PUBLISHED",
      categoryId: cMusik.id, regionId: diy.id, coverId: mGamelan.id,
      summary: "Ansambel perunggu keraton; saron adalah pemukul melodi utama laras pelog dan slendro.",
      description:
        "Gamelan adalah ansambel musik tradisional Jawa yang didominasi instrumen perunggu seperti gong, kenong, bonang, dan saron, serta kendang, suling, dan gender. Saron (demung, saron barung, peking) adalah keluarga metalofon dengan bilah perunggu di atas dawai di atas balok kayu berperanan (dhewa), dimainkan dengan tabuh kayu. Laras yang digunakan ada dua: slendro (lima nada) dan pelog (tujuh nada).",
      history:
        "Gamelan telah berkembang sejak era kerajaan Hindu-Buddha Jawa; penyebutannya terdapat pada relief candi seperti Borobudur. Gamelan keraton Yogyakarta dan Surakarta kini menjadi rujukan pakem laras dan repertoar.",
      meaning:
        "Dalam pandangan Jawa, gamelan berwibawa dan 'berjiwa'; dipercaya telah didengarkan dewata. Memainkan gamelan menuntut keselarasan — tak ada instrumen yang boleh mendominasi.",
      license: "Teks: CC BY-SA 4.0 (mengacu Wikipedia). Media: lihat atribusi gambar.",
      attribution: "Ilustrasi AI untuk demo WaraNusa. Demo audio pada halaman instrumen dibangkitkan sintetis via Web Audio API — bukan rekaman autentik.",
      sources: [
        { title: "Wikipedia Indonesia — Gamelan", url: "https://id.wikipedia.org/wiki/Gamelan", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0" },
        { title: "Wikipedia Indonesia — Saron (instrument)", url: "https://id.wikipedia.org/wiki/Saron_(instrument)", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0" },
      ],
      hotspots: [
        { title: "Balungan (Bilah Perunggu)", description: "Bilah perunggu yang dipukul menghasilkan nada inti lagu (balungan).", x: 0, y: 0.95, z: 0.2 },
        { title: "Dhewa (Balok Resonator)", description: "Balok kayu berperanan di bawah dawai bilah sebagai ruang resonansi.", x: 0, y: 0.45, z: 0 },
        { title: "Tabuh (Pemukul)", description: "Pemukul kayu dilapisi kain; cara memukul dan menahan nada (mematikan) menjadi ciri pakem.", x: 0.9, y: 0.9, z: 0.4 },
      ],
    },
    {
      slug: "angklung", title: "Angklung", status: "PUBLISHED",
      categoryId: cMusik.id, regionId: jabar.id, coverId: mAngklung.id,
      summary: "Instrumen bambu berbilah yang diguncang; warisan UNESCO sejak 2010.",
      description:
        "Angklung adalah alat musik bambu berbilah ganda yang bergetar dan berbunyi saat diguncang. Setiap angklung menghasilkan satu nada, sehingga dimainkan secara berkelompok — menuntut kerja sama dan saling percaya antarpemain. Angklung berkembang di masyarakat Sunda Priangan dan dipopulerkan kembali oleh Daeng Soetigna melalui penyetelan diatonis.",
      history:
        "Pada 18 November 2010 UNESCO menetapkan angklung sebagai Warisan Budaya Takbenda yang Membutuhkan Penjagaan Mendesak.",
      meaning:
        "Nilai utama angklung adalah kekompakan (kakawihan): satu nada dari satu orang, melodi lahir dari gotong royong.",
      license: "Teks: CC BY-SA 4.0 (mengacu Wikipedia/UNESCO). Media: lihat atribusi gambar.",
      attribution: "Ilustrasi AI untuk demo WaraNusa. Demo audio pada halaman instrumen dibangkitkan sintetis via Web Audio API — bukan rekaman autentik.",
      sources: [
        { title: "UNESCO ICH — Angklung", url: "https://ich.unesco.org/en/RL/angklung-00619", sourceType: "WEBSITE", attribution: "UNESCO Intangible Cultural Heritage", verificationNote: "URL resmi entri UNESCO untuk 'Angklung' (RL 00619)." },
        { title: "Wikipedia Indonesia — Angklung", url: "https://id.wikipedia.org/wiki/Angklung", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0" },
      ],
    },
    {
      slug: "tari-kecak", title: "Tari Kecak", status: "PUBLISHED",
      categoryId: cTari.id, regionId: bali.id, coverId: mKecak.id,
      summary: "Tarian api khas Bali dengan paduan suara 'cak' puluhan penari laki-laki duduk melingkar.",
      description:
        "Kecak adalah seni pertunjukan khas Bali yang dipentaskan puluhan (hingga ratusan) penari laki-laki duduk melingkar sambil mengangkat kedua tangan dan berseru 'cak-cak-cak' secara ritmis, menirukan suara kera. Pertunjukan mengisahkan kisah Ramayana — penculikan Dewi Sita oleh Rahwana dan pembakaran Hanoman — dengan api di tengah lingkaran.",
      history:
        "Kecak dikembangkan pada era 1930-an dari ritual sanghyang (trance) bersama pelukis Wayan Limbak dan etnomusikolog asal Jerman, Walter Spies, sebagai pertunjukan untuk khalayak luas.",
      meaning:
        "Lingkaran kecak dipandang memiliki kekuatan spiritual; bunyi 'cak' dan gerakan serempak dipercaya menghadirkan energi kolektif penari.",
      license: "Teks: CC BY-SA 4.0 (mengacu Wikipedia). Media: lihat atribusi gambar.",
      attribution: "Ilustrasi AI untuk demo WaraNusa.",
      sources: [
        { title: "Wikipedia Indonesia — Kecak", url: "https://id.wikipedia.org/wiki/Kecak", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0" },
      ],
    },
    {
      slug: "tari-piring", title: "Tari Piring", status: "DRAFT",
      categoryId: cTari.id, regionId: sumbar.id, coverId: mPiring.id,
      summary: "Tari Minangkabau dengan piring di kedua telapak tangan; contoh item berstatus draft di CMS.",
      description:
        "Tari piring adalah tarian dari Solok, Sumatera Barat, yang memperagakan gerakan petani menghormati padi dengan piring di kedua tangan. Penari bergerak lincah, bahkan menginjak pecahan piring tanpa terluka. Item ini sengaja diberi status DRAFT untuk demonstrasi alur moderasi CMS WaraNusa.",
      history: "Diperkirakan tumbuh lebih dari 800 tahun lalu sebagai perayaan panen padi sebelum masuknya pengaruh agama.",
      meaning: "Melambangkan rasa syukur petani atas hasil panen serta keanggunan dan kelincahan wanita Minang.",
      license: "Teks: CC BY-SA 4.0 (mengacu Wikipedia). Media: lihat atribusi gambar.",
      attribution: "Ilustrasi AI untuk demo WaraNusa.",
      sources: [
        { title: "Wikipedia Indonesia — Tari Piring", url: "https://id.wikipedia.org/wiki/Tari_Piring", sourceType: "WEBSITE", attribution: "Kontributor Wikipedia", license: "CC BY-SA 4.0" },
      ],
    },
  ];

  for (const it of items) {
    const { sources, hotspots, galleryIds, coverId, ...data } = it;
    const item = await db.culturalItem.create({
      data: {
        ...data,
        coverMediaId: coverId,
        createdById: editor.id,
        gallery: galleryIds
          ? { create: galleryIds.map((mid, i) => ({ mediaId: mid, order: i })) }
          : undefined,
      },
    });
    for (const s of sources) {
      await db.culturalSource.create({ data: { ...s, itemId: item.id, accessDate: today } });
    }
    for (const h of hotspots ?? []) {
      await db.modelHotspot.create({ data: { ...h, itemId: item.id } });
    }
  }

  // ============ DEMO KONTRIBUSI ============
  const contrib = await db.contribution.create({
    data: {
      refCode: "WN-7K3FQA",
      title: "Tari Piring dari Solok",
      regionId: sumbar.id,
      categorySlug: "tarian",
      description:
        "Tari piring adalah tarian Minangkabau asal Solok yang menggunakan piring di kedua telapak tangan. Penari menggerakkan piring serempak dengan gerakan cepat dan lincah, mengiringi talempong dan gandang. Usulan: ditambahkan ke kategori tarian.",
      sourceRef: "https://id.wikipedia.org/wiki/Tari_Piring (Wikipedia Indonesia, CC BY-SA 4.0)",
      submitterName: "Dewi Lestari",
      submitterEmail: "kontributor@waranusa.id",
      status: "SUBMITTED",
    },
  });
  await db.moderationReview.create({
    data: { contributionId: contrib.id, reviewerId: reviewer.id, action: "SUBMIT", note: "Diajukan melalui formulir kontribusi publik." },
  });

  await db.activityLog.create({ data: { userId: admin.id, action: "system.seed", entityType: "SYSTEM", detail: "Seeder data demonstrasi dijalankan" } });
  await db.activityLog.create({ data: { userId: editor.id, action: "item.create", entityType: "CulturalItem", entityId: "rumah-gadang", detail: "Rumah Gadang" } });

  const counts = {
    users: await db.user.count(),
    regions: await db.region.count(),
    categories: await db.category.count(),
    items: await db.culturalItem.count(),
    sources: await db.culturalSource.count(),
    media: await db.mediaAsset.count(),
  };
  console.log("✅ Seeded:", counts);
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
