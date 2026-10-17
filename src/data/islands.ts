export interface IslandGroup {
  key: string
  label: string
  color: string
  desc: string
}

/** Warna tampilan gugus pulau — turunan palet brand (teal/ocean/green/gold/orange). */
export const ISLAND_GROUPS: IslandGroup[] = [
  { key: 'sumatra', label: 'Sumatra', color: '#0f8b89', desc: 'Barat Nusantara: Minangkabau, Batak, dan Aceh' },
  { key: 'jawa', label: 'Jawa', color: '#c4881c', desc: 'Jantung Mataram: keraton, joglo, dan gamelan' },
  { key: 'bali-nusa', label: 'Bali & Nusa Tenggara', color: '#3e8c5b', desc: 'Pulau Dewata hingga tenun Timor' },
  { key: 'kalimantan', label: 'Kalimantan', color: '#1261a0', desc: 'Rumah panjang Dayak dan sungai yang besar' },
  { key: 'sulawesi', label: 'Sulawesi', color: '#d2701f', desc: 'Tongkonan Toraja dan kolintang Minahasa' },
  { key: 'maluku', label: 'Kepulauan Maluku', color: '#0e6e8c', desc: 'Kepulauan rempah dunia' },
  { key: 'papua', label: 'Papua', color: '#56707e', desc: 'Honai Dani dan seni ukir Asmat' },
]

export const ISLAND_MAP = Object.fromEntries(ISLAND_GROUPS.map((g) => [g.key, g]))

/**
 * Kategori bawaan — dipakai sebagai seed tabel Category dan fallback UI
 * bila API kategori belum termuat. Label aktif dibaca dari /api/categories.
 */
export const CATEGORIES = [
  { key: 'RUMAH_ADAT', label: 'Rumah Adat', icon: 'Home', image: '/images/rumah-adat.png', desc: 'Arsitektur tradisional dan filosofinya' },
  { key: 'PAKAIAN_ADAT', label: 'Pakaian Adat', icon: 'Shirt', image: '/images/pakaian-adat.png', desc: 'Busana kebesaran dan kain warisan' },
  { key: 'ALAT_MUSIK', label: 'Alat Musik Tradisional', icon: 'Music', image: '/images/alat-musik.png', desc: 'Instrumen yang bisa didengar & dimainkan' },
  { key: 'TARIAN', label: 'Tarian Daerah', icon: 'PersonStanding', image: '/images/tarian.png', desc: 'Gerak yang menyimpan doa dan kisah' },
  { key: 'MAKANAN', label: 'Makanan Khas', icon: 'UtensilsCrossed', image: '/images/makanan.png', desc: 'Rasa yang menjadi identitas daerah' },
] as const

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

/** Atribusi bawaan untuk ilustrasi generatif yang dipakai platform. */
export const AI_ILLUSTRATION_NOTE =
  'Ilustrasi digital hasil generasi AI (WaraNusa) untuk keperluan demonstrasi — bukan foto artefak asli.'
