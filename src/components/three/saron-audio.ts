"use client";

/**
 * WaraNusa — Mesin audio sintetis metalofon (gaya saron gamelan).
 *
 * Singleton `saronAudio`:
 *  - AudioContext dibuat LAZY pada interaksi pertama (kebijakan autoplay browser).
 *  - playNote(freq, volume): sintesis 3 oscillator parsial (f, f*2.76, f*5.4)
 *    dengan envelope attack 5ms + decay eksponensial 1.4s / 0.6s / 0.25s,
 *    detune ±3 cent, lowpass 8kHz, plus noise burst 20ms sebagai "strike".
 *  - Semua node di-disconnect setelah suara berhenti.
 *  - dispose() menutup AudioContext (dipanggil saat unmount).
 *
 * Catatan akustik: frekuensi laras pelog sesungguhnya tidak temperamen sama;
 * deret nada di SaronInstrument adalah pendekatan demo yang enak didengar.
 */

type StopFn = () => void;

interface PartialSpec {
  mult: number;
  decay: number;
  gain: number;
  detune: number;
}

const PARTIALS: PartialSpec[] = [
  { mult: 1, decay: 1.4, gain: 1.0, detune: -3 },
  { mult: 2.76, decay: 0.6, gain: 0.45, detune: 2 },
  { mult: 5.4, decay: 0.25, gain: 0.18, detune: -2 },
];

const ATTACK = 0.005;
const VOICE_TAIL = 0.15; // jeda ekstra sebelum node dibersihkan
const PEAK = 0.3;

class SaronAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.7;
  private activeCleanups = new Set<StopFn>();

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const w = window as Window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) throw new Error("Web Audio API tidak didukung browser ini.");
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** Mainkan satu nada. Aman dipanggil dari handler interaksi pengguna. */
  playNote(freq: number, volume?: number): void {
    try {
      const ctx = this.ensureContext();
      const master = this.master;
      if (!master) return;
      if (typeof volume === "number") {
        this.volume = Math.min(1, Math.max(0, volume));
        master.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.01);
      }

      const t0 = ctx.currentTime + 0.001;
      const stopFns: StopFn[] = [];

      // Rantai voice → lowpass 8kHz → master
      const voice = ctx.createGain();
      voice.gain.value = 1;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 8000;
      lowpass.Q.value = 0.5;
      voice.connect(lowpass);
      lowpass.connect(master);

      // Tiga oscillator parsial dengan envelope masing-masing
      for (const p of PARTIALS) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * p.mult;
        osc.detune.value = p.detune;

        const g = ctx.createGain();
        const peak = PEAK * p.gain;
        const end = t0 + ATTACK + p.decay;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(peak, t0 + ATTACK);
        g.gain.exponentialRampToValueAtTime(0.0001, end);

        osc.connect(g);
        g.connect(voice);
        osc.start(t0);
        osc.stop(end + 0.02);
        osc.onended = () => {
          osc.disconnect();
          g.disconnect();
        };
        stopFns.push(() => {
          try {
            osc.onended = null;
            osc.stop();
          } catch {
            // oscillator sudah berhenti — abaikan
          }
          osc.disconnect();
          g.disconnect();
        });
      }

      // Noise burst pendek (dentum tabuh)
      const noiseDur = 0.02;
      const frameCount = Math.max(1, Math.floor(ctx.sampleRate * noiseDur));
      const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 2400;
      band.Q.value = 1;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.22;
      noise.connect(band);
      band.connect(noiseGain);
      noiseGain.connect(voice);
      noise.start(t0);
      noise.onended = () => {
        noise.disconnect();
        band.disconnect();
        noiseGain.disconnect();
      };
      stopFns.push(() => {
        try {
          noise.onended = null;
          noise.stop();
        } catch {
          // buffer sudah selesai — abaikan
        }
        noise.disconnect();
        band.disconnect();
        noiseGain.disconnect();
      });

      // Bersihkan rantai voice setelah seluruh envelope selesai
      const cleanup = () => {
        stopFns.forEach((fn) => fn());
        lowpass.disconnect();
        voice.disconnect();
        this.activeCleanups.delete(cleanup);
      };
      this.activeCleanups.add(cleanup);
      window.setTimeout(cleanup, (ATTACK + PARTIALS[0].decay + VOICE_TAIL) * 1000);
    } catch {
      // Audio tidak tersedia (mis. browser tanpa Web Audio) — diamkan.
    }
  }

  /** Ubah volume master (0..1). */
  updateVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.master && this.ctx && this.ctx.state !== "closed") {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  /** Hentikan semua suara & tutup AudioContext. */
  dispose(): void {
    this.activeCleanups.forEach((fn) => fn());
    this.activeCleanups.clear();
    if (this.ctx && this.ctx.state !== "closed") {
      void this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.master = null;
  }
}

/** Singleton — dipakai SaronInstrument. */
export const saronAudio = new SaronAudio();
