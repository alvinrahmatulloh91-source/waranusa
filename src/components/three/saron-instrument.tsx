"use client";

/**
 * WaraNusa — Saron virtual interaktif (dipakai halaman instrumen publik).
 *
 * - Membuat <Canvas> sendiri (±380px) berisi ProceduralSaron yang interaktif:
 *   klik/ketuk bilah → playNote(index), bilah aktif terangkat + emissive emas.
 * - Laras PELOG 7 nada. CATATAN: frekuensi laras pelog sesungguhnya TIDAK
 *   temperamen sama; deret di bawah adalah pendekatan demo yang musikal.
 * - Audio via singleton saronAudio (Web Audio API, audio sintetis).
 * - Keyboard: tombol 1–7 memainkan nada (diabaikan saat fokus di input).
 * - Aksesibilitas: role="application", tombol nada alternatif, aria-live.
 */

import * as React from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Info, Play, Square, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProceduralSaron, SARON_KEY_XS, SpriteLabel } from "@/components/three/procedural-models";
import { saronAudio } from "@/components/three/saron-audio";

/** Frekuensi (Hz) 7 nada pelog — pendekatan demo, tidak temperamen sama. */
export const PELOG_FREQUENCIES = [261.63, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33] as const;

/** Label nada 1–7 (notasi kepatkahan). */
export const PELOG_LABELS = ["1", "2", "3", "4", "5", "6", "7"] as const;

/** Urutan nada contoh (indeks 0-based) untuk tombol demo. */
const DEMO_SEQUENCE = [0, 1, 2, 4, 5, 4, 2, 1, 0] as const;
const DEMO_INTERVAL_MS = 350;
const NOTE_HOLD_MS = 250;

function AutoInvalidate() {
  // Memaksa render satu frame setiap kali tree scene dirender ulang
  // (mode frameloop="demand").
  const invalidate = useThree((s) => s.invalidate);
  React.useEffect(() => {
    invalidate();
  });
  return null;
}

export interface SaronInstrumentProps {
  /** Volume awal 0..1 (default 0.7). */
  volume?: number;
}

export function SaronInstrument({ volume = 0.7 }: SaronInstrumentProps) {
  const [vol, setVol] = React.useState(volume);
  const [activeNote, setActiveNote] = React.useState<number | null>(null);
  const [playingDemo, setPlayingDemo] = React.useState(false);
  const noteTimer = React.useRef<number | null>(null);
  const demoTimer = React.useRef<number | null>(null);
  const volRef = React.useRef(volume);

  // Sinkronkan bila prop volume berubah dari luar.
  React.useEffect(() => {
    volRef.current = volume;
    setVol(volume);
    saronAudio.updateVolume(volume);
  }, [volume]);

  const playNote = React.useCallback((index: number) => {
    const freq = PELOG_FREQUENCIES[index];
    if (typeof freq !== "number") return;
    saronAudio.playNote(freq, volRef.current);
    setActiveNote(index);
    if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setActiveNote(null), NOTE_HOLD_MS);
  }, []);

  const updateVolume = React.useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    volRef.current = clamped;
    setVol(clamped);
    saronAudio.updateVolume(clamped);
  }, []);

  // ---------- Demo melodi ----------
  const stopDemo = React.useCallback(() => {
    if (demoTimer.current !== null) {
      window.clearTimeout(demoTimer.current);
      demoTimer.current = null;
    }
    setPlayingDemo(false);
  }, []);

  const startDemo = React.useCallback(() => {
    if (demoTimer.current !== null) {
      window.clearTimeout(demoTimer.current);
      demoTimer.current = null;
    }
    setPlayingDemo(true);
    let step = 0;
    const tick = () => {
      const idx = DEMO_SEQUENCE[step];
      if (typeof idx === "number") playNote(idx);
      step += 1;
      if (step >= DEMO_SEQUENCE.length) {
        demoTimer.current = window.setTimeout(() => {
          demoTimer.current = null;
          setPlayingDemo(false);
        }, 550);
        return;
      }
      demoTimer.current = window.setTimeout(tick, DEMO_INTERVAL_MS);
    };
    tick();
  }, [playNote]);

  // ---------- Keyboard 1–7 ----------
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const idx = PELOG_LABELS.indexOf(e.key as (typeof PELOG_LABELS)[number]);
      if (idx >= 0) playNote(idx);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playNote]);

  // ---------- Cleanup ----------
  React.useEffect(() => {
    return () => {
      if (noteTimer.current !== null) window.clearTimeout(noteTimer.current);
      if (demoTimer.current !== null) window.clearTimeout(demoTimer.current);
      saronAudio.dispose();
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <section aria-label="Saron virtual" className="w-full">
      {/* Panggung 3D */}
      <div
        role="application"
        aria-label="Saron virtual — klik bilah untuk membunyikan"
        className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-brand-line bg-brand-soft shadow-sm"
      >
        <Canvas
          shadows="soft"
          dpr={[1, 2]}
          camera={{ position: [0, 1.35, 2.9], fov: 40 }}
          frameloop="demand"
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.75} />
          <directionalLight
            position={[3, 5, 3]}
            intensity={1.15}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-3}
            shadow-camera-right={3}
            shadow-camera-top={3}
            shadow-camera-bottom={-3}
            shadow-camera-near={0.5}
            shadow-camera-far={15}
            shadow-bias={-0.0004}
          />
          <spotLight position={[-3, 4, -2]} intensity={26} angle={0.6} penumbra={1} color="#FFF3DC" />

          <group position={[0, -0.45, 0]}>
            <ProceduralSaron onNote={playNote} activeNote={activeNote} />
            {/* Label nomor di atas tiap bilah (sprite, non-interaktif) */}
            {SARON_KEY_XS.map((x, i) => (
              <SpriteLabel
                key={`label-${i}`}
                text={PELOG_LABELS[i]}
                position={[x, 0.72, 0]}
                scale={0.2}
                bg="#FFFFFF"
                border="#E1EBE8"
              />
            ))}
          </group>

          {/* Lantai lingkaran */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, 0]}>
            <circleGeometry args={[2.4, 48]} />
            <meshStandardMaterial color="#F3F8F7" roughness={1} metalness={0} />
          </mesh>

          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            minPolarAngle={0.7}
            maxPolarAngle={1.4}
            enableDamping
            dampingFactor={0.08}
          />
          <AutoInvalidate />
        </Canvas>

        <Badge
          variant="outline"
          className="absolute right-3 top-3 border-brand-line bg-white/90 text-[10px] font-medium text-muted-foreground backdrop-blur"
        >
          Web Audio API — audio sintetis
        </Badge>
      </div>

      {/* Pengumuman nada untuk pembaca layar */}
      <span aria-live="polite" className="sr-only">
        {activeNote !== null ? `Nada ${PELOG_LABELS[activeNote]} dibunyikan` : ""}
      </span>

      {/* Petunjuk */}
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-brand-teal" aria-hidden />
        Klik bilah atau tekan tombol angka 1–7. Seret untuk memutar pandangan.
      </p>

      {/* Kontrol */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2.5">
          <Volume2 className="h-4 w-4 shrink-0 text-brand-ink" aria-hidden />
          <Slider
            value={[Math.round(vol * 100)]}
            min={0}
            max={100}
            step={1}
            aria-label="Volume saron"
            onValueChange={(v) => updateVolume((v[0] ?? 70) / 100)}
            className="w-32 sm:w-40"
          />
          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
            {Math.round(vol * 100)}%
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          variant={playingDemo ? "secondary" : "default"}
          onClick={playingDemo ? stopDemo : startDemo}
          aria-label={playingDemo ? "Hentikan demo melodi" : "Mainkan demo melodi"}
          className="min-w-32"
        >
          {playingDemo ? (
            <Square className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden />
          )}
          {playingDemo ? "Hentikan" : "Demo Melodi"}
        </Button>

        {/* Tombol nada alternatif (aksesibel tanpa raycast) */}
        <div className="flex items-center gap-1.5" role="group" aria-label="Tombol nada pelog">
          {PELOG_LABELS.map((label, i) => (
            <Button
              key={label}
              type="button"
              variant={activeNote === i ? "default" : "outline"}
              size="icon"
              aria-label={`Mainkan nada ${label}`}
              onClick={() => playNote(i)}
              className={`h-9 w-9 rounded-full text-xs font-bold ${
                activeNote === i
                  ? "bg-brand-gold text-brand-ink hover:bg-brand-gold"
                  : "border-brand-line text-brand-ink hover:bg-brand-soft"
              }`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Keterbukaan jujur soal audio & laras */}
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Tombol &quot;Demo Melodi&quot; memainkan urutan nada contoh, bukan lagu tradisional spesifik.
        Laras pelog sesungguhnya tidak temperamen sama — frekuensi di sini adalah pendekatan demo
        untuk sintesis metalofon.
      </p>
    </section>
  );
}
