"use client";

/**
 * WaraNusa — InstrumentView (#/instrumen)
 * Instrumen musik virtual. Saat ini: Gamelan Saron (Jawa) via SaronInstrument
 * (rekan agent 2-d). Angklung & Rebab ditampilkan jujur sebagai "Segera/Rencana".
 */
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  Info,
  Keyboard,
  Music2,
  MousePointerClick,
  Volume2,
  Waves,
} from "lucide-react";
import type { Route } from "@/lib/router";
import { api } from "@/lib/api-client";
import { useAsyncData } from "@/hooks/use-async-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { SectionHeading } from "@/components/shared/states";
import { SaronInstrument } from "@/components/three/saron-instrument";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InstrumentId = "saron" | "angklung" | "rebab";

const INSTRUMENTS: Array<{
  id: InstrumentId;
  name: string;
  region: string;
  badge?: string;
  available: boolean;
  desc: string;
}> = [
  {
    id: "saron",
    name: "Gamelan Saron",
    region: "Jawa",
    available: true,
    desc: "Bilah perunggu pelog — mainkan langsung lewat sentuhan atau keyboard.",
  },
  {
    id: "angklung",
    name: "Angklung",
    region: "Jawa Barat",
    badge: "Segera",
    available: false,
    desc: "Angklung bambu bernada ganda; sedang disiapkan dengan sampel audio berlisensi.",
  },
  {
    id: "rebab",
    name: "Rebab",
    region: "Busur virtual",
    badge: "Rencana",
    available: false,
    desc: "Rebab dua senar peloplayer; membutuhkan sintesis busur yang lebih kompleks.",
  },
];

export default function InstrumentView({ route }: { route: Route }) {
  const [active, setActive] = useState<InstrumentId>("saron");
  const [volume, setVolume] = useState(0.7);

  const gamelanItem = useAsyncData(() => api.items.detail("gamelan-jawa"), []);

  // Deep-link ?instrumen=angklung dsb. → sampaikan dengan jujur bahwa belum tersedia
  useEffect(() => {
    const requested = route.query.instrumen;
    if (requested && requested !== "saron") {
      const found = INSTRUMENTS.find((i) => i.id === requested);
      if (found && !found.available) {
        toast.info("Sedang dalam pengembangan", {
          description: `${found.name} (${found.region}) belum tersedia. Nikmati Gamelan Saron terlebih dahulu.`,
        });
      }
    }
    // Hanya sekali saat halaman dibuka
  }, []);

  const activeInstrument = INSTRUMENTS.find((i) => i.id === active) ?? INSTRUMENTS[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      {/* ============ HERO KECIL ============ */}
      <SectionHeading
        eyebrow="Ruang permainan"
        title="Instrumen Musik Virtual"
        description="Kenali bunyi dan mekanika instrumen nusantara lewat replika digital yang bisa dimainkan langsung."
      />
      <Alert className="mt-6 rounded-2xl border-brand-gold/40 bg-brand-gold/10">
        <Info className="h-4 w-4 text-brand-orange" aria-hidden="true" />
        <AlertTitle className="text-sm font-bold text-brand-ink">Tentang audio instrumen virtual</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          Audio pada instrumen virtual dibangkitkan secara sintetis melalui Web Audio API sebagai demo
          pembelajaran — bukan rekaman autentik. Rekaman asli akan dimasukkan dengan lisensi yang jelas.
        </AlertDescription>
      </Alert>

      {/* ============ PEMILIH INSTRUMEN ============ */}
      <div
        className="mt-8 grid gap-4 md:grid-cols-3"
        role="tablist"
        aria-label="Pilih instrumen"
      >
        {INSTRUMENTS.map((inst) => {
          const isActive = inst.id === active && inst.available;
          return (
            <button
              key={inst.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={!inst.available}
              onClick={() => {
                if (inst.available) setActive(inst.id);
                else toast.info("Sedang dalam pengembangan", { description: `${inst.name} belum dapat dimainkan.` });
              }}
              className={cn(
                "min-h-[44px] rounded-2xl border p-4 text-left transition-all",
                isActive
                  ? "border-brand-teal bg-brand-teal/5 shadow-sm ring-1 ring-brand-teal"
                  : "border-brand-line bg-card hover:border-brand-teal/40",
                !inst.available && "cursor-not-allowed opacity-70 hover:border-brand-line"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-bold text-brand-ink">
                  <Music2 className={cn("h-4 w-4", isActive ? "text-brand-teal" : "text-muted-foreground")} aria-hidden="true" />
                  {inst.name}
                </span>
                {inst.badge && (
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide">
                    {inst.badge}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs font-semibold text-brand-sea">{inst.region}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{inst.desc}</p>
            </button>
          );
        })}
      </div>

      {/* ============ SARON ============ */}
      {activeInstrument.id === "saron" && (
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* Panggung instrumen */}
          <Card className="rounded-3xl border-brand-line lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-brand-ink">
                <Waves className="h-5 w-5 text-brand-teal" aria-hidden="true" />
                Gamelan Saron — Laras Pelog
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Ketuk atau klik bilah di bawah. Bila tampilan 3D tidak muncul, peramban Anda mungkin
                tidak mendukung WebGL — panel informasi di samping tetap dapat digunakan.
              </p>
            </CardHeader>
            <CardContent>
              <SaronInstrument volume={volume} />
            </CardContent>
          </Card>

          {/* Panel kontrol & info */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-3xl border-brand-line">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-brand-ink">Cara Memainkan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm text-foreground/85">
                  <li className="flex items-start gap-2.5">
                    <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" aria-hidden="true" />
                    Klik atau ketuk bilah saron dengan kursor/jari untuk memainkan nadanya.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Keyboard className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" aria-hidden="true" />
                    Gunakan tombol angka <kbd className="rounded border border-brand-line bg-brand-soft px-1.5 py-0.5 font-mono text-xs">1</kbd>–
                    <kbd className="rounded border border-brand-line bg-brand-soft px-1.5 py-0.5 font-mono text-xs">7</kbd> pada keyboard.
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" aria-hidden="true" />
                    Atur kenyaringan dengan penggeser di bawah ini.
                  </li>
                </ol>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="volume-saron" className="text-sm font-semibold">
                      Volume
                    </Label>
                    <span className="text-sm font-bold text-brand-teal" aria-live="polite">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="volume-saron"
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={(v) => setVolume(v[0] ?? 0.7)}
                    aria-label="Kenyaringan saron"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-brand-line">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-brand-ink">Tentang Saron</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Saron adalah instrumen bilah perunggu pada ansambel gamelan Jawa yang berlaras{" "}
                  <strong className="font-semibold text-foreground">pelog</strong>. Ia memainkan{" "}
                  <strong className="font-semibold text-foreground">balungan</strong> — kerangka melodi
                  utama yang diikuti instrumen lain saat berugu (tempong) berganti.
                </p>
                <Separator className="bg-brand-line" />
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-brand-ink">
                    <BookOpen className="h-4 w-4 text-brand-sea" aria-hidden="true" />
                    Sumber
                  </p>
                  <ul className="mt-1.5 space-y-1.5 text-xs">
                    <li>
                      <a
                        href="https://id.wikipedia.org/wiki/Gamelan"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-brand-teal underline-offset-2 hover:underline"
                      >
                        Wikipedia — Gamelan <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </li>
                    <li className="text-muted-foreground">
                      Catatan: audio halaman ini disintesis via Web Audio API (demo pembelajaran),
                      bukan rekaman gamelan autentik.
                    </li>
                  </ul>
                </div>
                <Button
                  asChild
                  className="min-h-[44px] w-full rounded-full bg-brand-sea font-bold text-white hover:bg-brand-sea/90"
                >
                  <a href="#/budaya/gamelan-jawa">
                    Buka objek Gamelan Jawa
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Placeholder ramah untuk instrumen nonaktif (bila di-query langsung) */}
      {activeInstrument.id !== "saron" && (
        <Card className="mt-8 rounded-3xl border-dashed border-brand-line">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Music2 className="h-8 w-8 text-brand-teal/50" aria-hidden="true" />
            <p className="font-bold text-brand-ink">{activeInstrument.name} belum tersedia</p>
            <p className="max-w-md text-sm text-muted-foreground">{activeInstrument.desc}</p>
            <Button
              onClick={() => setActive("saron")}
              className="mt-2 min-h-[44px] rounded-full bg-brand-teal font-bold text-white hover:bg-brand-teal/90"
            >
              Mainkan Gamelan Saron
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info objek terkait (nyata dari API) */}
      {gamelanItem.data && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Pelajari lebih lanjut:{" "}
          <a
            href={`#/budaya/${gamelanItem.data.slug}`}
            className="font-bold text-brand-teal underline-offset-2 hover:underline"
          >
            {gamelanItem.data.title}
          </a>{" "}
          — {gamelanItem.data.summary.slice(0, 120)}
          {gamelanItem.data.summary.length > 120 ? "…" : ""}
        </p>
      )}
    </div>
  );
}
