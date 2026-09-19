/**
 * The infinite dial: procedural channel generation, slug routing, and dial
 * navigation — every positive integer that no curated channel uses is a
 * real, deterministic channel.
 */

import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { CATEGORIES, CHANNELS } from '../src/data/channels'
import {
  generateChannel,
  generatedSlug,
  getGeneratedChannel,
  parseGeneratedSlug,
} from '../src/data/generate'
import {
  FIRST_VOID_NUMBER,
  isCuratedNumber,
  nextDialChannel,
  randomDialChannel,
  resolveChannelById,
  resolveChannelByNumber,
  resolveChannelBySlug,
} from '../src/lib/dial'
import { CHANNEL_VISUALS, getVisualForChannel } from '../src/channels'
import { channelStateAt, loopLength } from '../src/lib/schedule'
import { channelHash, parseChannelSlug } from '../src/lib/url'
import type { ChannelMeta, FrameInfo, SfxName } from '../src/types'

const NOW = Date.UTC(2026, 8, 18, 12, 0, 0)

const VALID_SFX = new Set<SfxName>([
  'blip', 'zap', 'whoosh', 'chime', 'thud', 'sparkle', 'beep', 'warble',
  'staticBurst', 'gavel', 'cash', 'crowd', 'bubble',
])

const CURATED_NUMBERS = new Set(CHANNELS.map((c) => c.number))
/** 1..200 minus the curated numbers → the void's first 188 stations. */
const SAMPLE = Array.from({ length: 200 }, (_, i) => i + 1).filter(
  (n) => !CURATED_NUMBERS.has(n),
)

const HEX = /^#[0-9a-f]{6}$/i

describe('procedural generation', () => {
  it('is deterministic for a given number', () => {
    expect(generateChannel(77)).toEqual(generateChannel(77))
    expect(generateChannel(1)).toEqual(getGeneratedChannel(1)) // cached variant agrees
    expect(generateChannel(100).name).toBe(generateChannel(100).name)
  })

  it('yields a full station for every uncurated number', () => {
    for (const n of SAMPLE) {
      const ch = generateChannel(n)
      expect(ch.number, `number ${n}`).toBe(n)
      expect(ch.id, `id ${n}`).toBe(`inf-${n}`)
      expect(ch.slug, `slug ${n}`).toBe(`inf-${n}`)
      expect(ch.name.length, `name ${n}`).toBeGreaterThan(3)
      expect(ch.tagline.length, `tagline ${n}`).toBeGreaterThan(8)
      expect(ch.logoText.length, `logoText ${n}`).toBeLessThanOrEqual(6)
      expect(ch.accent, `accent ${n}`).toMatch(HEX)
      expect(ch.accent2, `accent2 ${n}`).toMatch(HEX)
      expect(ch.accent2, `accent2 ${n}`).not.toBe(ch.accent)
      expect(ch.derivedFrom, `derivedFrom ${n}`).toBeTruthy()
      expect(
        CHANNELS.map((c) => c.id),
        `derivedFrom ${n}`,
      ).toContain(ch.derivedFrom!)
    }
  })

  it('never collides with the curated set', () => {
    const ids = new Set<string>()
    const slugs = new Set<string>()
    const numbers = new Set<number>()
    for (const c of CHANNELS) {
      ids.add(c.id)
      slugs.add(c.slug)
      numbers.add(c.number)
    }
    for (const n of SAMPLE) {
      const ch = generateChannel(n)
      expect(ids.has(ch.id), `id collision ${ch.id}`).toBe(false)
      expect(slugs.has(ch.slug), `slug collision ${ch.slug}`).toBe(false)
      expect(numbers.has(ch.number), `number collision ${ch.number}`).toBe(false)
    }
  })

  it('rejects invalid dial numbers', () => {
    expect(() => generateChannel(0)).toThrow()
    expect(() => generateChannel(-3)).toThrow()
    expect(() => generateChannel(2.5)).toThrow()
    expect(resolveChannelByNumber(0)).toBeUndefined()
    expect(resolveChannelByNumber(-5)).toBeUndefined()
    expect(resolveChannelByNumber(2.5)).toBeUndefined()
  })

  it('resolves curated numbers to the curated channel, not a generated one', () => {
    for (const c of CHANNELS) {
      expect(resolveChannelByNumber(c.number)?.id).toBe(c.id)
    }
    expect(resolveChannelByNumber(5)?.id).toBe('inf-5')
    expect(resolveChannelByNumber(100)?.number).toBe(100)
  })

  it('borrows the renderer + music of the curated channel in its category', () => {
    for (const n of SAMPLE.slice(0, 80)) {
      const ch = generateChannel(n)
      const template = CHANNELS.find((c) => c.id === ch.derivedFrom)
      expect(template, `template for ${ch.id}`).toBeTruthy()
      expect(template!.category, `${ch.id} category`).toBe(ch.category)
      expect(ch.music, `${ch.id} music`).toBe(template!.music)
      const visual = getVisualForChannel(ch)
      expect(visual, `visual for ${ch.id}`).toBe(CHANNEL_VISUALS[ch.derivedFrom!])
      expect(typeof visual!.render).toBe('function')
      expect(typeof visual!.logo).toBe('function')
    }
  })

  it('satisfies the same content invariants as hand-written channels', () => {
    const allSegmentIds = new Set<string>()
    for (const n of SAMPLE) {
      const ch = generateChannel(n)
      expect(ch.segments.length, `${ch.id} segments`).toBeGreaterThanOrEqual(3)
      const titles: string[] = []
      const openers: string[] = []
      for (const s of ch.segments) {
        expect(s.duration, `${s.id} duration`).toBeGreaterThan(0)
        expect(s.title.length, `${s.id} title`).toBeGreaterThan(0)
        expect(allSegmentIds.has(s.id), `segment id collision ${s.id}`).toBe(false)
        allSegmentIds.add(s.id)
        titles.push(s.title)
        openers.push(s.beats[0].caption)
        expect(s.beats.length, `${s.id} beats`).toBeGreaterThanOrEqual(3)
        expect(s.beats[0].t, `${s.id} first beat`).toBe(0)
        for (let i = 1; i < s.beats.length; i++) {
          expect(s.beats[i].t, `${s.id} beat order`).toBeGreaterThan(s.beats[i - 1].t)
        }
        for (const b of s.beats) {
          expect(b.t, `${s.id} beat within segment`).toBeLessThan(s.duration)
          expect(b.caption.trim().length, `${s.id} caption`).toBeGreaterThan(0)
          if (b.sfx !== undefined) expect(VALID_SFX.has(b.sfx), `${s.id} sfx ${b.sfx}`).toBe(true)
          if (b.speaker !== undefined) expect(b.speaker.length).toBeGreaterThan(1)
        }
      }
      expect(new Set(titles).size, `${ch.id} titles`).toBe(titles.length)
      expect(new Set(openers).size, `${ch.id} openers`).toBe(openers.length)
    }
  })

  it('uses only valid categories', () => {
    const valid = new Set(CATEGORIES.map((c) => c.id))
    for (const n of SAMPLE) {
      expect(valid.has(generateChannel(n).category), `category of ${n}`).toBe(true)
    }
  })

  it('has real name variety across the dial', () => {
    const names = SAMPLE.map((n) => generateChannel(n).name)
    expect(new Set(names).size).toBeGreaterThan(120)
  })

  it('covers every category within the first 600 dial numbers', () => {
    const found = new Set<string>()
    for (let n = 1; n <= 600; n++) {
      if (CURATED_NUMBERS.has(n)) continue
      found.add(generateChannel(n).category)
    }
    expect(found.size).toBe(CATEGORIES.length)
  })

  it('renders real pixels through its family renderer', () => {
    // one generated channel per category, rendered via the registry fallback
    const perCategory = new Map<string, ChannelMeta>()
    for (let n = 1; n <= 600 && perCategory.size < CATEGORIES.length; n++) {
      if (CURATED_NUMBERS.has(n)) continue
      const ch = generateChannel(n)
      if (!perCategory.has(ch.category)) perCategory.set(ch.category, ch)
    }
    expect(perCategory.size).toBe(CATEGORIES.length)
    const W = 480
    const H = 270
    for (const ch of perCategory.values()) {
      const st = channelStateAt(ch, NOW)
      const frame: FrameInfo = {
        w: W, h: H,
        t: st.t,
        segIndex: st.segIndex,
        segment: st.segment,
        beatIndex: st.beatIndex,
        beat: st.segment.beats[st.beatIndex] ?? st.segment.beats[0],
        beatT: st.beatT,
        loopT: st.loopT,
        cycle: st.cycle,
        seed: st.seed,
        now: NOW / 1000,
        reduced: false,
        channel: ch,
      }
      const canvas = createCanvas(W, H)
      const ctx = canvas.getContext('2d')
      const visual = getVisualForChannel(ch)!
      expect(() =>
        visual.render(ctx as unknown as CanvasRenderingContext2D, frame),
      ).not.toThrow()
      const { data } = ctx.getImageData(0, 0, W, H)
      let min = 255
      let max = 0
      for (let i = 0; i < data.length; i += 4 * 89) {
        const l = (data[i] + data[i + 1] + data[i + 2]) / 3
        if (l < min) min = l
        if (l > max) max = l
      }
      expect(max - min, `${ch.id} (${ch.category}) draws content`).toBeGreaterThan(24)
    }
  })

  it('schedules like any other channel', () => {
    const ch = generateChannel(100)
    expect(loopLength(ch)).toBeGreaterThan(120)
    const a = channelStateAt(ch, NOW)
    expect(a.t).toBeLessThanOrEqual(a.segment.duration)
    expect(a.beatIndex).toBeLessThan(a.segment.beats.length)
    const beat = a.segment.beats[a.beatIndex] ?? a.segment.beats[0]
    expect(beat.caption).toBeTruthy()
    // deterministic per clock, like curated channels
    expect(channelStateAt(ch, NOW)).toEqual(a)
    // the broadcast advances (loopT grows within a cycle, or the cycle rolls over)
    const later = channelStateAt(ch, NOW + 30_000)
    expect(later.cycle > a.cycle || later.loopT > a.loopT).toBe(true)
  })
})

describe('generated slugs and links', () => {
  it('round-trips inf slugs through the hash router', () => {
    for (const n of [1, 3, 100, 999]) {
      const slug = generatedSlug(n)
      expect(parseChannelSlug(channelHash(slug))).toBe(slug)
      expect(resolveChannelBySlug(slug)?.number).toBe(n)
    }
  })

  it('parses only valid inf slugs', () => {
    expect(parseGeneratedSlug('inf-42')).toBe(42)
    expect(parseGeneratedSlug('inf-1')).toBe(1)
    expect(parseGeneratedSlug('inf-0')).toBeNull()
    expect(parseGeneratedSlug('inf--3')).toBeNull()
    expect(parseGeneratedSlug('inf-abc')).toBeNull()
    expect(parseGeneratedSlug('inf-')).toBeNull()
    expect(parseGeneratedSlug('galactic-news-404')).toBeNull()
    expect(parseGeneratedSlug('infinite')).toBeNull()
  })

  it('normalizes inf slugs that point at curated numbers', () => {
    // 12 is Cosmic Shopping's dial number — inf-12 resolves to the real thing
    expect(resolveChannelBySlug('inf-12')?.id).toBe('shopping')
    expect(resolveChannelBySlug('inf-404')?.name).toBe('Galactic News 404')
    // ...and every other number resolves to its generated station
    expect(resolveChannelBySlug('inf-100')?.id).toBe('inf-100')
    expect(resolveChannelBySlug('inf-999')?.number).toBe(999)
  })

  it('still returns undefined for unknown slugs', () => {
    expect(resolveChannelBySlug('nope')).toBeUndefined()
    expect(resolveChannelBySlug('inf-xyz')).toBeUndefined()
    expect(resolveChannelBySlug('inf-0')).toBeUndefined()
  })

  it('resolves ids (favorite keys) for curated and generated channels', () => {
    expect(resolveChannelById('gnews')?.id).toBe('gnews')
    expect(resolveChannelById('inf-5')?.id).toBe('inf-5')
    expect(resolveChannelById('nope')).toBeUndefined()
  })
})

describe('the dial', () => {
  it('knows where the void starts and which numbers are curated', () => {
    // with the current lineup (2,7,9,12,16,23,33,51,64,88,89,404 curated)
    expect(FIRST_VOID_NUMBER).toBe(1)
    expect(isCuratedNumber(12)).toBe(true)
    expect(isCuratedNumber(404)).toBe(true)
    expect(isCuratedNumber(5)).toBe(false)
    expect(isCuratedNumber(1)).toBe(false)
  })

  it('walks the curated block exactly as before', () => {
    expect(nextDialChannel(CHANNELS[0], 1).id).toBe(CHANNELS[1].id)
    expect(nextDialChannel(CHANNELS[1], -1).id).toBe(CHANNELS[0].id)
    // down from the first channel still wraps to the last
    expect(nextDialChannel(CHANNELS[0], -1).id).toBe(CHANNELS[11].id)
    expect(nextDialChannel(CHANNELS[0], -2).id).toBe(CHANNELS[10].id)
    expect(nextDialChannel(CHANNELS[4], 0).id).toBe(CHANNELS[4].id)
  })

  it('spills into the void past the last curated channel', () => {
    expect(nextDialChannel(CHANNELS[11], 1).id).toBe('inf-1')
    // skips curated numbers: 2 is Cosmic Shopping's dial number
    expect(nextDialChannel(CHANNELS[11], 2).number).toBe(3)
    expect(nextDialChannel(CHANNELS[11], 3).number).toBe(4)
    // a big jump is the same as many small ones
    expect(nextDialChannel(CHANNELS[11], 15).number).toBe(20)
  })

  it('walks the void in both directions', () => {
    expect(nextDialChannel(generateChannel(4), -1).number).toBe(3)
    expect(nextDialChannel(generateChannel(3), -1).number).toBe(1)
    // off the bottom of the void → the end of the curated block
    expect(nextDialChannel(generateChannel(1), -1).id).toBe(CHANNELS[11].id)
    expect(nextDialChannel(generateChannel(1), -2).id).toBe(CHANNELS[10].id)
    expect(nextDialChannel(generateChannel(1), -3).id).toBe(CHANNELS[9].id)
    // up from the void skips curated numbers (12 is taken)
    expect(nextDialChannel(generateChannel(11), 1).number).toBe(13)
    expect(nextDialChannel(generateChannel(10), 1).number).toBe(11)
    expect(nextDialChannel(generateChannel(10), 2).number).toBe(13)
  })

  it('lands on a resolvable channel for every step of a long walk', () => {
    let cur: ChannelMeta = CHANNELS[0]
    const seen: string[] = []
    for (let i = 0; i < 40; i++) {
      cur = nextDialChannel(cur, 1)
      expect(resolveChannelBySlug(cur.slug)?.id, `walk step ${i + 1}`).toBe(cur.id)
      seen.push(cur.id)
    }
    // first 11 steps finish the curated block, then the void ascends 1,3,4,5,…
    expect(seen[10]).toBe(CHANNELS[11].id)
    expect(seen[11]).toBe('inf-1')
    expect(seen[12]).toBe('inf-3')
    expect(seen[13]).toBe('inf-4')
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('random dial picks real channels, never the current one, and favors the void', () => {
    const cur = generateChannel(500)
    let sawCurated = 0
    let sawGenerated = 0
    for (let i = 0; i < 60; i++) {
      const pick = randomDialChannel(cur)
      expect(pick.id).not.toBe(cur.id)
      expect(resolveChannelById(pick.id)?.id).toBe(pick.id)
      if (CHANNELS.some((c) => c.id === pick.id)) sawCurated++
      else sawGenerated++
    }
    expect(sawGenerated).toBeGreaterThan(0)
    expect(sawCurated).toBeGreaterThan(0)
  })
})
