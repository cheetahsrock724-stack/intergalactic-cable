/**
 * Audio engine — one shared AudioContext for the whole app.
 *
 * - Created lazily on the first user gesture ("Turn on TV").
 * - Procedural music beds: a tiny lookahead sequencer schedules notes from
 *   per-style configs (scale, tempo, waveforms, pattern).
 * - Synthesized SFX only (oscillators + a shared noise buffer) — no samples.
 * - Optional speechSynthesis narration, fully guarded; the experience works
 *   without it. Old speech is cancelled on channel change.
 * - setStyle() stops the previous bed before starting a new one, so rapid
 *   channel switching can never stack music or timers.
 */

import type { MusicStyle, SfxName } from '../types'
import { mulberry32 } from './rng'

interface MusicConfig {
  tempo: number // BPM
  scale: number[] // semitone offsets from root
  root: number // Hz
  wave: OscillatorType
  bassWave: OscillatorType
  /** Which 16th steps (0..15) play a melody note. */
  pattern: number[]
  bassEvery: number // play bass note every N bars
  padGain: number
  melodyGain: number
  swing?: number
}

const MUSIC: Record<MusicStyle, MusicConfig> = {
  news: {
    tempo: 112, scale: [0, 3, 5, 7, 10], root: 220, wave: 'square', bassWave: 'triangle',
    pattern: [0, 3, 6, 8, 11, 14], bassEvery: 1, padGain: 0.05, melodyGain: 0.05,
  },
  shopping: {
    tempo: 128, scale: [0, 2, 4, 7, 9], root: 261.6, wave: 'triangle', bassWave: 'sine',
    pattern: [0, 2, 4, 6, 8, 10, 12, 14], bassEvery: 1, padGain: 0.05, melodyGain: 0.055,
  },
  weather: {
    tempo: 84, scale: [0, 2, 4, 5, 7, 9, 11], root: 196, wave: 'sine', bassWave: 'sine',
    pattern: [0, 4, 8, 12], bassEvery: 2, padGain: 0.07, melodyGain: 0.045,
  },
  nature: {
    tempo: 72, scale: [0, 2, 4, 7, 9], root: 174.6, wave: 'sine', bassWave: 'triangle',
    pattern: [0, 6, 10], bassEvery: 2, padGain: 0.06, melodyGain: 0.05,
  },
  court: {
    tempo: 92, scale: [0, 3, 5, 6, 7, 10], root: 164.8, wave: 'sawtooth', bassWave: 'triangle',
    pattern: [0, 5, 8, 13], bassEvery: 1, padGain: 0.045, melodyGain: 0.035,
  },
  kitchen: {
    tempo: 120, scale: [0, 2, 4, 5, 7, 9, 11], root: 293.7, wave: 'square', bassWave: 'sine',
    pattern: [0, 3, 4, 7, 8, 11], bassEvery: 1, padGain: 0.04, melodyGain: 0.045,
  },
  sports: {
    tempo: 140, scale: [0, 3, 5, 7, 10], root: 220, wave: 'sawtooth', bassWave: 'square',
    pattern: [0, 2, 4, 6, 8, 10, 12, 14], bassEvery: 1, padGain: 0.035, melodyGain: 0.045,
  },
  ads: {
    tempo: 116, scale: [0, 4, 7, 11], root: 261.6, wave: 'triangle', bassWave: 'sine',
    pattern: [0, 4, 7, 8, 12], bassEvery: 1, padGain: 0.06, melodyGain: 0.06,
  },
  ambient: {
    tempo: 56, scale: [0, 2, 4, 7, 9, 11], root: 130.8, wave: 'sine', bassWave: 'sine',
    pattern: [0, 8], bassEvery: 2, padGain: 0.09, melodyGain: 0.05,
  },
  mystery: {
    tempo: 60, scale: [0, 1, 5, 6, 8], root: 110, wave: 'sine', bassWave: 'sine',
    pattern: [0, 7, 11], bassEvery: 2, padGain: 0.08, melodyGain: 0.04,
  },
  public: {
    tempo: 100, scale: [0, 2, 3, 5, 7, 8, 10], root: 196, wave: 'triangle', bassWave: 'triangle',
    pattern: [0, 4, 6, 8, 12, 14], bassEvery: 1, padGain: 0.05, melodyGain: 0.05,
  },
  documentary: {
    tempo: 76, scale: [0, 3, 5, 7, 10, 12], root: 146.8, wave: 'sine', bassWave: 'triangle',
    pattern: [0, 5, 9], bassEvery: 2, padGain: 0.07, melodyGain: 0.045,
  },
}

const SFX_WAVES: Record<SfxName, OscillatorType> = {
  blip: 'square', zap: 'sawtooth', whoosh: 'sine', chime: 'triangle',
  thud: 'sine', sparkle: 'sine', beep: 'square', warble: 'triangle',
  staticBurst: 'square', gavel: 'sine', cash: 'square', crowd: 'sine',
  bubble: 'sine',
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private seqTimer: number | null = null
  private step = 0
  private nextNoteTime = 0
  private style: MusicStyle | null = null
  private volume = 0.7
  private muted = false
  speechEnabled = true

  /** Must be called from a user gesture. Safe to call repeatedly. */
  async ensure(): Promise<void> {
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 64
      this.master.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)
      this.musicGain = this.ctx.createGain()
      this.musicGain.connect(this.master)
      // shared 1s white-noise buffer
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate)
      const data = buf.getChannelData(0)
      const rnd = mulberry32(1337)
      for (let i = 0; i < data.length; i++) data[i] = rnd() * 2 - 1
      this.noiseBuf = buf
      this.applyVolume()
    }
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume() } catch { /* ignore */ }
    }
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v))
    this.applyVolume()
  }

  setMuted(m: boolean): void {
    this.muted = m
    this.applyVolume()
    if (m) this.stopSpeech()
  }

  private applyVolume(): void {
    if (!this.master || !this.ctx) return
    const target = this.muted ? 0 : this.volume
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02)
  }

  /** Switch (or stop with null) the background music bed. */
  setStyle(style: MusicStyle | null): void {
    this.stopSequencer()
    this.style = style
    if (!style || !this.ctx || !this.musicGain) return
    this.step = 0
    this.nextNoteTime = this.ctx.currentTime + 0.06
    // Lookahead scheduler: fires 8x/sec, schedules notes 0.4s ahead.
    this.seqTimer = window.setInterval(() => this.schedule(), 120)
    this.schedule()
  }

  private schedule(): void {
    const ctx = this.ctx
    const gain = this.musicGain
    if (!ctx || !gain || !this.style) return
    const cfg = MUSIC[this.style]
    const spb = 60 / cfg.tempo / 4 // 16th note seconds
    while (this.nextNoteTime < ctx.currentTime + 0.4) {
      const s = this.step % 16
      const bar = Math.floor(this.step / 16)
      const rnd = mulberry32(this.step * 2654435761 + bar)
      if (cfg.pattern.includes(s)) {
        const deg = Math.floor(rnd() * cfg.scale.length)
        const oct = rnd() < 0.25 ? 2 : 1
        const freq =
          cfg.root * oct * Math.pow(2, cfg.scale[deg] / 12)
        this.note(freq, this.nextNoteTime, spb * 1.8, cfg.wave, cfg.melodyGain, gain)
      }
      if (s === 0 && bar % cfg.bassEvery === 0) {
        const deg = Math.floor(rnd() * 3)
        const freq = cfg.root * 0.5 * Math.pow(2, cfg.scale[deg] / 12)
        this.note(freq, this.nextNoteTime, spb * 6, cfg.bassWave, cfg.melodyGain * 1.3, gain)
      }
      if (s === 0) {
        // sustained pad chord every bar
        for (const deg of [0, 2, 4]) {
          if (deg >= cfg.scale.length) break
          const freq = cfg.root * Math.pow(2, cfg.scale[deg] / 12)
          this.note(freq, this.nextNoteTime, spb * 14, 'sine', cfg.padGain * 0.5, gain)
        }
      }
      this.nextNoteTime += spb
      this.step++
    }
  }

  private note(
    freq: number, when: number, dur: number,
    wave: OscillatorType, gainVal: number, dest: AudioNode,
  ): void {
    const ctx = this.ctx
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = wave
    osc.frequency.value = freq
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainVal), when + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    osc.connect(g)
    g.connect(dest)
    osc.start(when)
    osc.stop(when + dur + 0.05)
  }

  private stopSequencer(): void {
    if (this.seqTimer !== null) {
      clearInterval(this.seqTimer)
      this.seqTimer = null
    }
  }

  /** One-shot synthesized sound effect. */
  play(name: SfxName): void {
    const ctx = this.ctx
    if (!ctx || !this.master || this.muted || this.volume === 0) return
    const t = ctx.currentTime + 0.01
    const out = this.master
    switch (name) {
      case 'blip': this.note(880, t, 0.08, 'square', 0.08, out); break
      case 'beep':
        this.note(660, t, 0.07, 'square', 0.07, out)
        this.note(660, t + 0.09, 0.07, 'square', 0.07, out)
        break
      case 'zap': this.sweep(1200, 120, 0.18, 'sawtooth', 0.09, t, out); break
      case 'whoosh': this.noise(0.4, 900, 0.07, t, out, true); break
      case 'chime':
        for (const [i, f] of [523.3, 659.3, 784, 1046.5].entries())
          this.note(f, t + i * 0.09, 0.5, 'triangle', 0.07, out)
        break
      case 'thud': this.sweep(140, 50, 0.22, 'sine', 0.22, t, out); break
      case 'gavel':
        this.sweep(160, 55, 0.2, 'sine', 0.24, t, out)
        this.noise(0.05, 3000, 0.05, t, out, false)
        break
      case 'sparkle':
        for (const [i, f] of [1318, 1568, 2093, 2637].entries())
          this.note(f, t + i * 0.05, 0.25, 'sine', 0.05, out)
        break
      case 'warble': this.warble(300, 6, 0.5, 0.06, t, out); break
      case 'staticBurst': this.noise(0.22, 6000, 0.09, t, out, false); break
      case 'cash':
        this.note(1046, t, 0.09, 'square', 0.08, out)
        this.note(1568, t + 0.1, 0.2, 'square', 0.08, out)
        break
      case 'crowd': this.noise(0.7, 500, 0.05, t, out, true); break
      case 'bubble': this.sweep(200, 600, 0.14, 'sine', 0.1, t, out); break
      default: void SFX_WAVES[name]
    }
  }

  /** Channel-change tuning static. */
  tuningBurst(dur = 0.35): void {
    const ctx = this.ctx
    if (!ctx || !this.master || this.muted) return
    this.noise(dur, 5000, 0.08, ctx.currentTime, this.master, false)
  }

  /** Power-on zap + rising hum. */
  powerOn(): void {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const t = ctx.currentTime
    this.sweep(60, 480, 0.5, 'sawtooth', 0.05, t, this.master)
    this.noise(0.15, 7000, 0.06, t, this.master, false)
  }

  /** Power-off descending hum. */
  powerOff(): void {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    this.sweep(480, 45, 0.4, 'sine', 0.09, ctx.currentTime, this.master)
    this.stopSpeech()
  }

  private sweep(
    f0: number, f1: number, dur: number, wave: OscillatorType,
    gainVal: number, t: number, dest: AudioNode,
  ): void {
    const ctx = this.ctx
    if (!ctx) return
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = wave
    osc.frequency.setValueAtTime(f0, t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
    g.gain.setValueAtTime(gainVal, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g); g.connect(dest)
    osc.start(t); osc.stop(t + dur + 0.05)
  }

  private warble(
    f: number, rate: number, dur: number, gainVal: number, t: number, dest: AudioNode,
  ): void {
    const ctx = this.ctx
    if (!ctx) return
    const osc = ctx.createOscillator()
    const lfo = ctx.createOscillator()
    const lfoG = ctx.createGain()
    const g = ctx.createGain()
    osc.type = 'triangle'; osc.frequency.value = f
    lfo.frequency.value = rate
    lfoG.gain.value = f * 0.25
    lfo.connect(lfoG); lfoG.connect(osc.frequency)
    g.gain.setValueAtTime(gainVal, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g); g.connect(dest)
    osc.start(t); lfo.start(t)
    osc.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05)
  }

  private noise(
    dur: number, filterHz: number, gainVal: number, t: number,
    dest: AudioNode, fade: boolean,
  ): void {
    const ctx = this.ctx
    if (!ctx || !this.noiseBuf) return
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = filterHz
    const g = ctx.createGain()
    g.gain.setValueAtTime(fade ? 0.0001 : gainVal, t)
    if (fade) g.gain.exponentialRampToValueAtTime(gainVal, t + dur * 0.4)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(filter); filter.connect(g); g.connect(dest)
    src.start(t); src.stop(t + dur + 0.05)
  }

  /** Frequency-band levels (0..255) for reactive visuals. Empty when audio off. */
  getLevels(): Uint8Array | null {
    if (!this.analyser || !this.ctx || this.ctx.state !== 'running') return null
    const arr = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(arr)
    return arr
  }

  // ---- optional speech narration -------------------------------------

  speak(text: string, speaker?: string): void {
    if (!this.speechEnabled || this.muted) return
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.02
      u.pitch = speaker && /zorp|glarb|bloop|x/i.test(speaker) ? 0.7 : 1.0
      u.volume = Math.min(1, this.volume + 0.2)
      synth.speak(u)
    } catch {
      /* speech is optional — captions always carry the content */
    }
  }

  stopSpeech(): void {
    try { window.speechSynthesis?.cancel() } catch { /* ignore */ }
  }

  /** Suspend everything (power off). Context is kept for reuse. */
  async suspend(): Promise<void> {
    this.stopSequencer()
    this.style = null
    this.stopSpeech()
    if (this.ctx && this.ctx.state === 'running') {
      try { await this.ctx.suspend() } catch { /* ignore */ }
    }
  }

  dispose(): void {
    this.stopSequencer()
    this.stopSpeech()
    if (this.ctx) {
      this.ctx.close().catch(() => undefined)
      this.ctx = null
      this.master = null
      this.musicGain = null
      this.analyser = null
    }
  }
}

/** Single shared engine instance. */
export const audio = new AudioEngine()
