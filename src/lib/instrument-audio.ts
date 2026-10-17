/**
 * InstrumentAudio — mesin suara sintetis Web Audio untuk alat musik tradisional.
 * Tidak membutuhkan file audio eksternal; semua suara disintesis secara real-time.
 */

export type SoundType = 'gamelan' | 'gong' | 'drum' | 'bamboo' | 'pluck' | 'wood' | 'frame'

export interface SoundParam {
  id: string
  label: string
  freq: number
  type: SoundType
  note: string
  param?: string
}

class InstrumentAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private melodyTimeouts: ReturnType<typeof setTimeout>[] = []
  /** Volume master (0-1); dipertahankan antar pembuatan AudioContext. */
  private storedVolume = 0.55

  /** Harus dipanggil dari gesture pengguna (klik) agar autoplay policy lolos. */
  ensure(): AudioContext {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.storedVolume
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /**
   * Atur volume master (0-1). Bila konteks audio belum ada, nilai disimpan
   * dan diterapkan saat konteks dibuat pertama kali.
   */
  setVolume(v: number) {
    this.storedVolume = Math.min(1, Math.max(0, v))
    if (this.master) this.master.gain.value = this.storedVolume
  }

  private now(): number {
    return this.ensure().currentTime
  }

  private noiseBuffer(duration = 0.3): AudioBuffer {
    const ctx = this.ensure()
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  private env(gain: GainNode, t0: number, peak: number, attack: number, decay: number) {
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t0 + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay)
  }

  private osc(
    freq: number,
    type: OscillatorType,
    t0: number,
    dur: number,
    peak: number,
    attack = 0.005,
    detune = 0
  ) {
    const ctx = this.ensure()
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    o.detune.setValueAtTime(detune, t0)
    const g = ctx.createGain()
    this.env(g, t0, peak, attack, dur)
    o.connect(g)
    g.connect(this.master!)
    o.start(t0)
    o.stop(t0 + attack + dur + 0.05)
  }

  /** Nada gamelan perunggu: partial inharmonis + decay panjang. */
  gamelan(freq: number) {
    const t0 = this.now()
    this.osc(freq, 'sine', t0, 1.4, 0.32)
    this.osc(freq * 2.76, 'sine', t0, 0.5, 0.1)
    this.osc(freq * 5.4, 'sine', t0, 0.28, 0.045)
    this.strikeNoise(0.05, 2600, 0.1)
  }

  /** Nada kayu (kolintang/gambang): lebih terang, decay sedang. */
  wood(freq: number) {
    const t0 = this.now()
    this.osc(freq, 'sine', t0, 0.5, 0.3)
    this.osc(freq * 3.01, 'sine', t0, 0.16, 0.08)
    this.osc(freq * 6.2, 'sine', t0, 0.08, 0.03)
    this.strikeNoise(0.03, 3400, 0.07)
  }

  /** Gong besar: serangan pelan, gema panjang, detune bergetar. */
  gong(freq: number) {
    const t0 = this.now()
    const ctx = this.ensure()
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(freq, t0)
    // getaran lembut pada intonasi
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 4.2
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 4
    lfo.connect(lfoGain)
    lfoGain.connect(o.detune)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(0.5, t0 + 0.06)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2)
    o.connect(g)
    g.connect(this.master!)
    o.start(t0)
    o.stop(t0 + 3.4)
    lfo.start(t0)
    lfo.stop(t0 + 3.4)
    this.osc(freq * 1.51, 'sine', t0, 2.4, 0.16, 0.06)
    this.osc(freq * 2.32, 'sine', t0, 1.4, 0.08, 0.06)
    this.strikeNoise(0.12, 900, 0.18)
  }

  private strikeNoise(dur: number, cutoff: number, peak: number) {
    const ctx = this.ensure()
    const t0 = this.now()
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer(dur)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = cutoff
    f.Q.value = 1.2
    const g = ctx.createGain()
    this.env(g, t0, peak, 0.002, dur)
    src.connect(f)
    f.connect(g)
    g.connect(this.master!)
    src.start(t0)
  }

  /** Gendang: pitch sweep + noise. param: low | mid | high | slap */
  drum(freq: number, param = 'mid') {
    const ctx = this.ensure()
    const t0 = this.now()
    if (param === 'slap') {
      this.strikeNoise(0.09, 1900, 0.24)
      this.osc(freq * 1.05, 'triangle', t0, 0.1, 0.16, 0.002)
      return
    }
    const decay = param === 'low' ? 0.55 : 0.3
    const peak = param === 'low' ? 0.5 : 0.38
    const o = ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(freq * 1.5, t0)
    o.frequency.exponentialRampToValueAtTime(freq, t0 + 0.07)
    const g = ctx.createGain()
    this.env(g, t0, peak, 0.003, decay)
    o.connect(g)
    g.connect(this.master!)
    o.start(t0)
    o.stop(t0 + decay + 0.1)
    this.strikeNoise(param === 'low' ? 0.04 : 0.03, param === 'low' ? 700 : 1600, 0.12)
  }

  /** Rebana/frame drum: membran tipis dengan klik. */
  frame(freq: number, param = 'mid') {
    const ctx = this.ensure()
    const t0 = this.now()
    const decay = param === 'low' ? 0.34 : 0.22
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(freq * 1.25, t0)
    o.frequency.exponentialRampToValueAtTime(freq, t0 + 0.045)
    const g = ctx.createGain()
    this.env(g, t0, 0.42, 0.003, decay)
    o.connect(g)
    g.connect(this.master!)
    o.start(t0)
    o.stop(t0 + decay + 0.1)
    this.strikeNoise(0.04, 2200, 0.14)
  }

  /** Angklung: 3-4 ledakan getar bambu berurutan. */
  bamboo(freq: number) {
    for (let i = 0; i < 4; i++) {
      const delay = i * 0.045
      const detune = (Math.random() - 0.5) * 30
      setTimeout(() => {
        const t0 = this.now()
        this.osc(freq, 'triangle', t0, 0.16, 0.2, 0.004, detune)
        this.osc(freq * 2.4, 'triangle', t0, 0.07, 0.06, 0.004, detune)
        this.strikeNoise(0.02, 3000, 0.05)
      }, delay * 1000)
    }
  }

  /** Petik (sasando/sape/panting): string lembut decay panjang. */
  pluck(freq: number) {
    const ctx = this.ensure()
    const t0 = this.now()
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(freq, t0)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(2600, t0)
    f.frequency.exponentialRampToValueAtTime(500, t0 + 0.6)
    f.Q.value = 0.8
    const g = ctx.createGain()
    this.env(g, t0, 0.26, 0.004, 1.1)
    o.connect(f)
    f.connect(g)
    g.connect(this.master!)
    o.start(t0)
    o.stop(t0 + 1.3)
    this.osc(freq * 2, 'sine', t0, 0.4, 0.06)
  }

  play(sound: SoundParam) {
    try {
      switch (sound.type) {
        case 'gamelan':
          this.gamelan(sound.freq)
          break
        case 'wood':
          this.wood(sound.freq)
          break
        case 'gong':
          this.gong(sound.freq)
          break
        case 'drum':
          this.drum(sound.freq, sound.param ?? 'mid')
          break
        case 'frame':
          this.frame(sound.freq, sound.param ?? 'mid')
          break
        case 'bamboo':
          this.bamboo(sound.freq)
          break
        case 'pluck':
          this.pluck(sound.freq)
          break
      }
    } catch (e) {
      console.warn('Audio play gagal', e)
    }
  }

  /**
   * Mainkan melodi demo berurutan.
   * @returns fungsi stop()
   */
  playMelody(sounds: SoundParam[], melodyIds: string[], intervalMs = 340): () => void {
    this.stopMelody()
    const byId = new Map(sounds.map((s) => [s.id, s]))
    melodyIds.forEach((id, i) => {
      const s = byId.get(id)
      if (s) {
        this.melodyTimeouts.push(setTimeout(() => this.play(s), i * intervalMs))
      }
    })
    return () => this.stopMelody()
  }

  stopMelody() {
    this.melodyTimeouts.forEach(clearTimeout)
    this.melodyTimeouts = []
  }
}

export const instrumentAudio = new InstrumentAudio()
