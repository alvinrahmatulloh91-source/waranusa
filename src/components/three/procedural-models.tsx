"use client";

/**
 * WaraNusa — Model 3D prosedural (R3F primitives, tanpa aset eksternal).
 *
 * Semua komponen di sini HANYA geometri + material (MeshStandardMaterial).
 * Pencahayaan & kamera dipasang oleh pemanggil (ModelViewer / SaronInstrument).
 * Konvensi ruang: model berdiri di atas y=0 (pangkal 0, puncak ±2 unit),
 * terpusat pada sumbu X/Z di origin.
 */

import * as React from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";

// ---------- Palet material ----------
const C = {
  wood: "#8B5A2B", // kayu utama
  woodDark: "#6B4423", // kayu gelap (tiang, rangka)
  woodDarkest: "#4E3320", // kayu paling gelap (kaki, pintu)
  woodWall: "#9A6B3F", // dinding papan
  ijuk: "#4A3524", // atap ijuk gelap
  bronze: "#B08D57", // perunggu bilah
  gold: "#F2B544", // aksen emas
  stone: "#A8A89F", // batu pedestal/lantai
  stoneLight: "#B8B8B0", // batu terang
  opening: "#3E2A16", // bukaan jendela/pintu gelap
} as const;

type Vec3 = [number, number, number];

// ---------- Label sprite (pengganti drei <Html>, aman React 19 StrictMode) ----------
const labelTextureCache = new Map<string, THREE.CanvasTexture>();

/** Tekstur nomor/teks lingkaran via Canvas 2D — tanpa portal DOM. */
export function makeLabelTexture(
  text: string,
  opts?: { bg?: string; fg?: string; border?: string }
): THREE.CanvasTexture {
  const key = `${text}|${opts?.bg ?? ""}|${opts?.fg ?? ""}|${opts?.border ?? ""}`;
  const cached = labelTextureCache.get(key);
  if (cached) return cached;
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 42, 0, Math.PI * 2);
    ctx.fillStyle = opts?.bg ?? "#F2B544";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = opts?.border ?? "#FFFFFF";
    ctx.stroke();
    ctx.fillStyle = opts?.fg ?? "#172B3A";
    ctx.font = "bold 44px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, size / 2, size / 2 + 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  labelTextureCache.set(key, tex);
  return tex;
}

/**
 * Label 3D berbentuk sprite yang selalu menghadap kamera.
 * Dipakai untuk nomor hotspot dan label nada (pengganti <Html>).
 */
export function SpriteLabel({
  text,
  position,
  scale = 0.28,
  bg,
  fg,
  border,
  interactive = false,
  onClick,
}: {
  text: string;
  position: Vec3;
  scale?: number;
  bg?: string;
  fg?: string;
  border?: string;
  interactive?: boolean;
  onClick?: (e: { stopPropagation: () => void }) => void;
}) {
  const tex = React.useMemo(() => makeLabelTexture(text, { bg, fg, border }), [text, bg, fg, border]);
  return (
    <sprite
      position={position}
      scale={[scale, scale, 1]}
      renderOrder={999}
      raycast={interactive ? undefined : () => null}
      onClick={interactive && onClick ? onClick : undefined}
    >
      <spriteMaterial map={tex} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}


// ---------- Helper part (menyeragamkan material & shadow) ----------
interface PartProps {
  pos?: Vec3;
  rot?: Vec3;
  color: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  flat?: boolean; // matikan shading halus (untuk permukaan low-poly)
}

function matProps(p: PartProps) {
  return {
    color: p.color,
    roughness: p.roughness ?? 0.75,
    metalness: p.metalness ?? 0,
    emissive: p.emissive ?? "#000000",
    emissiveIntensity: p.emissiveIntensity ?? 0,
    flatShading: p.flat ?? false,
  };
}

function BoxPart({ pos, rot, size, ...m }: PartProps & { size: Vec3 }) {
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial {...matProps(m)} />
    </mesh>
  );
}

function CylPart({
  pos,
  rot,
  size,
  ...m
}: PartProps & { size: [number, number, number, number?] }) {
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[size[0], size[1], size[2], size[3] ?? 16]} />
      <meshStandardMaterial {...matProps(m)} />
    </mesh>
  );
}

function ConePart({
  pos,
  rot,
  size,
  ...m
}: PartProps & { size: [number, number, number?] }) {
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <coneGeometry args={[size[0], size[1], size[2] ?? 16]} />
      <meshStandardMaterial {...matProps(m)} />
    </mesh>
  );
}

function SpherePart({
  pos,
  size,
  ...m
}: PartProps & { size: [number, number?, number?] }) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <sphereGeometry args={[size[0], size[1] ?? 20, size[2] ?? 14]} />
      <meshStandardMaterial {...matProps(m)} />
    </mesh>
  );
}

function KnotPart({ pos, size, ...m }: PartProps & { size: [number, number, number?, number?] }) {
  return (
    <mesh position={pos} castShadow receiveShadow>
      <torusKnotGeometry args={[size[0], size[1], size[2] ?? 140, size[3] ?? 22]} />
      <meshStandardMaterial {...matProps(m)} />
    </mesh>
  );
}

function TorusPart({
  pos,
  rot,
  size,
  ...m
}: PartProps & { size: [number, number, number?, number?] }) {
  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      <torusGeometry args={[size[0], size[1], size[2] ?? 14, size[3] ?? 48]} />
      <meshStandardMaterial {...matProps(m)} />
    </mesh>
  );
}

// Type util untuk elemen mesh R3F (dipakai bila perlu memperluas props)
export type R3FMeshProps = ThreeElements["mesh"];

// ---------- Peta slug → model prosedural ----------
export type ProceduralKey = "rumah-gadang" | "joglo" | "saron" | "generic";

export const PROCEDURAL_SLUG_MAP: Record<string, ProceduralKey> = {
  "rumah-gadang": "rumah-gadang",
  joglo: "joglo",
  "gamelan-jawa": "saron",
};
/** Fallback aman bila slug tidak dikenal. */
export const DEFAULT_PROCEDURAL: ProceduralKey = "generic";

/** Posisi X (kiri→kanan) 7 bilah saron — dipakai ulang untuk label & audio. */
export const SARON_KEY_XS = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75] as const;

// ============================================================
// 1) Rumah Gadang (Minangkabau) — badan di atas tiang, atap gonjong
// ============================================================
export function ProceduralRumahGadang() {
  const stiltXs: number[] = [-1.35, -0.45, 0.45, 1.35];
  const windowXs: number[] = [-1.05, -0.35, 0.35, 1.05];

  return (
    <group name="rumah-gadang">
      {/* Tiang panggung (8) */}
      {stiltXs.map((x) =>
        [-0.55, 0.55].map((z) => (
          <CylPart
            key={`stilt-${x}-${z}`}
            pos={[x, 0.25, z]}
            size={[0.05, 0.055, 0.5, 10]}
            color={C.woodDark}
            roughness={0.85}
          />
        )),
      )}
      {/* Balok pengaku bawah */}
      {[-0.55, 0.55].map((z) => (
        <BoxPart key={`beam-${z}`} pos={[0, 0.44, z]} size={[2.95, 0.07, 0.09]} color={C.woodDark} />
      ))}
      {/* Lantai */}
      <BoxPart pos={[0, 0.545, 0]} size={[3.1, 0.09, 1.42]} color={C.wood} roughness={0.7} />
      {/* Badan rumah */}
      <BoxPart pos={[0, 1.0, 0]} size={[2.9, 0.82, 1.22]} color={C.woodWall} roughness={0.72} />
      {/* Lis dinding bawah & atas */}
      <BoxPart pos={[0, 0.63, 0]} size={[2.96, 0.08, 1.28]} color={C.woodDark} />
      <BoxPart pos={[0, 1.37, 0]} size={[2.96, 0.08, 1.28]} color={C.woodDark} />
      {/* Jendela depan (4) */}
      {windowXs.map((x) => (
        <BoxPart
          key={`win-${x}`}
          pos={[x, 1.05, 0.625]}
          size={[0.26, 0.3, 0.03]}
          color={C.opening}
          roughness={0.5}
        />
      ))}
      {/* Pintu tengah */}
      <BoxPart pos={[0, 0.93, 0.625]} size={[0.3, 0.52, 0.03]} color={C.woodDarkest} />
      {/* Atap pelana kiri-kanan (bentuk pelana/pendek) */}
      <BoxPart
        pos={[-0.72, 1.68, 0]}
        rot={[0, 0, 0.3]}
        size={[1.62, 0.07, 1.5]}
        color={C.ijuk}
        roughness={0.95}
      />
      <BoxPart
        pos={[0.72, 1.68, 0]}
        rot={[0, 0, -0.3]}
        size={[1.62, 0.07, 1.5]}
        color={C.ijuk}
        roughness={0.95}
      />
      {/* Nok atap tengah */}
      <BoxPart pos={[0, 1.82, 0]} size={[0.42, 0.12, 1.52]} color={C.ijuk} roughness={0.95} />
      {/* Gonjong ujung (2, besar, melengkung keluar) */}
      <ConePart
        pos={[-1.55, 1.78, 0]}
        rot={[0, 0, 0.55]}
        size={[0.16, 0.6, 12]}
        color={C.ijuk}
        roughness={0.95}
        flat
      />
      <ConePart
        pos={[1.55, 1.78, 0]}
        rot={[0, 0, -0.55]}
        size={[0.16, 0.6, 12]}
        color={C.ijuk}
        roughness={0.95}
        flat
      />
      {/* Gonjong tengah (2, kecil) */}
      <ConePart
        pos={[-0.55, 1.98, 0]}
        rot={[0, 0, 0.28]}
        size={[0.12, 0.42, 12]}
        color={C.ijuk}
        roughness={0.95}
        flat
      />
      <ConePart
        pos={[0.55, 1.98, 0]}
        rot={[0, 0, -0.28]}
        size={[0.12, 0.42, 12]}
        color={C.ijuk}
        roughness={0.95}
        flat
      />
      {/* Gonjong belakang-depan (2, arah Z agar siluet kaya) */}
      <ConePart
        pos={[0, 1.9, 0.62]}
        rot={[0.3, 0, 0]}
        size={[0.1, 0.36, 12]}
        color={C.ijuk}
        roughness={0.95}
        flat
      />
      <ConePart
        pos={[0, 1.9, -0.62]}
        rot={[-0.3, 0, 0]}
        size={[0.1, 0.36, 12]}
        color={C.ijuk}
        roughness={0.95}
        flat
      />
      {/* Tangga tengah (3 anak tangga) */}
      {[0.48, 0.32, 0.16].map((y, i) => (
        <BoxPart
          key={`step-${i}`}
          pos={[0, y, 0.84 + i * 0.13]}
          size={[0.44, 0.05, 0.16]}
          color={C.wood}
          roughness={0.75}
        />
      ))}
      {/* Pegangan tangga (2) */}
      {[-0.26, 0.26].map((x) => (
        <BoxPart
          key={`rail-${x}`}
          pos={[x, 0.32, 0.98]}
          rot={[0.9, 0, 0]}
          size={[0.05, 0.06, 0.62]}
          color={C.woodDark}
        />
      ))}
    </group>
  );
}

// ============================================================
// 2) Joglo (Jawa) — 4 saka guru + tumpang sari + pendopo luar
// ============================================================
export function ProceduralJoglo() {
  const sakaPos: Vec3[] = [
    [-0.72, 0.89, -0.52],
    [-0.72, 0.89, 0.52],
    [0.72, 0.89, -0.52],
    [0.72, 0.89, 0.52],
  ];
  const outerCols: Vec3[] = [
    [-1.45, 0.76, -0.95],
    [-1.45, 0.76, 0],
    [-1.45, 0.76, 0.95],
    [0, 0.76, -0.95],
    [0, 0.76, 0.95],
    [1.45, 0.76, -0.95],
    [1.45, 0.76, 0],
    [1.45, 0.76, 0.95],
  ];

  return (
    <group name="joglo">
      {/* Lantai batu 2 tingkat */}
      <BoxPart pos={[0, 0.07, 0]} size={[3.4, 0.14, 2.5]} color={C.stone} roughness={0.95} />
      <BoxPart pos={[0, 0.2, 0]} size={[2.7, 0.12, 2.0]} color={C.stoneLight} roughness={0.95} />
      {/* Saka guru (4 tiang induk) */}
      {sakaPos.map((p, i) => (
        <CylPart key={`saka-${i}`} pos={p} size={[0.085, 0.095, 1.25, 14]} color={C.woodDark} roughness={0.8} />
      ))}
      {/* Ring balok (borek) di atas saka guru */}
      {[-0.52, 0.52].map((z) => (
        <BoxPart key={`bx-${z}`} pos={[0, 1.53, z]} size={[1.62, 0.09, 0.09]} color={C.woodDarkest} />
      ))}
      {[-0.72, 0.72].map((x) => (
        <BoxPart key={`bz-${x}`} pos={[x, 1.53, 0]} size={[0.09, 0.09, 1.1]} color={C.woodDarkest} />
      ))}
      {/* Kolom pendopo luar (8) */}
      {outerCols.map((p, i) => (
        <CylPart key={`col-${i}`} pos={p} size={[0.06, 0.07, 1.0, 12]} color={C.wood} roughness={0.8} />
      ))}
      {/* Ring kolom luar */}
      <BoxPart pos={[0, 1.29, 0]} size={[3.05, 0.06, 2.05]} color={C.woodDark} roughness={0.85} />
      {/* Atap pendopo luar (limas lebar, ijuk) */}
      <ConePart
        pos={[0, 1.59, 0]}
        rot={[0, Math.PI / 4, 0]}
        size={[2.1, 0.62, 4]}
        color={C.ijuk}
        roughness={0.95}
        flat
      />
      {/* Tumpang sari: 3 tumpuk mengecil */}
      <BoxPart pos={[0, 1.6, 0]} size={[1.75, 0.13, 1.3]} color={C.woodDark} roughness={0.78} />
      <BoxPart pos={[0, 1.72, 0]} size={[1.4, 0.11, 1.05]} color={C.woodDarkest} roughness={0.78} />
      <BoxPart pos={[0, 1.83, 0]} size={[1.05, 0.1, 0.82]} color={C.woodDark} roughness={0.78} />
      {/* Mustaka: piramida atas + bebenah emas */}
      <ConePart
        pos={[0, 2.1, 0]}
        rot={[0, Math.PI / 4, 0]}
        size={[0.62, 0.46, 4]}
        color={C.ijuk}
        roughness={0.95}
        flat
      />
      <SpherePart pos={[0, 2.37, 0]} size={[0.05, 12, 10]} color={C.gold} metalness={0.85} roughness={0.3} />
    </group>
  );
}

// ============================================================
// 3) Saron (gamelan) — bilah perunggu interaktif
//    props: onNote(index), activeNote(index | null)
// ============================================================
const SARON_BAR_Y = 0.535;

interface SaronBarProps {
  index: number;
  x: number;
  active: boolean;
  interactive: boolean;
  onNote?: (index: number) => void;
}

function SaronBar({ index, x, active, interactive, onNote }: SaronBarProps) {
  const meshRef = React.useRef<THREE.Mesh | null>(null);
  const matRef = React.useRef<THREE.MeshStandardMaterial | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const targetY = active ? SARON_BAR_Y + 0.05 : SARON_BAR_Y;
  const targetEmissive = active ? 0.7 : 0;

  // Render ulang saat activeNote berubah (frameloop demand).
  React.useEffect(() => {
    invalidate();
  }, [active, invalidate]);

  // Animasi kecil: bilah naik + menyala saat aktif (lerp, invalidate selama bergerak).
  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const k = Math.min(1, dt * 14);
    let moving = false;
    if (Math.abs(mesh.position.y - targetY) > 0.001) {
      mesh.position.y += (targetY - mesh.position.y) * k;
      moving = true;
    }
    const mat = matRef.current;
    if (mat && Math.abs(mat.emissiveIntensity - targetEmissive) > 0.01) {
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * k;
      moving = true;
    }
    if (moving) invalidate();
  });

  return (
    <mesh
      ref={meshRef}
      position={[x, SARON_BAR_Y, 0]}
      castShadow
      userData={{ noteIndex: index }}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onNote?.(index);
      }}
      onPointerOver={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (!interactive) return;
        document.body.style.cursor = "";
      }}
    >
      <boxGeometry args={[0.18, 0.045, 0.44]} />
      <meshStandardMaterial
        ref={matRef}
        color={C.bronze}
        metalness={0.9}
        roughness={0.32}
        emissive={C.gold}
        emissiveIntensity={0}
      />
    </mesh>
  );
}

export interface ProceduralSaronProps {
  onNote?: (index: number) => void;
  activeNote?: number | null;
}

export function ProceduralSaron({ onNote, activeNote = null }: ProceduralSaronProps) {
  const interactive = typeof onNote === "function";

  React.useEffect(() => {
    return () => {
      // Reset kursor bila komponen dilepas saat hover aktif.
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <group name="saron">
      {/* Kaki (2 blok) */}
      {[-0.78, 0.78].map((x) => (
        <BoxPart key={`foot-${x}`} pos={[x, 0.08, 0]} size={[0.14, 0.16, 0.52]} color={C.woodDarkest} />
      ))}
      {/* Balok resonator */}
      <BoxPart pos={[0, 0.31, 0]} size={[1.9, 0.3, 0.5]} color={C.wood} roughness={0.7} />
      {/* Bibir atas resonator */}
      <BoxPart pos={[0, 0.485, 0]} size={[1.94, 0.05, 0.56]} color={C.woodDark} roughness={0.75} />
      {/* Garis aksen perunggu di sisi */}
      {[-0.27, 0.27].map((z) => (
        <BoxPart
          key={`trim-${z}`}
          pos={[0, 0.38, z]}
          size={[1.9, 0.04, 0.03]}
          color={C.bronze}
          metalness={0.85}
          roughness={0.35}
        />
      ))}
      {/* 7 bilah perunggu (interaktif) */}
      {SARON_KEY_XS.map((x, i) => (
        <SaronBar
          key={`bar-${i}`}
          index={i}
          x={x}
          active={activeNote === i}
          interactive={interactive}
          onNote={onNote}
        />
      ))}
      {/* 2 tabuh kayu di sisi kanan */}
      {[0.16, -0.02].map((z, i) => (
        <group key={`tabuh-${i}`} position={[1.08, 0.53, z]} rotation={[0, 0.35, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 0.42, 10]} />
            <meshStandardMaterial color={C.woodDark} roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0.21, 0, 0]}>
            <sphereGeometry args={[0.048, 14, 10]} />
            <meshStandardMaterial color={C.woodDarkest} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================
// 4) Generic — bentuk abstrak elegan (fallback)
// ============================================================
export function ProceduralGeneric() {
  return (
    <group name="generic">
      {/* Pedestal batu */}
      <CylPart pos={[0, 0.11, 0]} size={[0.5, 0.56, 0.22, 24]} color={C.stone} roughness={0.9} />
      <CylPart pos={[0, 0.31, 0]} size={[0.38, 0.42, 0.18, 24]} color={C.stoneLight} roughness={0.9} />
      {/* Ring emas */}
      <TorusPart
        pos={[0, 0.42, 0]}
        rot={[-Math.PI / 2, 0, 0]}
        size={[0.44, 0.018, 12, 48]}
        color={C.gold}
        metalness={0.85}
        roughness={0.3}
      />
      {/* Torus knot perunggu */}
      <KnotPart
        pos={[0, 1.02, 0]}
        size={[0.34, 0.11, 150, 24]}
        color={C.bronze}
        metalness={0.92}
        roughness={0.28}
      />
      {/* Aksen ikosahedron kecil */}
      <mesh position={[0, 1.02, 0]} scale={0.16} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={C.gold} metalness={0.85} roughness={0.3} flatShading />
      </mesh>
    </group>
  );
}

// ---------- Pemilih model prosedural ----------
export function ProceduralModel({ slugKey }: { slugKey: ProceduralKey }) {
  switch (slugKey) {
    case "rumah-gadang":
      return <ProceduralRumahGadang />;
    case "joglo":
      return <ProceduralJoglo />;
    case "saron":
      return <ProceduralSaron />;
    default:
      return <ProceduralGeneric />;
  }
}
