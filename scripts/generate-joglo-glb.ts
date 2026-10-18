/**
 * WaraNusa — Generator aset 3D "Rumah Joglo" (prosedural → GLB).
 *
 * Membangun model rumah joglo Jawa secara prosedural dengan three.js lalu
 * mengekspornya sebagai berkas GLB (glTF 2.0 binary) yang VALID untuk diunggah
 * lewat CMS (Media Manager, tipe MODEL_3D, maks 30 MB).
 *
 * Siluet mengikuti arsitektur joglo klasik (terinspirasi model komunitas
 * "Joglo House" oleh ilhamsbi di Sketchfab):
 *  - undakan batu + lantai kayu diangkat
 *  - 4 saka guru + umpak batu, 16 soko peweki/langkitan keliling
 *  - balok keliling (banten) + mahkota saka guru
 *  - atap limasan bawah + jubug/tumpang sari bertingkat (profil "gunungan")
 *  - wuwungan (bukit atap) + tangga undakan depan
 *
 * Output:
 *  1. public/downloads/joglo-house.glb          — salinan siap unduh (URL statis)
 *  2. uploads/media/<yyyy>/<mm>/....glb         — mengikuti konvensi storage CMS
 *  3. Baris MediaAsset (MODEL_3D) — idempoten, agar aset langsung muncul di
 *     Media Manager dan bisa dipasangkan manual ke objek budaya lewat CMS.
 *
 * Catatan teknis: GLTFExporter butuh FileReader; bun belum menyediakannya,
 * jadi dipasang shim minimal (async microtask, aman terhadap urutan handler).
 *
 * Jalankan: bun scripts/generate-joglo-glb.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { db } from "../src/lib/db";
import { UPLOAD_ROOT, saveUploadFile } from "../src/lib/storage";

// ---------- Shim FileReader untuk bun (dipakai GLTFExporter saat binary) ----------
class FileReaderShim {
  result: ArrayBuffer | string | null = null;
  onload: ((ev?: unknown) => void) | null = null;
  onloadend: ((ev?: unknown) => void) | null = null;
  onerror: ((ev?: unknown) => void) | null = null;
  readAsArrayBuffer(blob: Blob) {
    Promise.resolve(blob.arrayBuffer())
      .then((ab) => {
        this.result = ab;
        this.onload?.();
        this.onloadend?.();
      })
      .catch((e) => this.onerror?.(e));
  }
  readAsDataURL(blob: Blob) {
    Promise.resolve(blob.arrayBuffer())
      .then((ab) => {
        this.result = `data:application/octet-stream;base64,${Buffer.from(ab).toString("base64")}`;
        this.onload?.();
        this.onloadend?.();
      })
      .catch((e) => this.onerror?.(e));
  }
}
(globalThis as unknown as { FileReader: unknown }).FileReader = FileReaderShim;

// ---------- Material ----------
type MatKey = "stone" | "floor" | "wood" | "woodSaka" | "woodDark" | "roof";

const MATERIALS: Record<MatKey, THREE.MeshStandardMaterial> = {
  stone: new THREE.MeshStandardMaterial({ color: 0xb3ac9e, roughness: 0.95, metalness: 0 }), // undakan batu
  floor: new THREE.MeshStandardMaterial({ color: 0xa87f52, roughness: 0.85, metalness: 0 }), // lantai + tangga
  wood: new THREE.MeshStandardMaterial({ color: 0x84603c, roughness: 0.85, metalness: 0 }), // soko keliling + balok
  woodSaka: new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.8, metalness: 0 }), // saka guru (kayu jati gelap)
  woodDark: new THREE.MeshStandardMaterial({ color: 0x54381f, roughness: 0.9, metalness: 0 }), // lisung/bingkai atap
  roof: new THREE.MeshStandardMaterial({ color: 0x8f4e2e, roughness: 0.92, metalness: 0 }), // genteng/wuwungan
};

const parts: Record<MatKey, THREE.BufferGeometry[]> = {
  stone: [], floor: [], wood: [], woodSaka: [], woodDark: [], roof: [],
};

function addBox(m: MatKey, cx: number, cy: number, cz: number, w: number, h: number, d: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(cx, cy, cz);
  parts[m].push(g);
}

/** Prisma segi-4 (frustum persegi panjang) — sisi miring + tutup atas & bawah. */
function addFrustum(
  m: MatKey,
  hx0: number, hz0: number, hx1: number, hz1: number, y0: number, y1: number,
) {
  const b = [
    [-hx0, y0, -hz0], [hx0, y0, -hz0], [hx0, y0, hz0], [-hx0, y0, hz0],
  ];
  const t = [
    [-hx1, y1, -hz1], [hx1, y1, -hz1], [hx1, y1, hz1], [-hx1, y1, hz1],
  ];
  const quads: Array<[THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]> = [
    // sisi keliling (keluar)
    [v(b[0]), v(b[1]), v(t[1]), v(t[0])],
    [v(b[1]), v(b[2]), v(t[2]), v(t[1])],
    [v(b[2]), v(b[3]), v(t[3]), v(t[2])],
    [v(b[3]), v(b[0]), v(t[0]), v(t[3])],
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  const pushQuad = (q: Array<[THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]>, flip: boolean) => {
    const base = positions.length / 3;
    for (const p of q) positions.push(p.x, p.y, p.z);
    if (flip) indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
    else indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  for (const q of quads) pushQuad([q[0], q[1], q[2], q[3]], true); // sisi keliling (normal keluar-atas)
  pushQuad([v(t[0]), v(t[1]), v(t[2]), v(t[3])], true); // atas (+Y)
  pushQuad([v(b[0]), v(b[1]), v(b[2]), v(b[3])], false); // bawah (-Y)

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array((positions.length / 3) * 2), 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  parts[m].push(g);
}
const v = (a: number[]) => new THREE.Vector3(a[0], a[1], a[2]);

// =====================================================================
// 1. Undakan batu & lantai
// =====================================================================
addBox("stone", 0, 0.15, 0, 9.7, 0.3, 7.7); // plinth tanah
addBox("stone", 0, 0.45, 0, 9.3, 0.3, 7.3); // undakan kedua
addBox("floor", 0, 0.66, 0, 8.8, 0.12, 6.8); // lantai papan (sarthagel)

// =====================================================================
// 2. Tangga undakan depan (sisi -Z)
// =====================================================================
for (let k = 0; k < 4; k++) {
  const topY = 0.72 - 0.18 * k;
  addBox("floor", 0, topY - 0.075, -3.74 - 0.34 * k, 1.7, 0.15, 0.34);
}
addBox("stone", -0.95, 0.4, -4.1, 0.08, 0.8, 1.6); // dada tangga kiri
addBox("stone", 0.95, 0.4, -4.1, 0.08, 0.8, 1.6); // dada tangga kanan

// =====================================================================
// 3. Kolom
// =====================================================================
const SAKA_X = 1.6, SAKA_Z = 1.35;
const sakaPos: Array<[number, number]> = [
  [-SAKA_X, -SAKA_Z], [SAKA_X, -SAKA_Z], [-SAKA_X, SAKA_Z], [SAKA_X, SAKA_Z],
];
for (const [x, z] of sakaPos) {
  addBox("stone", x, 0.78, z, 0.42, 0.12, 0.42); // umpak batu
  addBox("woodSaka", x, (0.84 + 3.4) / 2, z, 0.24, 3.4 - 0.84, 0.24); // saka guru
}

// Soko keliling (peweki/langkitan) — 16 kolom di tepi
const PX = 4.1, PZ = 3.1;
const perim: Array<[number, number]> = [];
for (const x of [-PX, -2.05, 0, 2.05, PX]) perim.push([x, -PZ], [x, PZ]); // sisi panjang
for (const z of [-1.55, 0, 1.55]) perim.push([-PX, z], [PX, z]); // sisi pendek
for (const [x, z] of perim) {
  addBox("stone", x, 0.78, z, 0.34, 0.12, 0.34); // umpak kecil
  addBox("wood", x, (0.84 + 2.7) / 2, z, 0.18, 2.7 - 0.84, 0.18);
}

// =====================================================================
// 4. Balok keliling & mahkota saka guru
// =====================================================================
addBox("wood", 0, 2.8, -PZ, PX * 2 + 0.18, 0.2, 0.16);
addBox("wood", 0, 2.8, PZ, PX * 2 + 0.18, 0.2, 0.16);
addBox("wood", -PX, 2.8, 0, 0.16, 0.2, PZ * 2 + 0.18);
addBox("wood", PX, 2.8, 0, 0.16, 0.2, PZ * 2 + 0.18);

addBox("woodSaka", 0, 3.51, -SAKA_Z, SAKA_X * 2 + 0.24, 0.22, 0.18);
addBox("woodSaka", 0, 3.51, SAKA_Z, SAKA_X * 2 + 0.24, 0.22, 0.18);
addBox("woodSaka", -SAKA_X, 3.51, 0, 0.18, 0.22, SAKA_Z * 2 + 0.18);
addBox("woodSaka", SAKA_X, 3.51, 0, 0.18, 0.22, SAKA_Z * 2 + 0.18);
// pagar banten (balok silang) di bawah mahkota
addBox("woodSaka", 0, 3.18, 0, SAKA_X * 2, 0.14, 0.14);
addBox("woodSaka", 0, 3.18, 0, 0.14, 0.14, SAKA_Z * 2);

// =====================================================================
// 5. Atap — limasan bawah + jubug/tumpang sari bertingkat
// =====================================================================
// Limasan bawah (menutup seluruh kolom + overhang)
addFrustum("roof", 4.85, 3.85, 2.0, 1.6, 2.82, 4.7);
// Tumpang sari — 3 tingkat makin curam & kecil (profil gunungan)
addFrustum("roof", 2.0, 1.6, 1.5, 1.2, 4.7, 5.45);
addFrustum("roof", 1.5, 1.2, 1.05, 0.85, 5.55, 6.25);
addFrustum("roof", 1.05, 0.85, 0.6, 0.5, 6.35, 6.95);
// Lisung/bingkai gelap di tiap peralihan tingkat (siluet "bertingkat")
addBox("woodDark", 0, 4.74, 0, 4.1, 0.12, 3.3);
addBox("woodDark", 0, 5.5, 0, 3.15, 0.12, 2.55);
addBox("woodDark", 0, 6.3, 0, 2.2, 0.12, 1.8);
// Wuwungan (bukit atap) + tutup ujung
addBox("woodDark", 0, 7.08, 0, 1.7, 0.22, 0.42);
addBox("woodDark", -0.82, 7.12, 0, 0.16, 0.3, 0.5);
addBox("woodDark", 0.82, 7.12, 0, 0.16, 0.3, 0.5);
// Alas wuwungan
addFrustum("woodDark", 0.6, 0.5, 0.78, 0.28, 6.95, 7.0);

// =====================================================================
// Rakit scene → merge per material → export GLB
// =====================================================================
const scene = new THREE.Scene();
scene.name = "JogloHouse";
const meshNames: Record<MatKey, string> = {
  stone: "UndakanBatu", floor: "LantaiTangga", wood: "SokoKeliling",
  woodSaka: "SakaGuru", woodDark: "LisungWuwungan", roof: "AtapTumpangSari",
};
for (const key of Object.keys(parts) as MatKey[]) {
  if (parts[key].length === 0) continue;
  const merged = mergeGeometries(parts[key], false);
  if (!merged) throw new Error(`Gagal merge geometri material ${key}`);
  const mesh = new THREE.Mesh(merged, MATERIALS[key]);
  mesh.name = meshNames[key];
  scene.add(mesh);
}

const bbox = new THREE.Box3().setFromObject(scene);
const size = bbox.getSize(new THREE.Vector3());
const maxDim = Math.max(size.x, size.y, size.z);
console.log(`BBox model: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} m (maxDim ${maxDim.toFixed(2)})`);

const exporter = new GLTFExporter();
const glb = (await exporter.parseAsync(scene, { binary: true })) as ArrayBuffer;
const buffer = Buffer.from(glb);

// Sanity: magic bytes GLB
if (buffer.subarray(0, 4).toString("ascii") !== "glTF") {
  throw new Error("Output bukan GLB valid (magic bytes salah).");
}

// ---------- Simpan ----------
const dlDir = path.join(process.cwd(), "public", "downloads");
await mkdir(dlDir, { recursive: true });
await writeFile(path.join(dlDir, "joglo-house.glb"), buffer);

const rel = await saveUploadFile("joglo-house.glb", buffer, "model/gltf-binary");
console.log("Tersimpan:", rel, `(${(buffer.byteLength / 1024).toFixed(1)} KB)`);
console.log(`Salinan unduh: public/downloads/joglo-house.glb`);

// ---------- Daftarkan MediaAsset (idempoten) ----------
const ASSET_NAME = "Rumah Joglo — GLB prosedural";
const staff =
  (await db.user.findFirst({ where: { role: "SUPER_ADMIN", active: true } })) ??
  (await db.user.findFirst({ where: { role: "EDITOR", active: true } }));
if (!staff) throw new Error("Tidak ada user staff untuk uploaderId.");

const existing = await db.mediaAsset.findFirst({ where: { name: ASSET_NAME, type: "MODEL_3D" } });
if (existing) {
  const updated = await db.mediaAsset.update({
    where: { id: existing.id },
    data: { storagePath: rel, size: buffer.byteLength, status: "ACTIVE" },
  });
  console.log("MediaAsset diperbarui:", updated.id);
} else {
  const created = await db.mediaAsset.create({
    data: {
      name: ASSET_NAME,
      description:
        "Model 3D rumah joglo dibuat prosedural (three.js) untuk WaraNusa: saka guru bersangga umpak batu, atap tumpang sari bertingkat, wuwungan, dan tangga undakan. Siluet terinspirasi arsitektur joglo Jawa Tengah. Aset generatif internal — bebas dipakai di dalam proyek ini.",
      type: "MODEL_3D",
      format: "glb",
      mimeType: "model/gltf-binary",
      size: buffer.byteLength,
      storagePath: rel,
      embedUrl: null,
      license: null,
      attribution: "Model prosedural WaraNusa — inspirasi siluet: 'Joglo House' oleh ilhamsbi (Sketchfab)",
      status: "ACTIVE",
      uploaderId: staff.id,
    },
  });
  console.log("MediaAsset dibuat:", created.id);
}

// ---------- Saran koordinat hotspot (ruang ternormalisasi viewer) ----------
// Viewer menormalkan model: dimensi terbesar -> 2.2, pangkal y=0, terpusat x/z.
const s = 2.2 / maxDim;
const toNorm = (x: number, y: number, z: number) => [x * s, y * s, z * s];
const suggestions = {
  "Saka Guru": toNorm(1.85, 2.0, 1.6),
  "Tumpang Sari": toNorm(1.55, 5.3, 1.25),
  "Pendopo": toNorm(0, 1.1, 3.3),
  "Wuwungan": toNorm(0, 7.35, 0),
};
console.log("Saran koordinat hotspot (x, y, z ternormalisasi):");
for (const [name, [x, y, z]] of Object.entries(suggestions)) {
  console.log(`  ${name}: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`);
}
console.log("SELESAI.");
process.exit(0);
