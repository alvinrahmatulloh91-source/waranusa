'use client'

/**
 * Peta Indonesia interaktif (SVG bergaya stilasi).
 - Pulau bisa diklik untuk memfilter provinsi
 - Penanda provinsi bisa diklik untuk membuka detail
 * Proyeksi: x = (lng-94.5)*20, y = (7.5-lat)*20 → viewBox 940x400
 */
import { useState } from 'react'
import { ISLAND_MAP } from '@/data/islands'
import type { ProvinceSummary } from '@/lib/types'

const px = (lng: number) => (lng - 94.5) * 20
const py = (lat: number) => (7.5 - lat) * 20

const ISLAND_PATHS: Record<string, string> = {
  sumatra:
    'M 12 42 L 55 45 L 85 75 L 130 120 L 160 175 L 185 205 L 235 250 L 226 272 L 195 262 L 150 220 L 105 160 L 60 105 L 15 55 Z',
  jawa:
    'M 210 280 L 262 286 L 312 292 L 362 300 L 400 312 L 394 323 L 340 313 L 282 303 L 232 297 L 208 291 Z',
  kalimantan:
    'M 300 140 L 340 90 L 395 45 L 455 15 L 470 70 L 460 120 L 445 165 L 415 215 L 380 235 L 330 220 L 300 185 L 285 160 Z',
  sulawesi:
    'M 520 185 L 545 175 L 570 150 L 600 122 L 612 132 L 585 168 L 565 195 L 585 225 L 575 245 L 560 238 L 552 210 L 535 225 L 520 258 L 500 258 L 505 228 L 512 205 L 488 205 L 492 190 L 510 190 Z',
  'bali-nusa': '',
  maluku:
    'M 658 118 L 672 112 L 678 126 L 670 140 L 676 150 L 664 156 L 656 146 L 662 134 Z',
  papua:
    'M 735 165 L 760 140 L 790 150 L 800 170 L 830 165 L 860 185 L 905 185 L 925 200 L 935 240 L 920 285 L 915 322 L 880 315 L 845 285 L 815 255 L 790 235 L 775 210 L 745 195 L 728 180 Z',
}

/** Kepulauan kecil: Nusa Tenggara & gugusan Maluku sebagai bentuk sederhana. */
const SMALL_ISLANDS: { island: string; cx: number; cy: number; rx: number; ry: number; rot?: number }[] = [
  { island: 'bali-nusa', cx: 415, cy: 319, rx: 15, ry: 9 },
  { island: 'bali-nusa', cx: 440, cy: 322, rx: 12, ry: 8 },
  { island: 'bali-nusa', cx: 468, cy: 322, rx: 21, ry: 9 },
  { island: 'bali-nusa', cx: 538, cy: 321, rx: 28, ry: 8, rot: -0.06 },
  { island: 'bali-nusa', cx: 512, cy: 345, rx: 19, ry: 7 },
  { island: 'bali-nusa', cx: 585, cy: 352, rx: 26, ry: 7, rot: -0.12 },
  { island: 'maluku', cx: 700, cy: 212, rx: 22, ry: 8 },
  { island: 'maluku', cx: 645, cy: 218, rx: 12, ry: 8 },
  { island: 'maluku', cx: 658, cy: 133, rx: 5, ry: 5 },
  { island: 'maluku', cx: 673, cy: 224, rx: 5, ry: 5 },
  { island: 'maluku', cx: 726, cy: 250, rx: 8, ry: 5 },
  { island: 'maluku', cx: 620, cy: 165, rx: 5, ry: 4 },
]

const ISLAND_LABELS: { island: string; x: number; y: number }[] = [
  { island: 'sumatra', x: 95, y: 130 },
  { island: 'jawa', x: 300, y: 335 },
  { island: 'kalimantan', x: 375, y: 135 },
  { island: 'sulawesi', x: 548, y: 190 },
  { island: 'bali-nusa', x: 490, y: 300 },
  { island: 'maluku', x: 690, y: 175 },
  { island: 'papua', x: 830, y: 245 },
]

interface IndonesiaMapProps {
  provinces: ProvinceSummary[]
  island: string | null
  selectedProvince: string | null
  onSelectIsland: (key: string | null) => void
  onSelectProvince: (slug: string) => void
}

export function IndonesiaMap({ provinces, island, selectedProvince, onSelectIsland, onSelectProvince }: IndonesiaMapProps) {
  const [hoverIsland, setHoverIsland] = useState<string | null>(null)
  const [hoverProvince, setHoverProvince] = useState<string | null>(null)

  const islandDim = (key: string) => island !== null && island !== key
  const hoverKey = hoverIsland ?? island

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border bg-gradient-to-b from-[#eef3f0] via-[#e9e2cf] to-[#e3d5b8]">
      <svg
        viewBox="0 0 940 400"
        className="h-auto w-full select-none"
        role="group"
        aria-label="Peta Indonesia interaktif"
      >
        {/* garis khatulistiwa dekoratif */}
        <line x1="0" y1="150" x2="940" y2="150" stroke="#b08d3f" strokeDasharray="6 8" strokeWidth="1" opacity="0.35" />
        <text x="8" y="144" fontSize="10" fill="#97742d" opacity="0.7" className="font-medium">
          Khatulistiwa
        </text>

        {/* pulau utama */}
        {Object.entries(ISLAND_PATHS).map(([key, d]) => {
          if (!d) return null
          const g = ISLAND_MAP[key]
          const dim = islandDim(key)
          const hovered = hoverKey === key
          return (
            <path
              key={key}
              d={d}
              fill={g.color}
              stroke="#5e4527"
              strokeWidth={hovered ? 2.4 : 1.2}
              opacity={dim ? 0.16 : hovered ? 0.95 : 0.72}
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectIsland(island === key ? null : key)}
              onMouseEnter={() => setHoverIsland(key)}
              onMouseLeave={() => setHoverIsland(null)}
              role="button"
              aria-label={`Pulau ${g.label}`}
            />
          )
        })}

        {/* pulau kecil */}
        {SMALL_ISLANDS.map((s, i) => {
          const g = ISLAND_MAP[s.island]
          const dim = islandDim(s.island)
          const hovered = hoverKey === s.island
          return (
            <g key={i}>
              <ellipse
                cx={s.cx}
                cy={s.cy}
                rx={s.rx}
                ry={s.ry}
                transform={s.rot ? `rotate(${(s.rot * 180) / Math.PI} ${s.cx} ${s.cy})` : undefined}
                fill={g.color}
                stroke="#5e4527"
                strokeWidth={hovered ? 2 : 1}
                opacity={dim ? 0.16 : hovered ? 0.95 : 0.72}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectIsland(island === s.island ? null : s.island)}
                onMouseEnter={() => setHoverIsland(s.island)}
                onMouseLeave={() => setHoverIsland(null)}
                role="button"
                aria-label={`Gugusan ${g.label}`}
              />
            </g>
          )
        })}

        {/* label pulau */}
        {ISLAND_LABELS.map(({ island: key, x, y }) => {
          const g = ISLAND_MAP[key]
          const dim = islandDim(key)
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="13"
              fontWeight={700}
              fill="#3f2d18"
              opacity={dim ? 0.2 : 0.82}
              className="pointer-events-none tracking-wide"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              {g.label}
            </text>
          )
        })}

        {/* penanda provinsi */}
        {provinces.map((p) => {
          const g = ISLAND_MAP[p.island]
          const dim = islandDim(p.island)
          const active = selectedProvince === p.slug || hoverProvince === p.slug
          return (
            <g
              key={p.slug}
              transform={`translate(${px(p.lng)}, ${py(p.lat)})`}
              opacity={dim ? 0.18 : 1}
              className="cursor-pointer transition-opacity"
              onClick={() => onSelectProvince(p.slug)}
              onMouseEnter={() => setHoverProvince(p.slug)}
              onMouseLeave={() => setHoverProvince(null)}
              role="button"
              aria-label={`Provinsi ${p.name}`}
            >
              {active && <circle r="9" fill={g.color} className="wn-marker-pulse" />}
              <circle r={active ? 8.5 : 6.5} fill={g.color} stroke="#fffdf5" strokeWidth={active ? 2.6 : 2} className="transition-all" />
              {p.itemCount > 0 && <circle r="2.2" fill="#fffdf5" />}
              {(active || dim) && (
                <text
                  y={active ? -14 : 0}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight={700}
                  fill="#3f2d18"
                  stroke="#fdf8ec"
                  strokeWidth="3"
                  paintOrder="stroke"
                  className="pointer-events-none"
                >
                  {p.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className="pointer-events-none absolute bottom-2 right-3 rounded-lg bg-white/75 px-2.5 py-1 text-[10px] font-medium text-stone-600 backdrop-blur">
        Peta stilasi — klik pulau atau titik provinsi
      </div>
    </div>
  )
}
