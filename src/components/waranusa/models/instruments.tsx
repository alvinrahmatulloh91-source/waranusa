'use client'

/**
 * Model 3D prosedural alat musik tradisional (playable).
 * Zona yang bisa diklik memicu suara via onHit(soundId).
 */
import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { SoundParam } from '@/lib/instrument-audio'

export interface InstrumentModelProps {
  variant?: string
  sounds: SoundParam[]
  onHit?: (id: string) => void
  activeId?: string | null
}

const WOOD = '#8a5a2b'
const WOOD_DARK = '#6b4f2e'
const BRONZE = '#b08d3f'
const MEMBRANE = '#d9c49a'
const BAMBOO = '#a8c686'
const WOODKEY = '#c8a15a'

function Mat({ color, rough = 0.7, metal = 0.15 }: { color: string; rough?: number; metal?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={metal} flatShading />
}

/** Zona interaktif: klik memicu suara; saat aktif diberi denyut skala. */
function PlayZone({
  id, onHit, activeId, position = [0, 0, 0], children,
}: {
  id: string
  onHit?: (id: string) => void
  activeId?: string | null
  position?: [number, number, number]
  children: React.ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    const active = activeId === id
    const target = active ? 1 + Math.sin(state.clock.elapsedTime * 14) * 0.055 : 1
    ref.current.scale.setScalar(ref.current.scale.x + (target - ref.current.scale.x) * 0.4)
  })
  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onHit?.(id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      {children}
    </group>
  )
}

/* ---------------------------------- SARON ---------------------------------- */
function SaronModel({ sounds, onHit, activeId }: InstrumentModelProps) {
  const n = Math.max(sounds.length, 1)
  const spacing = 0.58
  const startX = (-(n - 1) * spacing) / 2
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[3.5, 0.5, 0.95]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]}>
          <boxGeometry args={[0.35, 0.36, 0.8]} />
          <Mat color={WOOD} />
        </mesh>
      ))}
      {sounds.map((s, i) => (
        <PlayZone key={s.id} id={s.id} onHit={onHit} activeId={activeId}>
          <mesh position={[startX + i * spacing, 0.86, 0]}>
            <boxGeometry args={[0.5, 0.07, 0.55]} />
            <Mat color={BRONZE} metal={0.6} rough={0.35} />
          </mesh>
        </PlayZone>
      ))}
      {/* pencu penahan */}
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={`p${i}`} position={[startX - spacing / 2 + i * spacing, 0.82, 0]}>
          <boxGeometry args={[0.14, 0.14, 0.6]} />
          <Mat color="#a1743f" />
        </mesh>
      ))}
      {/* dua tabuh */}
      {[0.34, -0.34].map((z, i) => (
        <mesh key={i} position={[1.85, 0.95, z]} rotation={[0, 0.2, 1.25]}>
          <cylinderGeometry args={[0.04, 0.04, 0.85, 8]} />
          <Mat color={WOOD} />
        </mesh>
      ))}
    </group>
  )
}

/* -------------------------------- TALEMPONG -------------------------------- */
function TalempongModel({ sounds, onHit, activeId }: InstrumentModelProps) {
  const n = Math.max(sounds.length, 1)
  const spacing = 0.5
  const startX = (-(n - 1) * spacing) / 2
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.4, 0.14, 0.7]} />
        <Mat color={WOOD} />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.05, 0.24, sz * 0.26]}>
            <boxGeometry args={[0.12, 0.48, 0.12]} />
            <Mat color={WOOD_DARK} />
          </mesh>
        ))
      )}
      {sounds.map((s, i) => (
        <PlayZone key={s.id} id={s.id} onHit={onHit} activeId={activeId}>
          <group position={[startX + i * spacing, 0.57, 0]}>
            <mesh position={[0, 0.16, 0]}>
              <sphereGeometry args={[0.26, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <Mat color={BRONZE} metal={0.6} rough={0.35} />
            </mesh>
            <mesh position={[0, 0.36, 0]}>
              <sphereGeometry args={[0.075, 12, 8]} />
              <Mat color="#9a7528" metal={0.6} rough={0.35} />
            </mesh>
          </group>
        </PlayZone>
      ))}
      {/* petabuh */}
      <mesh position={[1.5, 0.85, 0.25]} rotation={[0, 0.4, 1.2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.7, 8]} />
        <Mat color={WOOD} />
      </mesh>
    </group>
  )
}

/* ----------------------------------- GONG ---------------------------------- */
function GongModel({ sounds, onHit, activeId }: InstrumentModelProps) {
  const id = sounds[0]?.id ?? 'gong'
  return (
    <group>
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.95, 0]}>
          <boxGeometry args={[0.16, 1.9, 0.16]} />
          <Mat color={WOOD} />
        </mesh>
      ))}
      <mesh position={[0, 1.92, 0]}>
        <boxGeometry args={[2.1, 0.18, 0.18]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={`r${x}`} position={[x, 1.72, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.5, 6]} />
          <Mat color="#6b4f2e" />
        </mesh>
      ))}
      <PlayZone id={id} onHit={onHit} activeId={activeId}>
        <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.78, 0.78, 0.06, 32]} />
          <Mat color={BRONZE} metal={0.7} rough={0.3} />
        </mesh>
        <mesh position={[0, 1.15, 0.05]} scale={[1, 1, 0.55]}>
          <sphereGeometry args={[0.22, 16, 12]} />
          <Mat color="#9a7528" metal={0.7} rough={0.3} />
        </mesh>
      </PlayZone>
      {/* penyangga bawah */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[2.1, 0.12, 0.7]} />
        <Mat color={WOOD_DARK} />
      </mesh>
    </group>
  )
}

/* --------------------------------- KENDANG --------------------------------- */
function KendangModel({ sounds, onHit, activeId, variant }: InstrumentModelProps) {
  const big = variant === 'beleq'
  const s = big ? 1.35 : 1
  const low = sounds.find((x) => x.param === 'low') ?? sounds[0]
  const high = sounds.find((x) => x.param === 'high') ?? sounds[1]
  const slap = sounds.find((x) => x.param === 'slap') ?? sounds[2]
  return (
    <group scale={s}>
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 1.15, 18]} />
        <Mat color={WOOD} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.31, 0.42, 0.55, 18]} />
          <Mat color={WOOD_DARK} />
        </mesh>
      ))}
      {low && (
        <PlayZone id={low.id} onHit={onHit} activeId={activeId}>
          <mesh position={[-1.14, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.31, 0.31, 0.05, 18]} />
            <Mat color={MEMBRANE} rough={0.9} metal={0} />
          </mesh>
        </PlayZone>
      )}
      {high && (
        <PlayZone id={high.id} onHit={onHit} activeId={activeId}>
          <mesh position={[1.14, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.31, 0.31, 0.05, 18]} />
            <Mat color="#e6d7b8" rough={0.9} metal={0} />
          </mesh>
        </PlayZone>
      )}
      {slap && (
        <PlayZone id={slap.id} onHit={onHit} activeId={activeId}>
          <mesh position={[0, 0.62, 0.28]}>
            <boxGeometry args={[0.7, 0.35, 0.02]} />
            <meshStandardMaterial color={WOOD} transparent opacity={0.001} />
          </mesh>
        </PlayZone>
      )}
      {/* tali pengikat */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={`t${x}`} position={[x, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.47, 0.03, 8, 20]} />
        </mesh>
      ))}
      {/* tumpuan */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={`k${x}`} position={[x, 0.06, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.9]} />
          <Mat color={WOOD_DARK} />
        </mesh>
      ))}
    </group>
  )
}

/* --------------------------------- ANKLUNG --------------------------------- */
function AngklungModel({ sounds, onHit, activeId }: InstrumentModelProps) {
  const n = Math.max(sounds.length, 1)
  const spacing = 0.26
  const startX = (-(n - 1) * spacing) / 2
  return (
    <group>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.8, 0]}>
          <boxGeometry args={[0.09, 1.6, 0.09]} />
          <Mat color={WOOD} />
        </mesh>
      ))}
      <mesh position={[0, 1.58, 0]}>
        <boxGeometry args={[1.34, 0.11, 0.11]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.34, 0.12, 0.4]} />
        <Mat color={WOOD} />
      </mesh>
      {sounds.map((s, i) => {
        const h = 1.05 - i * 0.13
        return (
          <PlayZone key={s.id} id={s.id} onHit={onHit} activeId={activeId}>
            <group position={[startX + i * spacing, 0, 0]}>
              {[-0.045, 0.045].map((dz) => (
                <mesh key={dz} position={[0, 0.06 + h / 2, dz]}>
                  <cylinderGeometry args={[0.042, 0.042, h, 10]} />
                  <Mat color={BAMBOO} rough={0.8} metal={0} />
                </mesh>
              ))}
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[0.2, 0.09, 0.3]} />
                <Mat color={BAMBOO} rough={0.8} metal={0} />
              </mesh>
            </group>
          </PlayZone>
        )
      })}
    </group>
  )
}

/* --------------------------- KOLINTANG / GAMBANG --------------------------- */
function KolintangModel({ sounds, onHit, activeId, variant }: InstrumentModelProps) {
  const gambang = variant === 'gambang'
  const n = Math.max(sounds.length, 1)
  const spacing = gambang ? 0.42 : 0.34
  const startX = (-(n - 1) * spacing) / 2
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[startX * 2 + spacing + 0.7, 0.5, 0.95]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (Math.abs(startX) + 0.5), 0.1, sz * 0.35]}>
            <boxGeometry args={[0.14, 0.2, 0.14]} />
            <Mat color={WOOD} />
          </mesh>
        ))
      )}
      {sounds.map((s, i) => {
        const len = 0.55 + (1 - i / Math.max(n - 1, 1)) * (gambang ? 0.15 : 0.3)
        return (
          <PlayZone key={s.id} id={s.id} onHit={onHit} activeId={activeId}>
            <mesh position={[startX + i * spacing, 0.76, 0]}>
              <boxGeometry args={[gambang ? 0.34 : 0.26, 0.07, len]} />
              <Mat color={WOODKEY} rough={0.6} metal={0.05} />
            </mesh>
          </PlayZone>
        )
      })}
      {[0.4, -0.4].map((z, i) => (
        <mesh key={i} position={[Math.abs(startX) + 0.75, 0.86, z]} rotation={[0, 0.2, 1.25]}>
          <cylinderGeometry args={[0.035, 0.035, 0.7, 8]} />
          <Mat color={WOOD} />
        </mesh>
      ))}
    </group>
  )
}

/* --------------------------------- SASANDO --------------------------------- */
function SasandoModel({ sounds, onHit, activeId }: InstrumentModelProps) {
  const n = Math.max(sounds.length, 1)
  return (
    <group>
      {/* dulu tabung bambu */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 1.7, 16]} />
        <Mat color={BAMBOO} rough={0.8} metal={0} />
      </mesh>
      {/* semiara kipas lontar */}
      <mesh position={[0.05, 1.2, -0.08]}>
        <circleGeometry args={[1.25, 32, 0, Math.PI]} />
        <meshStandardMaterial color="#d9c49a" side={2} roughness={1} />
      </mesh>
      <mesh position={[0.05, 1.2, -0.11]}>
        <circleGeometry args={[1.05, 32, 0, Math.PI]} />
        <meshStandardMaterial color="#c9b98a" side={2} roughness={1} />
      </mesh>
      {/* senar */}
      {sounds.map((s, i) => {
        const z = -0.14 + (i * 0.28) / Math.max(n - 1, 1)
        return (
          <PlayZone key={s.id} id={s.id} onHit={onHit} activeId={activeId}>
            <mesh position={[0, 1.5, z]}>
              <cylinderGeometry args={[0.012, 0.012, 1.5, 6]} />
              <meshStandardMaterial color="#e6d7b8" roughness={0.5} />
            </mesh>
          </PlayZone>
        )
      })}
      {/* kaki */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]}>
          <boxGeometry args={[0.12, 0.6, 0.4]} />
          <Mat color={WOOD_DARK} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[1.6, 0.1, 0.5]} />
        <Mat color={WOOD} />
      </mesh>
    </group>
  )
}

/* ------------------------------ LUTE (SAPE') ------------------------------- */
function LuteModel({ sounds, onHit, activeId }: InstrumentModelProps) {
  const n = Math.max(sounds.length, 1)
  return (
    <group>
      <mesh position={[-0.35, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.3, 0.85, 6, 14]} />
        <Mat color={WOOD} />
      </mesh>
      <mesh position={[0.85, 0.56, 0]} rotation={[0, 0, -0.06]}>
        <boxGeometry args={[1.0, 0.1, 0.16]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      <mesh position={[1.42, 0.6, 0]}>
        <boxGeometry args={[0.24, 0.15, 0.2]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      {sounds.map((s, i) => {
        const z = -0.09 + (i * 0.18) / Math.max(n - 1, 1)
        return (
          <PlayZone key={s.id} id={s.id} onHit={onHit} activeId={activeId}>
            <mesh position={[0.15, 0.66, z]}>
              <cylinderGeometry args={[0.008, 0.008, 1.85, 6]} />
              <meshStandardMaterial color="#e6d7b8" roughness={0.5} />
            </mesh>
          </PlayZone>
        )
      })}
      <mesh position={[-0.2, 0.66, 0]}>
        <boxGeometry args={[0.1, 0.06, 0.3]} />
        <Mat color="#a1743f" />
      </mesh>
      {/* tumpuan */}
      {[-0.6, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.12, 0]}>
          <boxGeometry args={[0.18, 0.24, 0.35]} />
          <Mat color={WOOD_DARK} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------- RAPAI ---------------------------------- */
function RapaiModel({ sounds, onHit, activeId }: InstrumentModelProps) {
  const n = Math.max(sounds.length, 1)
  const spacing = 0.72
  const startX = (-(n - 1) * spacing) / 2
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[startX * 2 + spacing + 0.6, 0.1, 0.5]} />
        <Mat color={WOOD_DARK} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (Math.abs(startX) + 0.45), 0.24, 0]}>
          <boxGeometry args={[0.14, 0.5, 0.4]} />
          <Mat color={WOOD} />
        </mesh>
      ))}
      {sounds.map((s, i) => (
        <PlayZone key={s.id} id={s.id} onHit={onHit} activeId={activeId}>
          <group position={[startX + i * spacing, 0.95, 0]} rotation={[-0.3, 0, 0]}>
            <mesh>
              <torusGeometry args={[0.32, 0.09, 10, 22]} />
              <Mat color={WOOD} />
            </mesh>
            <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.03, 22]} />
              <Mat color={MEMBRANE} rough={0.9} metal={0} />
            </mesh>
          </group>
        </PlayZone>
      ))}
    </group>
  )
}

/* --------------------------------- TAGANING -------------------------------- */
function TaganingModel({ sounds, onHit, activeId }: InstrumentModelProps) {
  const sorted = [...sounds].sort((a, b) => b.freq - a.freq) // kecil (tinggi) di kiri
  const n = Math.max(sorted.length, 1)
  const spacing = 0.42
  const startX = (-(n - 1) * spacing) / 2
  return (
    <group>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[startX * 2 + spacing + 0.5, 0.16, 0.6]} />
        <Mat color={WOOD} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (Math.abs(startX) + 0.35), 0.42, 0]}>
          <boxGeometry args={[0.14, 0.68, 0.5]} />
          <Mat color={WOOD_DARK} />
        </mesh>
      ))}
      {sorted.map((s, i) => {
        const r = 0.17 + (i / Math.max(n - 1, 1)) * 0.09
        return (
          <PlayZone key={s.id} id={s.id} onHit={onHit} activeId={activeId}>
            <group position={[startX + i * spacing, 0.58, 0]}>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[r, r * 1.08, 0.3, 14]} />
                <Mat color={WOOD_DARK} />
              </mesh>
              <mesh position={[0, 0.28, 0]}>
                <cylinderGeometry args={[r, r, 0.03, 14]} />
                <Mat color={MEMBRANE} rough={0.9} metal={0} />
              </mesh>
            </group>
          </PlayZone>
        )
      })}
      {/* dua tabuh */}
      {[0.28, -0.28].map((z, i) => (
        <mesh key={i} position={[Math.abs(startX) + 0.8, 0.72, z]} rotation={[0, 0.2, 1.25]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <Mat color={WOOD} />
        </mesh>
      ))}
    </group>
  )
}

export const INSTRUMENT_MODELS: Record<string, (props: InstrumentModelProps) => React.ReactElement> = {
  saron: (p) => <SaronModel {...p} />,
  talempong: (p) => <TalempongModel {...p} />,
  gong: (p) => <GongModel {...p} />,
  kendang: (p) => <KendangModel {...p} />,
  angklung: (p) => <AngklungModel {...p} />,
  kolintang: (p) => <KolintangModel {...p} />,
  sasando: (p) => <SasandoModel {...p} />,
  lute: (p) => <LuteModel {...p} />,
  rapai: (p) => <RapaiModel {...p} />,
  taganing: (p) => <TaganingModel {...p} />,
}
