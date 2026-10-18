/**
 * WaraNusa — Perhitungan pemakaian media (usageCount & usedBy)
 * Dipakai admin media list/detail dan endpoint media publik.
 */
import { db } from "@/lib/db";

export interface MediaUsageRef {
  itemId: string;
  itemTitle: string;
  role: string; // "SAMPUL" | "MODEL 3D" | "AUDIO" | "GALERI"
}

/** Kumpulkan daftar pemakaian sejumlah media sekaligus (batch query) */
export async function mediaUsageMap(ids: string[]): Promise<Map<string, MediaUsageRef[]>> {
  const map = new Map<string, MediaUsageRef[]>();
  if (ids.length === 0) return map;

  const [covers, models, audios, galleries] = await Promise.all([
    db.culturalItem.findMany({
      where: { coverMediaId: { in: ids } },
      select: { id: true, title: true, coverMediaId: true },
    }),
    db.culturalItem.findMany({
      where: { modelMediaId: { in: ids } },
      select: { id: true, title: true, modelMediaId: true },
    }),
    db.culturalItem.findMany({
      where: { audioMediaId: { in: ids } },
      select: { id: true, title: true, audioMediaId: true },
    }),
    db.culturalItemMedia.findMany({
      where: { mediaId: { in: ids } },
      select: { mediaId: true, item: { select: { id: true, title: true } } },
    }),
  ]);

  const push = (mediaId: string | null, itemId: string, itemTitle: string, role: string) => {
    if (!mediaId) return;
    const arr = map.get(mediaId) ?? [];
    arr.push({ itemId, itemTitle, role });
    map.set(mediaId, arr);
  };

  for (const it of covers) push(it.coverMediaId, it.id, it.title, "SAMPUL");
  for (const it of models) push(it.modelMediaId, it.id, it.title, "MODEL 3D");
  for (const it of audios) push(it.audioMediaId, it.id, it.title, "AUDIO");
  for (const g of galleries) push(g.mediaId, g.item.id, g.item.title, "GALERI");

  return map;
}
