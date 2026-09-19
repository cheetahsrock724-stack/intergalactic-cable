/**
 * The dial — channel resolution + navigation across the curated twelve and
 * the infinite procedurally generated void beyond them.
 *
 * Dial model:
 *   [ curated[0] … curated[11] ] [ void: 1, 3, 4, 5, … every positive
 *                                  integer no curated channel uses ]
 *
 *  - CH ▲/▼ inside the curated block walks it in order; ▼ from the first
 *    channel wraps to the last (classic behavior).
 *  - CH ▲ from the last curated channel spills into the void, which starts
 *    at the lowest unused positive number and ascends forever.
 *  - CH ▼ off the bottom of the void lands on the last curated channel.
 *  - Numeric entry: every positive integer is a channel — curated if one
 *    lives there, otherwise generated on the spot.
 */

import { CHANNELS, getChannelBySlug } from '../data/channels'
import { getGeneratedChannel, parseGeneratedSlug } from '../data/generate'
import type { ChannelMeta } from '../types'

const CURATED_BY_ID = new Map(CHANNELS.map((c) => [c.id, c] as const))
const CURATED_NUMBERS = new Set(CHANNELS.map((c) => c.number))

/** The first channel number of the void: the lowest positive integer no
 *  curated channel broadcasts on. */
export const FIRST_VOID_NUMBER: number = (() => {
  let n = 1
  while (CURATED_NUMBERS.has(n)) n++
  return n
})()

export function isCuratedNumber(n: number): boolean {
  return CURATED_NUMBERS.has(n)
}

/** Every positive integer is a channel: curated if one lives there,
 *  otherwise procedurally generated. 0/negative/non-integers are not. */
export function resolveChannelByNumber(n: number): ChannelMeta | undefined {
  if (!Number.isInteger(n) || n < 1) return undefined
  return CHANNELS.find((c) => c.number === n) ?? getGeneratedChannel(n)
}

/** Curated slugs resolve directly; `inf-<n>` slugs resolve to the channel
 *  at dial position n (normalized to the curated channel if one lives there). */
export function resolveChannelBySlug(slug: string): ChannelMeta | undefined {
  const curated = getChannelBySlug(slug)
  if (curated) return curated
  const n = parseGeneratedSlug(slug)
  return n === null ? undefined : resolveChannelByNumber(n)
}

/** Channel ids (also used as favorite keys). `inf-<n>` ids resolve like slugs. */
export function resolveChannelById(id: string): ChannelMeta | undefined {
  return CURATED_BY_ID.get(id) ?? resolveChannelBySlug(id)
}

/** Smallest unused dial number greater than n. */
function nextUnusedUp(n: number): number {
  let x = n + 1
  while (CURATED_NUMBERS.has(x)) x++
  return x
}

/** Largest unused dial number below n, or null when the void runs out. */
function prevUnusedDown(n: number): number | null {
  let x = n - 1
  while (x >= 1 && CURATED_NUMBERS.has(x)) x--
  return x >= 1 ? x : null
}

/**
 * Take `delta` steps (▲ = +1, ▼ = -1) along the dial from `cur`.
 * Works for any step count; the void is unbounded upward.
 */
export function nextDialChannel(cur: ChannelMeta, delta: number): ChannelMeta {
  if (delta === 0) return cur
  const dir = delta > 0 ? 1 : -1
  let steps = Math.abs(delta)
  const idx = CHANNELS.findIndex((c) => c.id === cur.id)

  if (idx !== -1) {
    // ── inside the curated block ──
    let i = idx
    while (steps > 0) {
      if (dir === 1 && i === CHANNELS.length - 1) {
        // spill off the top into the void
        let num = FIRST_VOID_NUMBER
        for (let k = 1; k < steps; k++) num = nextUnusedUp(num)
        return getGeneratedChannel(num)
      }
      i = dir === 1 ? i + 1 : i === 0 ? CHANNELS.length - 1 : i - 1
      steps--
    }
    return CHANNELS[i]
  }

  // ── in the void ──
  let num = cur.number
  while (steps > 0) {
    if (dir === 1) {
      num = nextUnusedUp(num)
    } else {
      const prev = prevUnusedDown(num)
      if (prev === null) {
        // stepped off the bottom of the void onto the end of the curated block
        let i = CHANNELS.length - 1
        steps--
        while (steps > 0) {
          i = i === 0 ? CHANNELS.length - 1 : i - 1
          steps--
        }
        return CHANNELS[i]
      }
      num = prev
    }
    steps--
  }
  return getGeneratedChannel(num)
}

/**
 * The remote's random button: mostly the endless void (that is the point),
 * sometimes the hand-crafted classics. Never returns the current channel.
 */
export function randomDialChannel(cur: ChannelMeta): ChannelMeta {
  if (Math.random() < 0.4) {
    const pool = CHANNELS.filter((c) => c.id !== cur.id)
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)]
    return CHANNELS[0]
  }
  let n = 1 + Math.floor(Math.random() * 999)
  if (CURATED_NUMBERS.has(n) || n === cur.number) n = nextUnusedUp(n)
  return getGeneratedChannel(n)
}
