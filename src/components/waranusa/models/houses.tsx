'use client'

/**
 * Model 3D prosedural rumah adat — dibangun dari primitif three.js.
 * Semua model berpusat di origin dengan dasar di y=0.
 */

export type ModelProps = { variant?: string }

const WOOD = '#8a5a2b'
const WOOD_DARK = '#6b4f2e'
const WALL = '#b98a56'
const ROOF = '#5e4527'
const STONE = '#9a9a8f'
const RED = '#a34a2f'
const THATCH = '#7a6a44'

function Mat({ color, flat = true, rough = 0.95 }: { color: string; flat?: boolean; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} flatShading={flat} />
}

/** Atap limas 4 sisi (piramida memanjang). */
function PyramidRoof({ halfX, halfZ, rise, baseY, color = ROOF }: { halfX: number; halfZ: number; rise: number; baseY: number; color?: string }) {
  return (
    <mesh position={[0, baseY + rise / 2, 0]} scale={[halfX, rise, halfZ]}>
      <coneGeometry args={[1, 1, 4, 1]} />
      <Mat color={color} />
    </mesh>
  )
}

/** Atap pelana (gable) memanjang sumbu X — prisma segitiga. */
function GableRoof({ len, halfWidth, rise, baseY, color = ROOF }: { len: number; halfWidth: number; rise: number; baseY: number; color?: string }) {
  const h = rise / 1.5
  const d = halfWidth / 0.866
  return (
    <mesh position={[0, baseY + rise / 2, 0]} rotation={[0, 0, Math.PI / 2]} scale={[h, len, d]}>
      <cylinderGeometry args={[1, 1, 1, 3, 1, false, Math.PI / 2]} />
      <Mat color={color} />
    </mesh>
  )
}

/** Atap melengkung naik di ujung (perahu/gonjong) dari segmen-segmen box. */
function CurvedRoof({
  halfLen, depth, baseY, rise, segments = 11, color = ROOF, tips = 0,
}: { halfLen: number; depth: number; baseY: number; rise: number; segments?: number; color?: string; tips?: number }) {
  const segW = (halfLen * 2) / segments
  const items: React.ReactNode[] = []
  for (let i = 0; i < segments; i++) {
    const xc = -halfLen + segW * (i + 0.5)
    const t = xc / halfLen
    const y = baseY + rise * t * t
    const slope = Math.atan((2 * rise * t) / halfLen)
    items.push(
      <mesh key={i} position={[xc, y + 0.09, 0]} rotation={[0, 0, slope]}>
        <boxGeometry args={[segW * 1.18, 0.18, depth]} />
        <Mat color={color} />
      </mesh>
    )
  }
  // ujung tanduk
  for (let s = 0; s < (tips > 0 ? 2 : 0); s++) {
    const side = s === 0 ? -1 : 1
    items.push(
      <mesh key={`tip${s}`} position={[side * (halfLen + 0.28), baseY + rise + 0.42, 0]} rotation={[0, 0, side * 0.85]}>
        <coneGeometry args={[0.17, 1.05, 6]} />
        <Mat color={color} />
      </mesh>
    )
  }
  return <group>{items}</group>
}

function Post({ x, z, h, r = 0.14, color = WOOD }: { x: number; z: number; h: number; r?: number; color?: string }) {
  return (
    <mesh position={[x, h / 2, z]}>
      <cylinderGeometry args={[r, r, h, 8]} />
      <Mat color={color} />
    </mesh>
  )
}

function Stairs({ y, z = 2.1, w = 1.0, color = WOOD_DARK }: { y: number; z?: number; w?: number; color?: string }) {
  const len = Math.max(y * 1.6, 1.2)
  return (
    <mesh position={[0, y / 2 - 0.02, z + len / 3.2]} rotation={[-Math.atan2(y, len), 0, 0]}>
      <boxGeometry args={[w, 0.1, len]} />
      <Mat color={color} />
    </mesh>
  )
}

/* ---------------------------------- JOGLO ---------------------------------- */
function JogloModel() {
  const outer: [number, number][] = [
    [-2.6, -1.6], [2.6, -1.6], [-2.6, 1.6], [2.6, 1.6],
    [-2.6, 0], [2.6, 0],
  ]
  const guru: [number, number][] = [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[6.6, 0.24, 4.6]} />
        <Mat color={STONE} />
      </mesh>
      {outer.map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 0.36, z]}>
            <boxGeometry args={[0.46, 0.24, 0.46]} />
            <Mat color={STONE} />
          </mesh>
          <Post x={x} z={z} h={1.9} r={0.12} />
        </group>
      ))}
      {guru.map(([x, z], i) => (
        <group key={`g${i}`}>
          <mesh position={[x, 0.36, z]}>
            <boxGeometry args={[0.56, 0.24, 0.56]} />
            <Mat color={STONE} />
          </mesh>
          <Post x={x} z={z} h={2.05} r={0.17} />
        </group>
      ))}
      <mesh position={[0, 2.35, 0]}>
        <boxGeometry args={[4.4, 0.22, 3.0]} />
        <Mat color={WOOD} />
      </mesh>
      <PyramidRoof halfX={3.7} halfZ={2.65} rise={1.25} baseY={2.46} />
      <PyramidRoof halfX={1.55} halfZ={1.25} rise={1.45} baseY={3.68} color={WOOD_DARK} />
      <mesh position={[0, 5.32, 0]}>
        <coneGeometry args={[0.16, 0.5, 6]} />
        <Mat color={WOOD_DARK} />
      </mesh>
    </group>
  )
}

/* --------------------------------- GADANG ---------------------------------- */
function GadangModel() {
  const posts: [number, number][] = [
    [-2.9, -1.2], [-1.5, -1.2], [0, -1.2], [1.5, -1.2], [2.9, -1.2],
    [-2.9, 1.2], [-1.5, 1.2], [0, 1.2], [1.5, 1.2], [2.9, 1.2],
  ]
  return (
    <group>
      {posts.map(([x, z], i) => (
        <Post key={i} x={x} z={z} h={1.55} r={0.13} />
      ))}
      <mesh position={[0, 1.68, 0]}>
        <boxGeometry args={[7.0, 0.3, 3.4]} />
        <Mat color={WOOD} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[6.6, 1.15, 3.1]} />
        <Mat color={WALL} />
      </mesh>
      <mesh position={[0, 2.35, 1.58]}>
        <boxGeometry args={[6.6, 0.85, 0.06]} />
        <Mat color={RED} />
      </mesh>
      {/* anjungan + tangga */}
      <mesh position={[2.4, 1.66, 2.15]}>
        <boxGeometry args={[1.3, 0.24, 1.4]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      <Stairs y={1.55} z={2.72} w={0.9} />
      <CurvedRoof halfLen={3.75} depth={3.5} baseY={2.98} rise={1.15} segments={11} tips={0} />
      {/* gonjong besar di kedua ujung */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.9, 4.55, 0]} rotation={[0, 0, s * 0.95]}>
          <coneGeometry args={[0.2, 1.5, 6]} />
          <Mat color={ROOF} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`m${s}`} position={[s * 1.9, 4.22, 0]} rotation={[0, 0, s * 0.5]}>
          <coneGeometry args={[0.12, 0.8, 6]} />
          <Mat color={ROOF} />
        </mesh>
      ))}
    </group>
  )
}

/* ----------------------------- BOLON / BUBUNGAN ---------------------------- */
function BolonModel({ variant }: ModelProps) {
  const tall = variant === 'bubungan_tinggi'
  const postH = tall ? 1.25 : 1.7
  const bodyTop = postH + 1.05
  const rise = tall ? 3.3 : 2.6
  const posts: [number, number][] = [
    [-2.5, -1.4], [2.5, -1.4], [-2.5, 1.4], [2.5, 1.4], [-2.5, 0], [2.5, 0],
  ]
  return (
    <group>
      {posts.map(([x, z], i) => (
        <Post key={i} x={x} z={z} h={postH} r={0.17} />
      ))}
      <mesh position={[0, postH + 0.5, 0]}>
        <boxGeometry args={[5.8, 1.05, 3.5]} />
        <Mat color={WALL} />
      </mesh>
      <mesh position={[0, postH + 0.72, 1.78]}>
        <boxGeometry args={[5.84, 0.42, 0.06]} />
        <Mat color={RED} />
      </mesh>
      {/* siparepare teras depan */}
      <mesh position={[0, postH + 0.08, 2.35]}>
        <boxGeometry args={[6.0, 0.14, 1.1]} />
        <Mat color={WOOD} />
      </mesh>
      {[-2.2, 2.2].map((x) => (
        <Post key={`s${x}`} x={x} z={2.7} h={postH + 0.15} r={0.1} />
      ))}
      <Stairs y={postH} z={3.0} w={0.95} />
      <PyramidRoof halfX={3.45} halfZ={2.35} rise={rise} baseY={bodyTop} />
      <mesh position={[0, bodyTop + rise + 0.3, 0]}>
        <coneGeometry args={[0.14, 0.6, 6]} />
        <Mat color={WOOD_DARK} />
      </mesh>
    </group>
  )
}

/* ---------------------------- PANGGUNG (5 varian) --------------------------- */
function PanggungModel({ variant = 'rumoh' }: ModelProps) {
  const cfg = {
    rumoh: { L: 5.6, postH: 1.1, roof: 'gable3' },
    kebaya: { L: 5.0, postH: 1.1, roof: 'limasan' },
    julang: { L: 5.0, postH: 1.2, roof: 'gable' },
    osing: { L: 4.8, postH: 1.3, roof: 'tall' },
    wale: { L: 4.6, postH: 1.2, roof: 'limasan_tall' },
  }[variant] ?? { L: 5, postH: 1.2, roof: 'gable' }

  const halfL = cfg.L / 2
  const bodyTop = cfg.postH + 1.0
  const postXs = [-halfL + 0.35, 0, halfL - 0.35]

  return (
    <group>
      {postXs.map((x) =>
        [-1.1, 1.1].map((z) => <Post key={`${x}${z}`} x={x} z={z} h={cfg.postH} r={0.13} />)
      )}
      <mesh position={[0, cfg.postH + 0.5, 0]}>
        <boxGeometry args={[cfg.L, 1.0, 2.9]} />
        <Mat color={WALL} />
      </mesh>
      <mesh position={[0, cfg.postH + 0.62, 1.48]}>
        <boxGeometry args={[cfg.L * 0.55, 0.6, 0.06]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      <Stairs y={cfg.postH} z={1.75} w={0.9} />

      {cfg.roof === 'gable3' && (
        <group>
          <GableRoof len={cfg.L + 1.2} halfWidth={2.15} rise={1.0} baseY={bodyTop} />
          <GableRoof len={cfg.L - 0.4} halfWidth={1.35} rise={0.95} baseY={bodyTop + 1.0} color={WOOD_DARK} />
        </group>
      )}
      {cfg.roof === 'gable' && (
        <group>
          <GableRoof len={cfg.L + 1.1} halfWidth={2.05} rise={1.05} baseY={bodyTop} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (halfL + 0.35), bodyTop + 1.45, 0]} rotation={[0, 0, s * 0.55]}>
              <boxGeometry args={[0.9, 0.12, 0.3]} />
              <Mat color={ROOF} />
            </mesh>
          ))}
        </group>
      )}
      {cfg.roof === 'tall' && (
        <group>
          <GableRoof len={cfg.L + 1.0} halfWidth={1.85} rise={1.7} baseY={bodyTop} />
          {[-2.0, -1.0, 0, 1.0, 2.0].map((x) =>
            [-1, 1].map((s) => (
              <mesh key={`${x}${s}`} position={[x, bodyTop + 0.28, s * 1.78]}>
                <boxGeometry args={[0.22, 0.55, 0.1]} />
                <Mat color={WOOD_DARK} />
              </mesh>
            ))
          )}
        </group>
      )}
      {(cfg.roof === 'limasan' || cfg.roof === 'limasan_tall') && (
        <PyramidRoof
          halfX={halfL + 0.7}
          halfZ={2.15}
          rise={cfg.roof === 'limasan' ? 1.5 : 1.9}
          baseY={bodyTop}
        />
      )}
    </group>
  )
}

/* -------------------------------- TONGKONAN -------------------------------- */
function TongkonanModel() {
  const posts: [number, number][] = [
    [-1.85, -1.15], [0, -1.15], [1.85, -1.15],
    [-1.85, 1.15], [0, 1.15], [1.85, 1.15],
  ]
  return (
    <group>
      {posts.map(([x, z], i) => (
        <Post key={i} x={x} z={z} h={1.75} r={0.14} />
      ))}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[4.3, 0.35, 2.95]} />
        <Mat color={WOOD} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[3.9, 0.95, 2.6]} />
        <Mat color={WALL} />
      </mesh>
      {/* rante */}
      <mesh position={[0, 2.62, 1.34]}>
        <boxGeometry args={[4.0, 0.22, 0.12]} />
        <Mat color={RED} />
      </mesh>
      {/* tulak somba dinding depan */}
      <mesh position={[0, 2.95, 1.42]}>
        <boxGeometry args={[2.1, 0.9, 0.1]} />
        <Mat color={RED} />
      </mesh>
      <CurvedRoof halfLen={2.7} depth={3.1} baseY={3.3} rise={0.85} segments={9} tips={0} />
      {/* tanduk kerbau di depan atap */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 4.15, 0.9]} rotation={[0.5, 0, x > 0 ? -0.7 : 0.7]}>
          <coneGeometry args={[0.09, 0.75, 6]} />
          <Mat color="#e8ddc4" />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------- HONAI ---------------------------------- */
function HonaiModel() {
  return (
    <group>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[2.15, 2.2, 0.84, 20]} />
        <Mat color="#a1743f" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[2.18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.15]} />
        <Mat color={THATCH} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <coneGeometry args={[0.22, 0.5, 8]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      {/* pintu kecil */}
      <mesh position={[0, 0.36, 2.02]}>
        <boxGeometry args={[0.62, 0.72, 0.34]} />
        <Mat color="#3b2c1c" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.06, 24]} />
        <meshStandardMaterial color="#c9b98a" roughness={1} />
      </mesh>
    </group>
  )
}

/* ------------------------------ LAMIN / BETANG ----------------------------- */
function LaminModel({ variant }: ModelProps) {
  const long = variant === 'betang'
  const L = long ? 11.5 : 9
  const halfL = L / 2
  const n = long ? 7 : 5
  const xs = Array.from({ length: n }, (_, i) => -halfL + 0.6 + (i * (L - 1.2)) / (n - 1))
  return (
    <group>
      {xs.map((x) =>
        [-1.3, 1.3].map((z) => <Post key={`${x}${z}`} x={x} z={z} h={1.5} r={0.15} />)
      )}
      {xs.map((x) => (
        <Post key={`f${x}`} x={x} z={2.35} h={1.56} r={0.1} />
      ))}
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[L, 1.1, 3.3]} />
        <Mat color={WALL} />
      </mesh>
      {/* sawai teras */}
      <mesh position={[0, 2.1, 2.2]}>
        <boxGeometry args={[L, 0.14, 1.0]} />
        <Mat color={WOOD} />
      </mesh>
      <mesh position={[0, 2.4, 1.68]}>
        <boxGeometry args={[L * 0.9, 0.5, 0.05]} />
        <Mat color={RED} />
      </mesh>
      <Stairs y={1.55} z={2.9} w={0.9} />
      <PyramidRoof halfX={halfL + 0.6} halfZ={2.45} rise={1.9} baseY={2.6} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (halfL - 0.2), 4.95, 0]}>
          <coneGeometry args={[0.14, 0.6, 6]} />
          <Mat color={WOOD_DARK} />
        </mesh>
      ))}
    </group>
  )
}

/* --------------------------------- BAILEO ---------------------------------- */
function BaileoModel() {
  const cols: [number, number][] = [
    [-2.9, -1.9], [0, -1.9], [2.9, -1.9],
    [-2.9, 1.9], [0, 1.9], [2.9, 1.9],
    [-2.9, 0], [2.9, 0],
  ]
  return (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[7.2, 0.24, 4.9]} />
        <Mat color={STONE} />
      </mesh>
      {cols.map(([x, z], i) => (
        <Post key={i} x={x} z={z} h={2.4} r={0.13} />
      ))}
      <mesh position={[0, 2.52, 0]}>
        <boxGeometry args={[6.7, 0.24, 4.4]} />
        <Mat color={WOOD} />
      </mesh>
      <PyramidRoof halfX={4.0} halfZ={3.0} rise={1.85} baseY={2.64} />
      <mesh position={[0, 4.65, 0]}>
        <coneGeometry args={[0.15, 0.55, 6]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      {/* bangku panjang */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.36, s * 1.2]}>
          <boxGeometry args={[4.4, 0.24, 0.4]} />
          <Mat color={WOOD_DARK} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------ CANDI BENTAR ------------------------------- */
function CandiBentarModel() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[4.4, 0.1, 1.6]} />
        <Mat color="#8a8a8f" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.5, 0, 0]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[1.05, 0.6, 1.05]} />
            <Mat color="#b98a56" />
          </mesh>
          <mesh position={[0, 1.35, 0]} rotation={[0, 0, -s * 0.05]}>
            <boxGeometry args={[0.8, 1.55, 0.8]} />
            <Mat color="#a1743f" />
          </mesh>
          <mesh position={[0, 2.42, 0]} scale={[0.62, 0.42, 0.62]}>
            <coneGeometry args={[1, 1, 4]} />
            <Mat color={WOOD_DARK} />
          </mesh>
          <mesh position={[0, 2.86, 0]} scale={[0.4, 0.34, 0.4]}>
            <coneGeometry args={[1, 1, 4]} />
            <Mat color={WOOD_DARK} />
          </mesh>
          <mesh position={[0, 3.16, 0]}>
            <coneGeometry args={[0.1, 0.34, 6]} />
            <Mat color={WOOD_DARK} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------ BALE LUMBUNG ------------------------------- */
function BaleLumbungModel() {
  const posts: [number, number][] = [[-1.5, -1.05], [1.5, -1.05], [-1.5, 1.05], [1.5, 1.05]]
  return (
    <group>
      {posts.map(([x, z], i) => (
        <group key={i}>
          <Post x={x} z={z} h={1.45} r={0.16} />
          <mesh position={[x, 1.51, z]}>
            <cylinderGeometry args={[0.32, 0.32, 0.13, 12]} />
            <Mat color={STONE} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.72, 0]}>
        <boxGeometry args={[4.1, 0.32, 2.85]} />
        <Mat color={WOOD} />
      </mesh>
      <mesh position={[0, 2.28, 0]}>
        <boxGeometry args={[3.5, 0.75, 2.35]} />
        <Mat color={WALL} />
      </mesh>
      <PyramidRoof halfX={2.7} halfZ={2.0} rise={1.75} baseY={2.66} />
      <mesh position={[0, 4.6, 0]}>
        <coneGeometry args={[0.13, 0.55, 6]} />
        <Mat color={WOOD_DARK} />
      </mesh>
    </group>
  )
}

/* ------------------------------- MBARU NIANG ------------------------------- */
function MbaruNiangModel() {
  return (
    <group>
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[2.1, 2.2, 2.3, 20]} />
        <Mat color="#9a7448" />
      </mesh>
      <mesh position={[0, 0.9, 2.12]}>
        <boxGeometry args={[0.66, 1.15, 0.22]} />
        <Mat color="#3b2c1c" />
      </mesh>
      {/* atap kerucut bertingkat */}
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[2.45, 2.5, 16]} />
        <Mat color={THATCH} />
      </mesh>
      <mesh position={[0, 3.15, 0]}>
        <cylinderGeometry args={[2.05, 2.05, 0.14, 16]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      <mesh position={[0, 3.95, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.13, 16]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      <mesh position={[0, 4.95, 0]}>
        <coneGeometry args={[0.16, 0.55, 8]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[2.55, 2.55, 0.06, 24]} />
        <meshStandardMaterial color="#c9b98a" roughness={1} />
      </mesh>
    </group>
  )
}

export const HOUSE_MODELS: Record<string, (props: ModelProps) => React.ReactElement> = {
  joglo: () => <JogloModel />,
  gadang: () => <GadangModel />,
  bolon: (p) => <BolonModel {...p} />,
  bubungan_tinggi: (p) => <BolonModel {...p} />,
  panggung: (p) => <PanggungModel {...p} />,
  tongkonan: () => <TongkonanModel />,
  honai: () => <HonaiModel />,
  lamin: (p) => <LaminModel {...p} />,
  baileo: () => <BaileoModel />,
  candi_bentar: () => <CandiBentarModel />,
  bale_lumbung: () => <BaleLumbungModel />,
  mbaru_niang: () => <MbaruNiangModel />,
}
