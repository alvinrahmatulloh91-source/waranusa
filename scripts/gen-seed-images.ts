/**
 * WaraNusa — Seed image generator (dengan retry)
 * Jalankan: bun scripts/gen-seed-images.ts
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "public/uploads/seed");
fs.mkdirSync(OUT, { recursive: true });

const JOBS: Array<[string, string, string]> = [
  ["hero-archipelago.png", "1440x704", "Stylized flat illustration of the Indonesian archipelago map with islands shown as layered paper-cut art, teal and ocean blue sea, tropical green islands, warm gold accent sun, traditional ornament motifs subtly in waves, modern editorial illustration, clean composition, high quality, detailed"],
  ["rumah-gadang.png", "1344x768", "Traditional Minangkabau Rumah Gadang house in West Sumatra Indonesia with dramatic multi-tiered curved buffalo horn roof, carved wooden walls with red gold geometric ornaments, tropical garden foreground, warm afternoon light, professional architectural photography, high quality, detailed"],
  ["joglo.png", "1344x768", "Traditional Javanese Joglo house in Yogyakarta Indonesia, tall carved wooden pillars and layered pyramid roof, open pendopo pavilion, stone floor, lush tropical courtyard, soft morning light, professional architectural photography, high quality, detailed"],
  ["batik.png", "1344x768", "Elegant Javanese batik tulis cloth from Yogyakarta with indigo and sogan brown parang and kawung patterns, fabric elegantly draped with canting wax tool beside it, soft studio light, product photography, high quality, detailed"],
  ["songket.png", "1344x768", "Minangkabau songket woven textile from Pandai Sikek village West Sumatra, gold metallic threads on deep red silk with geometric motifs, traditional wooden loom in background, warm studio light, product photography, high quality, detailed"],
  ["gamelan.png", "1344x768", "Traditional Javanese gamelan saron instrument, bronze keyed metallophone on ornately carved wooden resonator case, wooden mallets resting on top, kraton palace interior softly blurred in background, warm golden light, professional photography, high quality, detailed"],
  ["angklung.png", "1344x768", "Traditional Sundanese angklung bamboo musical instruments from West Java Indonesia, set of wooden frame angklung of different sizes hanging on a rack, bamboo texture detail, bright tropical daylight, professional photography, high quality, detailed"],
  ["kecak.png", "1344x768", "Balinese Kecak fire dance performance at Uluwatu temple cliff at sunset, circle of seated male dancers raising hands, dramatic orange sky over ocean, dynamic cultural photography, high quality, detailed"],
  ["tari-piring.png", "1344x768", "Minangkabau Tari Piring plate dance from West Sumatra, female dancer in traditional red and gold costume holding plates in both hands, dynamic spinning motion, festival stage lighting, cultural performance photography, high quality, detailed"],
];

async function genOne(zai: Awaited<ReturnType<typeof ZAI.create>>, file: string, size: string, prompt: string): Promise<boolean> {
  const out = path.join(OUT, file);
  if (fs.existsSync(out) && fs.statSync(out).size > 10000) {
    console.log(`SKIP ${file}`);
    return true;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`GEN ${file} (attempt ${attempt})...`);
      const res = await zai.images.generations.create({ prompt, size });
      const b64 = res?.data?.[0]?.base64;
      if (!b64) throw new Error("empty base64");
      fs.writeFileSync(out, Buffer.from(b64, "base64"));
      console.log(`OK   ${file} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
      return true;
    } catch (e) {
      console.error(`ERR  ${file} attempt ${attempt}:`, (e as Error).message);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  return false;
}

async function main() {
  const zai = await ZAI.create();
  let failed = 0;
  for (const [file, size, prompt] of JOBS) {
    const ok = await genOne(zai, file, size, prompt);
    if (!ok) failed++;
  }
  console.log(failed === 0 ? "ALL DONE ✓" : `DONE WITH ${failed} FAILURES`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
