'use client'

/**
 * ThreeViewer — kanvas 3D interaktif untuk item budaya.
 * - Orbit 360°, zoom, auto-rotate
 - Penanda bagian (part) yang bisa diklik: fungsi & filosofi
 - Zona main alat musik: klik memainkan suara + tombol melodi demo
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { instrumentAudio, type SoundParam } from '@/lib/instrument-audio'
import { HOUSE_MODELS } from './models/houses'
import { INSTRUMENT_MODELS } from './models/instruments'
import { RotateCw, Play, Square, Hand, Focus, X } from 'lucide-react'

export interface ViewerPart {
  id: string
  name: string
  pos: [number, number, number]
  color: string
  function: string
  philosophy: string
}

interface ThreeViewerProps {
  model3d: string
  parts?: ViewerPart[]
  sounds?: SoundParam[]
  melody?: string[]
  playable?: boolean
}

const DEFAULT_CAMERA: [number, number, number] = [7.5, 5.2, 9.5]
const DEFAULT_TARGET: [number, number, number] = [0, 1.6, 0]

/** Preset kamera: instrumen lebih kecil → kamera lebih dekat & rendah. */
const INSTRUMENT_CAMS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  saron: { pos: [5.4, 3.4, 6.8], target: [0, 0.8, 0] },
  talempong: { pos: [4.6, 3.0, 5.6], target: [0, 0.7, 0] },
  gong: { pos: [4.8, 3.2, 6.2], target: [0, 1.1, 0] },
  kendang: { pos: [4.6, 3.0, 5.8], target: [0, 0.55, 0] },
  angklung: { pos: [4.4, 3.0, 5.6], target: [0, 0.85, 0] },
  kolintang: { pos: [5.2, 3.2, 6.4], target: [0, 0.7, 0] },
  sasando: { pos: [4.8, 3.2, 5.8], target: [0, 1.1, 0] },
  lute: { pos: [4.6, 3.0, 5.6], target: [0, 0.6, 0] },
  rapai: { pos: [4.6, 3.0, 5.8], target: [0, 0.9, 0] },
  taganing: { pos: [4.6, 3.0, 5.6], target: [0, 0.7, 0] },
}
const HOUSE_CAM = { pos: DEFAULT_CAMERA, target: DEFAULT_TARGET }

function Ground() {
  return (
    <group>
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.2, 48]} />
        <meshStandardMaterial color="#d8c9a3" roughness={1} />
      </mesh>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.9, 7.15, 48]} />
        <meshBasicMaterial color="#b08d3f" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.6, 40]} />
        <meshBasicMaterial color="#b9a67c" transparent opacity={0.45} />
      </mesh>
    </group>
  )
}

function PartMarkers({
  parts, selected, onSelect, labelScale = 11,
}: {
  parts: ViewerPart[]
  selected: ViewerPart | null
  onSelect: (p: ViewerPart) => void
  labelScale?: number
}) {
  // Label HTML (drei Html membuat React root sendiri) dimount setelah commit pertama
  // agar tidak terjadi unmount sinkron di tengah render (race condition React 19).
  const [labelsReady, setLabelsReady] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setLabelsReady(true), 60)
    return () => window.clearTimeout(t)
  }, [])
  return (
    <group>
      {parts.map((p) => {
        const active = selected?.id === p.id
        return (
          <group key={p.id} position={p.pos}>
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                onSelect(p)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto'
              }}
            >
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshStandardMaterial
                color={active ? '#f59e0b' : p.color}
                emissive={active ? '#f59e0b' : '#000000'}
                emissiveIntensity={active ? 0.8 : 0}
                roughness={0.4}
              />
            </mesh>
            {labelsReady && (
              <Html center distanceFactor={labelScale} position={[0, 0.34, 0]} zIndexRange={[10, 0]}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(p)
                  }}
                  className={`pointer-events-auto whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-md backdrop-blur transition-colors ${
                    active
                      ? 'border-amber-500 bg-amber-500 text-stone-900'
                      : 'border-stone-300/70 bg-white/85 text-stone-700 hover:bg-amber-50'
                  }`}
                >
                  {p.name}
                </button>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}

function ModelStage({
  arch, variant, sounds, onHit, activeId,
}: {
  arch: string
  variant?: string
  sounds: SoundParam[]
  onHit?: (id: string) => void
  activeId?: string | null
}) {
  if (INSTRUMENT_MODELS[arch]) {
    const Comp = INSTRUMENT_MODELS[arch]
    return <Comp variant={variant} sounds={sounds} onHit={onHit} activeId={activeId} />
  }
  if (HOUSE_MODELS[arch]) {
    const Comp = HOUSE_MODELS[arch]
    return <Comp variant={variant} />
  }
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#b08d3f" />
    </mesh>
  )
}

export default function ThreeViewer({ model3d, parts = [], sounds = [], melody = [], playable = false }: ThreeViewerProps) {
  const [arch, variant] = useMemo(() => model3d.split(':') as [string, string | undefined], [model3d])
  const [selectedPart, setSelectedPart] = useState<ViewerPart | null>(null)
  const [activeSound, setActiveSound] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [playingMelody, setPlayingMelody] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  const isInstrument = arch in INSTRUMENT_MODELS
  const cam = useMemo(
    () => (isInstrument ? INSTRUMENT_CAMS[arch] ?? { pos: [4.8, 3.2, 6] as [number, number, number], target: [0, 0.9, 0] as [number, number, number] } : HOUSE_CAM),
    [arch, isInstrument]
  )

  // Target OrbitControls diterapkan imperatif (prop target drei tidak selalu efektif)
  useEffect(() => {
    const c = controlsRef.current
    if (!c) return
    c.target.set(cam.target[0], cam.target[1], cam.target[2])
    c.update()
  }, [cam, resetKey])

  const onHit = (id: string) => {
    const s = sounds.find((x) => x.id === id)
    if (!s) return
    instrumentAudio.play(s)
    setActiveSound(id)
    window.setTimeout(() => setActiveSound((cur) => (cur === id ? null : cur)), 650)
  }

  const playMelody = () => {
    if (!sounds.length || !melody?.length) return
    if (playingMelody) {
      instrumentAudio.stopMelody()
      setPlayingMelody(false)
      return
    }
    setPlayingMelody(true)
    const stop = instrumentAudio.playMelody(sounds, melody, 340)
    const total = melody.length * 340 + 800
    window.setTimeout(() => {
      stop()
      setPlayingMelody(false)
    }, total)
  }

  const focusPart = (p: ViewerPart) => {
    const c = controlsRef.current
    if (!c) return
    c.target.set(p.pos[0] * 0.8, Math.max(p.pos[1], 0.4), p.pos[2] * 0.8)
    const dist = isInstrument ? 2.6 : 4.5
    const dir = new THREE.Vector3(0.7, 0.5, 1).normalize()
    c.object.position.set(p.pos[0] + dir.x * dist, p.pos[1] + dir.y * dist + 0.5, p.pos[2] + dir.z * dist)
    c.update()
  }

  const resetView = () => {
    setSelectedPart(null)
    setResetKey((k) => k + 1)
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-xl border bg-gradient-to-b from-stone-200 via-stone-100 to-[#e8dcbd] md:h-[500px] dark:from-stone-800 dark:via-stone-800 dark:to-stone-900">
      <Canvas
        key={`${arch}-${variant ?? ''}`}
        camera={{ position: cam.pos, fov: 42 }}
        dpr={[1, 1.75]}
        onPointerMissed={() => setSelectedPart(null)}
      >
        <ambientLight intensity={0.8} />
        <hemisphereLight args={['#fff7e6', '#a89968', 0.55]} />
        <directionalLight position={[6, 10, 6]} intensity={1.15} />
        <directionalLight position={[-7, 5, -5]} intensity={0.3} />
        <Suspense fallback={null}>
          <Ground />
          <ModelStage arch={arch} variant={variant} sounds={sounds} onHit={onHit} activeId={activeSound} />
          <PartMarkers parts={parts} selected={selectedPart} onSelect={setSelectedPart} labelScale={isInstrument ? 5.5 : 11} />
        </Suspense>
        <OrbitControls
          key={resetKey}
          ref={controlsRef}
          target={cam.target}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.2}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2 - 0.04}
        />
      </Canvas>

      {/* Toolbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 p-3">
        <Badge variant="outline" className="pointer-events-auto border-stone-300 bg-white/85 text-stone-700 backdrop-blur">
          <Hand className="mr-1 h-3 w-3" /> Seret untuk memutar • gulir untuk zoom
        </Badge>
        <div className="pointer-events-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-stone-300 bg-white/85 text-stone-700 backdrop-blur hover:bg-white"
            onClick={() => setAutoRotate((v) => !v)}
          >
            <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'text-amber-600' : ''}`} />
            {autoRotate ? 'Rotasi: On' : 'Rotasi: Off'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-stone-300 bg-white/85 text-stone-700 backdrop-blur hover:bg-white"
            onClick={resetView}
          >
            <Focus className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Kontrol instrumen (baris kedua, selalu terlihat) */}
      {playable && sounds.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-3">
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-xl border border-stone-300/70 bg-white/90 p-1.5 shadow-lg backdrop-blur">
            <Button size="sm" className="h-7 gap-1 bg-amber-600 px-2.5 text-xs text-white hover:bg-amber-700" onClick={playMelody}>
              {playingMelody ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {playingMelody ? 'Stop' : 'Contoh Suara'}
            </Button>
            {sounds.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant="outline"
                className={`h-7 min-w-11 border-stone-300 px-2 text-xs ${activeSound === s.id ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white/90 text-stone-700'}`}
                onClick={() => onHit(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Info bagian terpilih */}
      {selectedPart && (
        <div className="absolute bottom-3 left-3 right-3 z-10 md:right-auto md:max-w-sm">
          <div className="rounded-xl border border-stone-300/70 bg-white/95 p-4 shadow-xl backdrop-blur">
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: selectedPart.color }} />
                <h4 className="text-sm font-semibold text-stone-800">{selectedPart.name}</h4>
              </div>
              <button
                onClick={() => setSelectedPart(null)}
                className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label="Tutup info bagian"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-stone-600">
              <span className="font-semibold text-stone-700">Fungsi: </span>
              {selectedPart.function}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
              <span className="font-semibold text-amber-700">Filosofi: </span>
              {selectedPart.philosophy}
            </p>
            <Button size="sm" variant="outline" className="mt-2.5 h-7 border-stone-300 text-xs text-stone-600" onClick={() => focusPart(selectedPart)}>
              <Focus className="h-3 w-3" /> Lihat dari dekat
            </Button>
          </div>
        </div>
      )}

      {/* Daftar bagian (chip) */}
      {parts.length > 0 && !selectedPart && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex max-h-[30%] flex-wrap justify-center gap-1.5 overflow-hidden px-3">
          {parts.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPart(p)}
              className="pointer-events-auto rounded-full border border-stone-300/70 bg-white/85 px-2.5 py-1 text-[11px] font-medium text-stone-700 shadow backdrop-blur transition hover:border-amber-400 hover:bg-amber-50"
            >
              <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
