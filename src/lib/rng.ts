/**
 * Deterministic pseudo-random helpers. Everything the renderers need to look
 * "random" is derived from (seed, index) pairs so frames are stable regardless
 * of frame rate and identical across devices at the same broadcast position.
 */

/** FNV-1a 32-bit string hash. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 PRNG — returns a generator producing [0,1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Stable pseudo-random value in [0,1) for a (seed, index) pair.
 * Safe to call every frame with the same inputs — always returns the same value.
 */
export function rand2(seed: number, i: number): number {
  let h = (seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Stable pick from an array. Returns the only element for empty-safe input. */
export function pick<T>(arr: readonly T[], seed: number, i: number): T {
  if (arr.length === 0) throw new Error('pick(): empty array')
  return arr[Math.floor(rand2(seed, i) * arr.length) % arr.length]
}

/** Stable float in [min, max). */
export function between(
  seed: number,
  i: number,
  min: number,
  max: number,
): number {
  return min + rand2(seed, i) * (max - min)
}
