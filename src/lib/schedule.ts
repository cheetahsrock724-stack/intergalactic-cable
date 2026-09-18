/**
 * Deterministic broadcast scheduling.
 *
 * Every channel runs a fixed loop of segments. The current position is a pure
 * function of:
 *   - a fixed reference epoch (EPOCH_MS),
 *   - a per-channel offset derived from the channel id (so channels are not
 *     all in lockstep),
 *   - the sum of the channel's segment durations,
 *   - the current wall-clock time.
 *
 * The player and the channel guide both call `channelStateAt`, so they can
 * never disagree about what is "on air". Note this is *simulated* live TV:
 * it is deterministic per clock, not a real feed, and tiny clock differences
 * between devices can shift positions by a few seconds.
 */

import type { ChannelMeta, Segment } from '../types'
import { hashString } from './rng'

/** Fixed reference epoch: 2025-01-01T00:00:00Z. */
export const EPOCH_MS = Date.UTC(2025, 0, 1)

export interface ScheduleState {
  segIndex: number
  segment: Segment
  /** Seconds since the segment started. */
  t: number
  /** Seconds since the channel loop started. */
  loopT: number
  /** Which repetition of the loop (0,1,2,...) — used for seeded variation. */
  cycle: number
  /** Stable seed combining channel, segment and cycle. */
  seed: number
  /** Index of the active beat within the segment. */
  beatIndex: number
  /** Seconds since the active beat started. */
  beatT: number
  /** Total loop length in seconds. */
  loopLength: number
}

/** Total loop length in seconds (sum of segment durations). */
export function loopLength(ch: ChannelMeta): number {
  let total = 0
  for (const s of ch.segments) total += s.duration
  return total
}

/**
 * Per-channel offset in ms, derived from the channel id, so different
 * channels are at different points of their loops.
 */
export function channelOffsetMs(ch: ChannelMeta): number {
  const loopMs = loopLength(ch) * 1000
  return hashString(`offset:${ch.id}`) % loopMs
}

/** Index of the beat active at time t (seconds) in a segment. */
export function beatIndexAt(segment: Segment, t: number): number {
  let idx = 0
  for (let i = 0; i < segment.beats.length; i++) {
    if (segment.beats[i].t <= t) idx = i
    else break
  }
  return idx
}

/**
 * Compute the full on-air state of a channel at a given wall-clock time.
 * Pure and cheap — safe to call every frame for the active channel and
 * on a timer for the guide.
 */
export function channelStateAt(ch: ChannelMeta, nowMs: number): ScheduleState {
  const loopSec = loopLength(ch)
  const loopMs = loopSec * 1000
  const elapsed = Math.max(0, nowMs - EPOCH_MS + channelOffsetMs(ch))
  const cycle = Math.floor(elapsed / loopMs)
  const loopT = (elapsed % loopMs) / 1000

  let segIndex = 0
  let t = loopT
  for (let i = 0; i < ch.segments.length; i++) {
    const d = ch.segments[i].duration
    if (t < d || i === ch.segments.length - 1) {
      segIndex = i
      break
    }
    t -= d
  }
  const segment = ch.segments[segIndex]
  t = Math.min(t, segment.duration)
  const beatIndex = beatIndexAt(segment, t)
  const beat = segment.beats[beatIndex] ?? segment.beats[0]
  const beatT = t - (beat?.t ?? 0)
  const seed =
    hashString(`${ch.id}:${cycle}:${segIndex}`) ^ Math.imul(cycle + 1, 0x27d4eb2d)

  return { segIndex, segment, t, loopT, cycle, seed, beatIndex, beatT, loopLength: loopSec }
}

/** 0..1 progress through the current segment. */
export function segmentProgress(state: ScheduleState): number {
  return Math.min(1, Math.max(0, state.t / state.segment.duration))
}

/** Formats seconds as m:ss (for guide/now-playing displays). */
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
