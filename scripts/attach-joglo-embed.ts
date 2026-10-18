/**
 * WaraNusa — Attach model 3D embed Sketchfab "Joglo House" (ilhamsbi)
 * ke objek budaya `joglo` pada database yang sudah ada (tanpa re-seed).
 * Idempoten: aman dijalankan berulang.
 */
import { db } from "../src/lib/db";

const EMBED_URL = "https://sketchfab.com/models/4816e9b904af4f64ad819609c42497b8/embed";
const PAGE_URL = "https://sketchfab.com/3d-models/joglo-house-4816e9b904af4f64ad819609c42497b8";
const SOURCE_TITLE = "Sketchfab — Joglo House";

async function main() {
  const joglo = await db.culturalItem.findUnique({ where: { slug: "joglo" } });
  if (!joglo) throw new Error("Objek budaya 'joglo' tidak ditemukan — jalankan seed dahulu.");

  const staff =
    (await db.user.findFirst({ where: { role: "EDITOR", active: true } })) ??
    (await db.user.findFirst({ where: { role: "SUPER_ADMIN", active: true } }));
  if (!staff) throw new Error("Tidak ada user staff untuk uploaderId.");

  let asset = await db.mediaAsset.findFirst({ where: { embedUrl: EMBED_URL, type: "MODEL_3D" } });
  if (!asset) {
    asset = await db.mediaAsset.create({
      data: {
        name: "Joglo House — Sketchfab (embed)",
        description: "Model 3D rumah joglo yang ditampilkan melalui embed viewer resmi Sketchfab.",
        type: "MODEL_3D",
        format: "SKETCHFAB",
        mimeType: "text/html",
        size: 0,
        storagePath: null,
        embedUrl: EMBED_URL,
        license: null,
        attribution: "Joglo House oleh ilhamsbi di Sketchfab",
        status: "ACTIVE",
        uploaderId: staff.id,
      },
    });
    console.log("MediaAsset embed dibuat:", asset.id);
  } else {
    console.log("MediaAsset embed sudah ada:", asset.id);
  }

  if (joglo.modelMediaId !== asset.id) {
    await db.culturalItem.update({ where: { id: joglo.id }, data: { modelMediaId: asset.id } });
    console.log(`modelMediaId objek 'joglo' diperbarui -> ${asset.id}`);
  } else {
    console.log("Objek 'joglo' sudah memakai embed ini.");
  }

  const existingSource = await db.culturalSource.findFirst({ where: { itemId: joglo.id, url: PAGE_URL } });
  if (!existingSource) {
    await db.culturalSource.create({
      data: {
        itemId: joglo.id,
        title: SOURCE_TITLE,
        creator: "ilhamsbi",
        url: PAGE_URL,
        sourceType: "OTHER",
        attribution: "Joglo House oleh ilhamsbi di Sketchfab",
        verificationNote:
          "Model 3D komunitas Sketchfab, ditampilkan via embed resmi Sketchfab; lisensi mengikuti halaman model.",
      },
    });
    console.log("CulturalSource Sketchfab ditambahkan.");
  } else {
    console.log("CulturalSource Sketchfab sudah ada.");
  }

  console.log("SELESAI.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
