import { describe, expect, it } from 'vitest'
import {
  EPOCH_MS, beatIndexAt, channelOffsetMs, channelStateAt, loopLength,
  segmentProgress, fmtClock,
} from '../src/lib/schedule'
import { CHANNELS } from '../src/data/channels'

const ch = CHANNELS[0]

describe('schedule', () => {
  it('loopLength equals the sum of segment durations', () => {
    for (const c of CHANNELS) {
      const sum = c.segments.reduce((a, s) => a + s.duration, 0)
      expect(loopLength(c)).toBe(sum)
    }
  })

  it('is deterministic: same time in, same state out', () => {
    const t = Date.UTC(2026, 4, 17, 12, 34, 56)
    const a = channelStateAt(ch, t)
    const b = channelStateAt(ch, t)
    expect(a).toEqual(b)
  })

  it('channel offsets are stable and within the loop', () => {
    for (const c of CHANNELS) {
      const off = channelOffsetMs(c)
      expect(off).toBe(channelOffsetMs(c))
      expect(off).toBeGreaterThanOrEqual(0)
      expect(off).toBeLessThan(loopLength(c) * 1000)
    }
  })

  it('different channels are at different loop positions', () => {
    const t = Date.UTC(2026, 0, 2, 3, 4, 5)
    const positions = CHANNELS.map((c) => channelStateAt(c, t).loopT)
    // not all identical
    expect(new Set(positions.map((p) => Math.round(p))).size).toBeGreaterThan(1)
  })

  // A channel's loop boundaries are at EPOCH_MS - offset + k*loopMs,
  // because elapsed = now - EPOCH + offset.
  const loopStart = (c: (typeof CHANNELS)[number]) => EPOCH_MS - channelOffsetMs(c)

  it('at a loop boundary, playback is at the loop start (segment 0, t≈0)', () => {
    const st = channelStateAt(ch, loopStart(ch))
    expect(st.segIndex).toBe(0)
    expect(st.t).toBeCloseTo(0, 5)
    expect(st.cycle).toBe(0)
  })

  it('advances into later segments as time passes', () => {
    const base = loopStart(ch)
    const d0 = ch.segments[0].duration
    const st = channelStateAt(ch, base + (d0 + 2) * 1000)
    expect(st.segIndex).toBe(1)
    expect(st.t).toBeCloseTo(2, 5)
  })

  it('wraps around to segment 0 after a full loop, incrementing cycle', () => {
    const base = loopStart(ch)
    const loop = loopLength(ch)
    const st = channelStateAt(ch, base + (loop + 1.5) * 1000)
    expect(st.segIndex).toBe(0)
    expect(st.t).toBeCloseTo(1.5, 5)
    expect(st.cycle).toBe(1)
  })

  it('seeds change per cycle so content can vary between loops', () => {
    const base = loopStart(ch)
    const loop = loopLength(ch)
    const s0 = channelStateAt(ch, base + 1000).seed
    const s1 = channelStateAt(ch, base + (loop + 1) * 1000).seed
    expect(s0).not.toBe(s1)
  })

  it('returning to a channel yields the position time moved on, not a restart', () => {
    const t1 = Date.UTC(2026, 6, 1, 0, 0, 0)
    const t2 = t1 + 37_000 // 37 s later
    const a = channelStateAt(ch, t1)
    const b = channelStateAt(ch, t2)
    // b is exactly 37 s further along the loop than a
    const expected = (a.loopT + 37) % loopLength(ch)
    expect(b.loopT).toBeCloseTo(expected, 3)
  })

  it('beatIndexAt finds the active beat and clamps before the first', () => {
    const seg = ch.segments[0]
    expect(beatIndexAt(seg, 0)).toBe(0)
    const mid = seg.beats[2]
    expect(beatIndexAt(seg, mid.t + 0.001)).toBe(2)
    expect(beatIndexAt(seg, seg.duration)).toBe(seg.beats.length - 1)
  })

  it('segmentProgress stays within [0,1]', () => {
    const t = Date.UTC(2026, 8, 9, 10, 11, 12)
    for (const c of CHANNELS) {
      const st = channelStateAt(c, t)
      const p = segmentProgress(st)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('fmtClock formats mm:ss', () => {
    expect(fmtClock(0)).toBe('0:00')
    expect(fmtClock(65)).toBe('1:05')
    expect(fmtClock(-3)).toBe('0:00')
  })

  it('handles times before the epoch without crashing', () => {
    const st = channelStateAt(ch, EPOCH_MS - 10_000)
    expect(st.segIndex).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(st.t)).toBe(true)
  })
})
