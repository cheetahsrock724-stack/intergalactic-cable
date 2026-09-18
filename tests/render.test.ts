/**
 * Renderer tests with real rasterization (@napi-rs/canvas / Skia).
 * Every channel is rendered at multiple broadcast positions and asserted to:
 *  - not throw,
 *  - produce rich, non-blank frames,
 *  - animate over time,
 *  - look visually distinct from every other channel.
 */

import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { CHANNELS } from '../src/data/channels'
import { CHANNEL_VISUALS } from '../src/channels'
import {
  EPOCH_MS, channelOffsetMs, channelStateAt, loopLength,
} from '../src/lib/schedule'
import type { ChannelMeta, FrameInfo } from '../src/types'
import { staticNoise, tuningScreen } from '../src/lib/draw'

const W = 480
const H = 270
const NOW = Date.UTC(2026, 8, 18, 12, 0, 0)

function frameFor(ch: ChannelMeta, timeMs: number, reduced = false): FrameInfo {
  const st = channelStateAt(ch, timeMs)
  return {
    w: W, h: H,
    t: st.t,
    segIndex: st.segIndex,
    segment: st.segment,
    beatIndex: st.beatIndex,
    beat: st.segment.beats[st.beatIndex],
    beatT: st.beatT,
    loopT: st.loopT,
    cycle: st.cycle,
    seed: st.seed,
    now: timeMs / 1000,
    reduced,
    channel: ch,
  }
}

function renderFrame(ch: ChannelMeta, timeMs: number, reduced = false) {
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const visual = CHANNEL_VISUALS[ch.id]
  visual.render(ctx as unknown as CanvasRenderingContext2D, frameFor(ch, timeMs, reduced))
  const { data } = ctx.getImageData(0, 0, W, H)
  return data
}

function analyze(data: Uint8ClampedArray) {
  let min = 255
  let max = 0
  const colors = new Set<string>()
  for (let i = 0; i < data.length; i += 4 * 89) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const l = (r + g + b) / 3
    if (l < min) min = l
    if (l > max) max = l
    colors.add(`${r >> 4},${g >> 4},${b >> 4}`)
  }
  return { min, max, colors: colors.size }
}

function signature(data: Uint8ClampedArray): string {
  // coarse 16x9 brightness grid
  const gw = 16, gh = 9
  const cells: number[] = []
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const px = Math.floor(((gx + 0.5) / gw) * W)
      const py = Math.floor(((gy + 0.5) / gh) * H)
      const i = (py * W + px) * 4
      cells.push((data[i] + data[i + 1] + data[i + 2]) / 3 >> 4)
    }
  }
  return cells.join(',')
}

function diffPixels(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let n = 0
  for (let i = 0; i < a.length; i += 4 * 89) {
    if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++
  }
  return n
}

describe('channel renderers (real canvas)', () => {
  for (const ch of CHANNELS) {
    it(`${ch.name}: renders rich content across every segment without throwing`, () => {
      const base = EPOCH_MS - channelOffsetMs(ch)
      let cum = 0
      for (const seg of ch.segments) {
        for (const frac of [0.15, 0.55, 0.9]) {
          const timeMs = base + (cum + seg.duration * frac) * 1000
          const data = renderFrame(ch, timeMs)
          const s = analyze(data)
          expect(s.colors, `${seg.id} color variety`).toBeGreaterThan(8)
          expect(s.max - s.min, `${seg.id} contrast`).toBeGreaterThan(30)
        }
        cum += seg.duration
      }
    })

    it(`${ch.name}: animates over time`, () => {
      const a = renderFrame(ch, NOW)
      const b = renderFrame(ch, NOW + 2500)
      expect(diffPixels(a, b)).toBeGreaterThan(0)
    })

    it(`${ch.name}: renders in reduced-motion mode without throwing`, () => {
      const data = renderFrame(ch, NOW + 1000, true)
      expect(analyze(data).colors).toBeGreaterThan(8)
    })

    it(`${ch.name}: logo draws without throwing`, () => {
      const canvas = createCanvas(64, 64)
      const ctx = canvas.getContext('2d')
      CHANNEL_VISUALS[ch.id].logo(ctx as unknown as CanvasRenderingContext2D, 32, 32, 48, 1.5)
      const { data } = ctx.getImageData(0, 0, 64, 64)
      expect(analyze(data).colors).toBeGreaterThan(1)
    })
  }

  it('all 12 channels are visually distinct at the same moment', () => {
    const sigs = CHANNELS.map((ch) => signature(renderFrame(ch, NOW)))
    expect(new Set(sigs).size).toBe(CHANNELS.length)
  })

  it('channel content varies between loop cycles (seeded variation)', () => {
    const ch = CHANNELS.find((c) => c.id === 'shopping')!
    const loop = loopLength(ch) * 1000
    const a = renderFrame(ch, NOW)
    const b = renderFrame(ch, NOW + loop)
    expect(diffPixels(a, b)).toBeGreaterThan(0)
  })

  it('tuning static and noise render without throwing', () => {
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    tuningScreen(ctx as unknown as CanvasRenderingContext2D, W, H, 0.4)
    const s1 = analyze(ctx.getImageData(0, 0, W, H).data)
    expect(s1.colors).toBeGreaterThan(8)
    staticNoise(ctx as unknown as CanvasRenderingContext2D, W, H, 0.9, 0.5)
    expect(analyze(ctx.getImageData(0, 0, W, H).data).colors).toBeGreaterThan(8)
  })
})
