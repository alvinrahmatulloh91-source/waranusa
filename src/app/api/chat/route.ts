import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// In-memory cache untuk context RAG-lite
let cachedContext: string | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

async function getCulturalCatalogContext(): Promise<string> {
  const now = Date.now();
  if (cachedContext && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedContext;
  }

  try {
    const [items, regions] = await Promise.all([
      db.culturalItem.findMany({
        where: { status: "PUBLISHED" },
        select: {
          title: true,
          slug: true,
          summary: true,
          meaning: true,
          history: true,
          category: { select: { name: true } },
          region: { select: { name: true, islandGroup: true } },
        },
        take: 20,
      }),
      db.region.findMany({
        select: {
          name: true,
          islandGroup: true,
          summary: true,
        },
      }),
    ]);

    let context = "=== DATA KATALOG RESMI WARANUSA ===\n\n";

    if (regions.length > 0) {
      context += "DAFTAR WILAYAH NUSANTARA:\n";
      for (const r of regions) {
        context += `- ${r.name} (${r.islandGroup}): ${r.summary}\n`;
      }
      context += "\n";
    }

    if (items.length > 0) {
      context += "OBJEK BUDAYA DALAM PLATFORM:\n";
      for (const item of items) {
        context += `1. **${item.title}** (${item.category.name} - ${item.region.name})\n`;
        context += `   Ringkasan: ${item.summary}\n`;
        if (item.meaning) context += `   Makna/Filosofi: ${item.meaning}\n`;
        if (item.history) context += `   Sejarah Singkat: ${item.history.slice(0, 180)}...\n`;
        context += `   Tautan Platform: /#/budaya/${item.slug}\n\n`;
      }
    }

    cachedContext = context;
    lastCacheTime = now;
    return context;
  } catch (error) {
    console.error("[Karsa RAG] Gagal memuat data katalog:", error);
    return "";
  }
}

function buildSystemPrompt(culturalContext: string): string {
  return `Anda adalah "Karsa", asisten dan kurator AI resmi untuk platform WaraNusa (Platform Eksplorasi & Pelestarian Budaya Nusantara Indonesia).

Karakter & Gaya Komunikasi:
- Ramah, hangat, santun, berwawasan luas, dan bangga akan warisan budaya Indonesia.
- Berbicara dengan Bahasa Indonesia yang elegan, jelas, dan edukatif.
- Menghormati nilai-nilai tradisi leluhur dan kearifan lokal.
- Format jawaban dengan Markdown yang rapi (gunakan bolding untuk istilah budaya, serta bullet points bila menerangkan beberapa poin).
- Berikan penjelasan yang mendalam namun mudah dipahami oleh generasi muda dan masyarakat umum.
- Ajak pengguna untuk mengeksplorasi fitur WaraNusa (katalog budaya, peta interaktif nusantara, model 3D, dan instrumen musik virtual Saron).

${culturalContext}

Panduan Penjawab:
- Jika pengguna bertanya tentang objek budaya yang ada di katalog Waranusa di atas (misalnya Rumah Joglo, Gamelan Saron, Batik, dsb), integrasikan informasi dari katalog tersebut dan sebutkan bahwa mereka dapat melihatnya secara interaktif di platform Waranusa.
- Jawablah dengan ringkas, padat (2-4 paragraf atau daftar terstruktur), tidak bertele-tele namun kaya makna.`;
}

// Fallback cerdas saat GEMINI_API_KEY tidak ada atau gagal
function generateCulturalFallbackResponse(userPrompt: string): string {
  const p = userPrompt.toLowerCase();

  if (p.includes("joglo") || p.includes("rumah")) {
    return `### 🏛️ Filosofi Rumah Adat Joglo

Rumah adat **Joglo** dari Jawa memiliki filosofi arsitektur dan tata nilai hidup yang sangat mendalam:

1. **Saka Guru (Empat Tiang Utama)**: Empat pilar kayu jati utama di tengah ruangan melambangkan empat arah mata angin dan kekuatan penopang semesta (*mandala jagat*). Ini mencerminkan keseimbangan batiniah manusia.
2. **Atap Tumpangsari**: Struktur balok bersusun di atas saka guru yang berundak ke atas melambangkan tingkatan spiritual menuju Yang Maha Esa.
3. **Pembagian Ruang Berjenjang**:
   - **Pendopo**: Area depan terbuka tanpa dinding yang melambangkan keramahan dan keterbukaan pemilik rumah terhadap tamu.
   - **Pringgitan**: Ruang perantara untuk pertunjukan wayang atau musyawarah.
   - **Dalem / Omah Njero**: Ruang privat keluarga yang sakral tempat peristirahatan dan doa (*senthong*).

Di platform **WaraNusa**, Anda juga dapat melihat model visual 3D Rumah Joglo secara interaktif pada menu Katalog Budaya!`;
  }

  if (p.includes("saron") || p.includes("gamelan")) {
    return `### 🎵 Gamelan Saron & Makna Harmoni

**Saron** (atau *ricik*) merupakan instrumen inti dalam ansambel Gamelan Jawa dan Bali:

- **Bilah Perunggu**: Memiliki 7 bilah logam perunggu (atau kuningan) yang diletakkan di atas rancakan kayu berukir.
- **Sistem Laras**: Umumnya menggunakan laras **Pelog** (7 nada dengan nuansa khidmat & syahdu) atau **Slendro** (5 nada dengan nuansa ceria & dinamis).
- **Teknik Matedhet (Mematuk & Menutup)**: Tangan kanan memukul bilah dengan tabuh bertanduk, sementara tangan kiri memegang bilah sebelumnya agar dengungnya berhenti tepat saat nada baru berbunyi. Ini mengajarkan pengendalian diri (*tepo seliro*) dan harmoni kebersamaan.

💡 *Kabar baik*: Anda dapat memainkan instrumen virtual **Gamelan Saron** langsung di fitur **Instrumen Virtual** WaraNusa!`;
  }

  if (p.includes("batik")) {
    return `### 🎨 Sejarah & Filosofi Luhur Batik

**Batik** telah diakui oleh UNESCO sebagai *Masterpiece of the Oral and Intangible Heritage of Humanity* sejak 2009. Berasal dari bahasa Jawa *"amba"* (menulis) dan *"titik"* (titik).

Beberapa motif klasik dan filosofinya:
- **Motif Parang**: Garis miring berulang menyerupai ombak samudra yang tak pernah berhenti menghantam karang. Melambangkan semangat pantang menyerah, keteguhan hati, dan kesinambungan perjuangan.
- **Motif Kawung**: Pola empat lingkaran lonjong menyerupai buah kolang-kaling yang melambangkan kesucian hati, keadilan, dan kesadaran diri sebagai manusia yang bermanfaat bagi sesama.
- **Motif Truntum**: Bintang-bintang kecil yang bermakna cinta yang tumbuh kembali dan ketulusan abadi.

Mari jelajahi ragam koleksi tekstil dan motif batik lainnya di katalog **WaraNusa**!`;
  }

  return `Salam budaya! Senang sekali bisa berbagi pengetahuan bersama Anda. 

Nusantara menyimpan lebih dari 1.300 suku bangsa dengan kekayaan budaya tak ternilai—mulai dari arsitektur vernakular seperti **Rumah Gadang** dan **Joglo**, keanggunan kain tradisional seperti **Batik** dan **Songket**, hingga harmonisasi musik tradisional seperti **Gamelan** dan **Angklung**.

Ada topik budaya Nusantara tertentu yang ingin Anda telusuri lebih jauh bersama Karsa hari ini? Anda juga dapat mengklik salah satu topik cepat di bawah!`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body as { messages?: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Format request tidak valid. Array messages diperlukan." },
        { status: 400 }
      );
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const userQuery = lastUserMessage?.content || "";

    // Ambil RAG-lite context dari Prisma
    const culturalContext = await getCulturalCatalogContext();
    const systemPrompt = buildSystemPrompt(culturalContext);

    const apiKey = process.env.GEMINI_API_KEY;

    // Jika API Key belum terpasang, gunakan respons cerdas fallback
    if (!apiKey) {
      const fallbackReply = generateCulturalFallbackResponse(userQuery);
      return NextResponse.json({
        role: "assistant",
        content: fallbackReply,
      });
    }

    // Format pesan untuk Gemini API (v1beta generateContent)
    const geminiContents = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    if (geminiContents.length === 0) {
      geminiContents.push({
        role: "user",
        parts: [{ text: userQuery || "Halo Karsa" }],
      });
    }

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Karsa Gemini API Error ${response.status}]:`, errorText);
      // Fallback anggun jika kuota habis atau error dari API
      const fallbackReply = generateCulturalFallbackResponse(userQuery);
      return NextResponse.json({
        role: "assistant",
        content: fallbackReply,
      });
    }

    const data = await response.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateCulturalFallbackResponse(userQuery);

    return NextResponse.json({
      role: "assistant",
      content: replyText,
    });
  } catch (error) {
    console.error("[Karsa API Handler Error]:", error);
    return NextResponse.json({
      role: "assistant",
      content:
        "Maaf, saat ini Karsa sedang mengalami kendala jaringan saat menghubungkan ke arsip budaya. Silakan coba tanyakan kembali sesaat lagi.",
    });
  }
}
