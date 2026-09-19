/**
 * Photographic plates — the photoreal layer of Intergalactic Cable.
 *
 * A plate is a single photographic still that stands in for a studio, a
 * landscape or a set. Every frame of every channel is composited over one:
 * the plate supplies the environment (light, material, depth, texture) and
 * the channel's renderer draws its cast, props and broadcast graphics on
 * top.
 *
 * The dial is infinite, so plates cannot be authored per channel. They are
 * organised by **category** — the same twelve categories the generator
 * already uses, and the same category a generated channel borrows its
 * renderer from. Selection is deterministic:
 *
 *   plate = PLATES[channel.category][ hash(channel.id, segment) % n ]
 *
 * so channel 404 and channel 404000 get stable, different-looking stations
 * without storing anything, and every one of them is photoreal.
 *
 * Plates are a progressive enhancement. In environments where images do not
 * decode (jsdom, offline, a failed request) `photoBackdrop()` returns false
 * and the renderer falls back to the fully procedural scene that has always
 * been there.
 */

import type { CategoryId, FrameInfo } from '../types'
import { hashString, mulberry32 } from './rng'

/** Vite's base URL (`/intergalactic-cable/`), so plates resolve on Pages. */
const BASE: string =
  (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'

/** Photographic stills per category. Add variants here as they are authored. */
export const PLATES: Record<CategoryId, string[]> = {
  news: ['news-1'],
  shopping: ['shopping-1'],
  weather: ['weather-1'],
  nature: ['nature-1'],
  court: ['court-1'],
  cooking: ['cooking-1'],
  sports: ['sports-1'],
  ads: ['ads-1'],
  music: ['music-1'],
  documentary: ['documentary-1'],
  mystery: ['mystery-1'],
  community: ['community-1'],
}

/** Public URL for a plate name. */
export function plateUrl(name: string): string {
  return `${BASE}plates/${name}.jpg`
}

export function plateCount(category: CategoryId): number {
  return PLATES[category]?.length ?? 0
}

/**
 * Deterministic plate choice for a category + variation seed. Same inputs,
 * same still, on every device and every reload.
 */
export function plateName(category: CategoryId, seed: number): string | null {
  const list = PLATES[category]
  if (!list || list.length === 0) return null
  const r = mulberry32((hashString(String(seed)) ^ hashString(category)) >>> 0)
  return list[Math.floor(r() * list.length) % list.length]
}

interface Entry {
  img: HTMLImageElement
  ready: boolean
  failed: boolean
}

const cache = new Map<string, Entry>()

/**
 * Get a decoded plate, or start loading it and return null for now.
 * Never throws: a missing or broken plate is not a broken broadcast.
 */
export function plateImage(name: string): HTMLImageElement | null {
  const hit = cache.get(name)
  if (hit) return hit.ready ? hit.img : null
  if (typeof Image === 'undefined') return null

  const entry: Entry = { img: new Image(), ready: false, failed: false }
  cache.set(name, entry)
  entry.img.decoding = 'async'
  entry.img.onload = () => { entry.ready = true }
  entry.img.onerror = () => { entry.failed = true }
  entry.img.src = plateUrl(name)
  return null
}

/** True once the plate for this category/seed is decoded and drawable. */
export function plateReady(category: CategoryId, seed: number): boolean {
  const name = plateName(category, seed)
  return name ? cache.get(name)?.ready === true : false
}

/** Warm the cache (called on channel change so the plate is there sooner). */
export function preloadPlate(category: CategoryId, seed: number): void {
  const name = plateName(category, seed)
  if (name) plateImage(name)
}

/** Prime every plate in a category — cheap now, no pop-in when you tune. */
export function preloadCategory(category: CategoryId): void {
  for (const name of PLATES[category] ?? []) plateImage(name)
}

/**
 * Install an already-decoded plate. Used by the tests to render the
 * photographic path headlessly; harmless (and idempotent) in the browser.
 */
export function primePlate(name: string, img: HTMLImageElement): void {
  cache.set(name, { img, ready: true, failed: false })
}

export interface PhotographOpts {
  w: number
  h: number
  /** Stable seed — decides where the camera sits. */
  seed: number
  /** Seconds; drives the slow camera move. */
  t: number
  /** Base framing: 1 covers the frame, >1 crops in. */
  zoom?: number
  /** Amount of camera drift, 0..1. Ignored under reduced motion. */
  motion?: number
  /** Vertical framing bias, -1 (top) .. 1 (bottom). */
  biasY?: number
}

/**
 * Draw a plate as a moving photograph: cover-fit, then a very slow
 * push/drift so a still reads as a held camera shot rather than a slide.
 */
export function drawPhotograph(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  o: PhotographOpts,
): void {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return

  const motion = o.motion ?? 1
  const r = mulberry32((o.seed ^ 0x9e3779b9) >>> 0)
  const phase = r() * Math.PI * 2
  const period = 22 + r() * 14 // one slow breath every 22–36s
  const cycle = o.t / period

  // ease in and out instead of a mechanical sine swing
  const push = Math.sin(cycle * Math.PI * 2 + phase)
  const drift = Math.sin(cycle * Math.PI * 2 * 0.61 + phase * 1.7)

  const zoomAmp = 0.05 * motion
  const panAmp = 0.022 * motion
  const zoom = (o.zoom ?? 1) * (1 + push * zoomAmp)

  const scale = Math.max(o.w / iw, o.h / ih) * zoom
  const dw = iw * scale
  const dh = ih * scale
  const biasY = o.biasY ?? 0
  const x = (o.w - dw) / 2 + drift * panAmp * o.w
  const y = (o.h - dh) / 2 + drift * panAmp * o.h * 0.6 + biasY * (dh - o.h) * 0.5

  ctx.drawImage(img, x, y, dw, dh)
}

export interface BackdropOpts {
  /** Override the plate category (defaults to the channel's own). */
  category?: CategoryId
  /** Base framing: >1 crops in for a tighter shot. */
  zoom?: number
  /** Camera drift, 0..1. Forced to 0 under reduced motion. */
  motion?: number
  /** Vertical framing bias, -1..1. */
  biasY?: number
  /** How much to darken the plate so broadcast graphics stay legible. */
  scrim?: number
  /** Accent colour used to grade the still toward the channel's palette. */
  tint?: string
  /** Haze colour laid along the lower frame for atmospheric depth. */
  haze?: string
}

/**
 * Draw the photographic environment for a frame.
 *
 * Returns true when a plate was drawn (caller should skip its procedural
 * backdrop), false when it should fall back to the drawn scene.
 */
export function photoBackdrop(
  ctx: CanvasRenderingContext2D,
  f: FrameInfo,
  o: BackdropOpts = {},
): boolean {
  const category = o.category ?? f.channel.category
  const name = plateName(category, f.seed + f.segIndex * 17)
  if (!name) return false
  const img = plateImage(name)
  if (!img) return false

  const { w, h } = f
  ctx.save()
  drawPhotograph(ctx, img, {
    w, h,
    seed: f.seed + f.segIndex * 31,
    t: f.reduced ? 0 : f.t + f.loopT * 0.15,
    zoom: o.zoom ?? 1,
    motion: f.reduced ? 0 : (o.motion ?? 1),
    biasY: o.biasY ?? 0,
  })

  // ── grade: pull the still toward the station's palette ──
  if (o.tint) {
    ctx.globalCompositeOperation = 'soft-light'
    ctx.globalAlpha = 0.5
    ctx.fillStyle = o.tint
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }

  // ── atmospheric haze along the bottom of frame ──
  if (o.haze) {
    const g = ctx.createLinearGradient(0, h * 0.45, 0, h)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, o.haze)
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = 0.35
    ctx.fillStyle = g
    ctx.fillRect(0, h * 0.45, w, h * 0.55)
    ctx.globalAlpha = 1
  }

  // ── broadcast scrim: keep captions, tickers and bugs readable ──
  const scrim = o.scrim ?? 0.42
  ctx.globalCompositeOperation = 'source-over'
  const bottom = ctx.createLinearGradient(0, h * 0.52, 0, h)
  bottom.addColorStop(0, 'rgba(2,4,10,0)')
  bottom.addColorStop(1, `rgba(2,4,10,${scrim})`)
  ctx.fillStyle = bottom
  ctx.fillRect(0, h * 0.52, w, h * 0.48)

  const top = ctx.createLinearGradient(0, 0, 0, h * 0.22)
  top.addColorStop(0, `rgba(2,4,10,${scrim * 0.7})`)
  top.addColorStop(1, 'rgba(2,4,10,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, w, h * 0.22)

  ctx.restore()
  return true
}
