/**
 * Content integrity: the authored program data every renderer depends on.
 * These guard the "at least 3 segments, timed beats, distinct content"
 * requirements so regressions fail loudly.
 */

import { describe, expect, it } from 'vitest'
import { CHANNELS, getChannelByNumber, getChannelBySlug, CATEGORIES } from '../src/data/channels'
import { CHANNEL_VISUALS } from '../src/channels'
import { rand2, mulberry32, hashString, pick } from '../src/lib/rng'

describe('channel content', () => {
  it('ships at least 12 channels', () => {
    expect(CHANNELS.length).toBeGreaterThanOrEqual(12)
  })

  it('every channel has unique id, slug and number', () => {
    const ids = new Set(CHANNELS.map((c) => c.id))
    const slugs = new Set(CHANNELS.map((c) => c.slug))
    const nums = new Set(CHANNELS.map((c) => c.number))
    expect(ids.size).toBe(CHANNELS.length)
    expect(slugs.size).toBe(CHANNELS.length)
    expect(nums.size).toBe(CHANNELS.length)
  })

  it('every channel has a registered renderer and logo', () => {
    for (const c of CHANNELS) {
      const v = CHANNEL_VISUALS[c.id]
      expect(v, `missing renderer for ${c.id}`).toBeTruthy()
      expect(typeof v.render).toBe('function')
      expect(typeof v.logo).toBe('function')
    }
  })

  it('every channel has at least 3 segments with positive durations', () => {
    for (const c of CHANNELS) {
      expect(c.segments.length, `${c.id} segments`).toBeGreaterThanOrEqual(3)
      for (const s of c.segments) {
        expect(s.duration, `${s.id} duration`).toBeGreaterThan(0)
        expect(s.title.length).toBeGreaterThan(0)
      }
    }
  })

  it('segment ids are globally unique', () => {
    const ids = CHANNELS.flatMap((c) => c.segments.map((s) => s.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every segment has timed beats, sorted, first at t=0, all with captions', () => {
    for (const c of CHANNELS) {
      for (const s of c.segments) {
        expect(s.beats.length, `${s.id} beats`).toBeGreaterThanOrEqual(3)
        expect(s.beats[0].t, `${s.id} first beat`).toBe(0)
        for (let i = 1; i < s.beats.length; i++) {
          expect(s.beats[i].t, `${s.id} beat order`).toBeGreaterThan(s.beats[i - 1].t)
        }
        for (const b of s.beats) {
          expect(b.t).toBeLessThan(s.duration)
          expect(b.caption.trim().length, `${s.id} caption`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('segments within a channel have distinct titles (real content variation)', () => {
    for (const c of CHANNELS) {
      const titles = c.segments.map((s) => s.title)
      expect(new Set(titles).size, `${c.id} titles`).toBe(titles.length)
      const firsts = c.segments.map((s) => s.beats[0].caption)
      expect(new Set(firsts).size, `${c.id} opening lines`).toBe(firsts.length)
    }
  })

  it('channel categories are all valid', () => {
    const valid = new Set(CATEGORIES.map((c) => c.id))
    for (const c of CHANNELS) expect(valid.has(c.category), `${c.id} category`).toBe(true)
  })

  it('lookup helpers agree with the list', () => {
    for (const c of CHANNELS) {
      expect(getChannelBySlug(c.slug)?.id).toBe(c.id)
      expect(getChannelByNumber(c.number)?.id).toBe(c.id)
    }
    expect(getChannelBySlug('nope')).toBeUndefined()
    expect(getChannelByNumber(999999)).toBeUndefined()
  })
})

describe('rng', () => {
  it('rand2 is stable per (seed, index) and within [0,1)', () => {
    for (let i = 0; i < 50; i++) {
      const v = rand2(1234, i)
      expect(v).toBe(rand2(1234, i))
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('rand2 varies across indices', () => {
    const vals = new Set(Array.from({ length: 40 }, (_, i) => rand2(7, i)))
    expect(vals.size).toBeGreaterThan(30)
  })

  it('mulberry32 produces a stable stream', () => {
    const a = mulberry32(99)
    const b = mulberry32(99)
    for (let i = 0; i < 10; i++) expect(a()).toBe(b())
  })

  it('hashString is stable and distinguishes inputs', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
    expect(hashString('abc')).not.toBe(hashString('abd'))
  })

  it('pick stays inside the array', () => {
    const arr = ['a', 'b', 'c']
    for (let i = 0; i < 20; i++) expect(arr).toContain(pick(arr, i * 31, i))
  })
})
