/**
 * The film pass — procedural realism laid over the composited frame.
 *
 * Photographic plates supply the environment; this module supplies the
 * camera. It is what makes a still plus vector characters read as one
 * photographed image instead of two layers:
 *
 *   bloom     — bright areas halate into their surroundings, the way light
 *               actually spills across a lens
 *   grain     — a moving photochemical noise floor, so nothing looks like
 *               clean vector fills
 *   haze      — atmospheric depth between the subject and the lens
 *   shadow    — contact shadows that seat drawn subjects into the plate
 *   lightWrap — a faint rim of the plate's own light around a subject
 *
 * Everything here is a no-op-safe progressive enhancement: if a context
 * lacks a feature (no `filter`, no patterns, zero-sized canvas) the helpers
 * return quietly rather than throwing mid-broadcast.
 */

import type { FrameInfo } from '../types'

type Ctx2D = CanvasRenderingContext2D

/**
 * Global switch for the film pass. Grain and bloom are per-pixel effects;
 * on a weak GPU they are the most expensive thing on screen, so the
 * settings panel can turn them off (the photographic plates stay).
 */
export const film = { enabled: true }

/** Resolve the device-pixel size of a context's canvas (dpr-aware). */
function deviceSize(ctx: Ctx2D): { w: number; h: number } {
  const c = ctx.canvas
  return { w: c?.width ?? 0, h: c?.height ?? 0 }
}

// ─────────────────────────────── grain ───────────────────────────────

let grainTile: HTMLCanvasElement | null = null
let grainPattern: CanvasPattern | null = null
let grainPatternKey = ''

/** A tileable field of sensor noise, built once and reused. */
function tile(): HTMLCanvasElement | null {
  if (grainTile) return grainTile
  if (typeof document === 'undefined') return null
  const size = 128
  const el = document.createElement('canvas')
  el.width = size
  el.height = size
  const tctx = el.getContext('2d')
  if (!tctx) return null
  const img = tctx.createImageData(size, size)
  const d = img.data
  // monochrome noise around mid-grey; 'overlay' leaves mid-grey neutral
  for (let i = 0; i < d.length; i += 4) {
    const v = 118 + Math.random() * 74
    d[i] = d[i + 1] = d[i + 2] = v
    d[i + 3] = 255
  }
  tctx.putImageData(img, 0, 0)
  grainTile = el
  return el
}

/**
 * Photochemical grain. `t` walks the noise field so it shimmers between
 * frames the way real film does; under reduced motion it holds still.
 */
export function filmGrain(
  ctx: Ctx2D,
  amount = 0.06,
  t = 0,
  animate = true,
): void {
  const dev = deviceSize(ctx)
  if (!dev.w || !dev.h || amount <= 0) return
  const el = tile()
  if (!el) return

  if (!grainPattern || grainPatternKey !== String(dev.w)) {
    grainPattern = ctx.createPattern(el, 'repeat')
    grainPatternKey = String(dev.w)
  }
  if (!grainPattern) return

  const step = animate ? Math.floor(t * 24) : 0
  const ox = (step * 37) % 128
  const oy = (step * 61) % 128

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = Math.min(1, amount)
  ctx.translate(-ox, -oy)
  ctx.fillStyle = grainPattern
  ctx.fillRect(0, 0, dev.w + 128, dev.h + 128)
  ctx.restore()
}

// ─────────────────────────────── bloom ───────────────────────────────

let scratch: HTMLCanvasElement | null = null

/**
 * Halation / bloom. Downsamples the frame, squares the signal (a cheap
 * threshold that keeps only the bright parts), blurs it and adds it back
 * with `lighter` — the way highlights bloom across a real lens.
 */
export function bloom(ctx: Ctx2D, w: number, h: number, amount = 0.32, radius = 14): void {
  const src = ctx.canvas
  const dev = deviceSize(ctx)
  if (!src || !dev.w || !dev.h || amount <= 0) return

  const tw = Math.max(1, Math.round(dev.w / 4))
  const th = Math.max(1, Math.round(dev.h / 4))
  if (!scratch) {
    if (typeof document === 'undefined') return
    scratch = document.createElement('canvas')
  }
  if (scratch.width !== tw || scratch.height !== th) {
    scratch.width = tw
    scratch.height = th
  }
  const sctx = scratch.getContext('2d')
  if (!sctx) return

  sctx.setTransform(1, 0, 0, 1, 0, 0)
  sctx.globalCompositeOperation = 'source-over'
  sctx.clearRect(0, 0, tw, th)
  sctx.drawImage(src, 0, 0, dev.w, dev.h, 0, 0, tw, th)
  try {
    // v² — dark stays dark, highlights survive to bloom
    sctx.globalCompositeOperation = 'multiply'
    sctx.drawImage(scratch, 0, 0)
  } catch { /* self-draw unsupported; bloom on the plain downsample */ }
  sctx.globalCompositeOperation = 'source-over'

  const dpr = Math.max(dev.w / Math.max(1, w), dev.h / Math.max(1, h))
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = Math.min(1, amount)
  try {
    ctx.filter = `blur(${Math.max(1, Math.round(radius * dpr))}px)`
  } catch { /* no canvas filters: still a soft upscale */ }
  ctx.drawImage(scratch, 0, 0, tw, th, 0, 0, dev.w, dev.h)
  ctx.restore()
}

// ─────────────────────────────── atmosphere ───────────────────────────────

/** A band of atmosphere between subject and lens. */
export function haze(
  ctx: Ctx2D,
  w: number,
  h: number,
  color: string,
  strength = 0.2,
  from = 0.4,
): void {
  if (strength <= 0) return
  const g = ctx.createLinearGradient(0, h * from, 0, h)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, color)
  ctx.save()
  ctx.globalAlpha = Math.min(1, strength)
  ctx.fillStyle = g
  ctx.fillRect(0, h * from, w, h * (1 - from))
  ctx.restore()
}

// ──────────────────────── seating subjects in the plate ────────────────────────

/** Run `draw` with a soft drop shadow, so drawn casts sit in the photograph. */
export function withShadow(
  ctx: Ctx2D,
  opts: { blur?: number; color?: string; offsetY?: number; offsetX?: number },
  draw: () => void,
): void {
  ctx.save()
  ctx.shadowColor = opts.color ?? 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = opts.blur ?? 18
  ctx.shadowOffsetY = opts.offsetY ?? 6
  ctx.shadowOffsetX = opts.offsetX ?? 0
  draw()
  ctx.restore()
}

/** A soft contact shadow on the ground — grounds a subject in the plate. */
export function contactShadow(
  ctx: Ctx2D,
  x: number,
  y: number,
  rx: number,
  ry = rx * 0.22,
  alpha = 0.5,
): void {
  ctx.save()
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx)
  g.addColorStop(0, `rgba(0,0,0,${alpha})`)
  g.addColorStop(0.55, `rgba(0,0,0,${alpha * 0.45})`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.translate(x, y)
  ctx.scale(1, ry / rx)
  ctx.translate(-x, -y)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, rx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * Faint rim of the environment's light wrapping a subject — the single
 * cheapest cue that a drawn character is standing in a photographed room.
 */
export function lightWrap(
  ctx: Ctx2D,
  color: string,
  blur: number,
  alpha: number,
  draw: () => void,
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = alpha
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  draw()
  ctx.restore()
}

// ─────────────────────────────── the pass ───────────────────────────────

export interface FilmOpts {
  /** Grain strength, 0..0.2. */
  grain?: number
  /** Bloom strength, 0..1. */
  bloom?: number
  /** Bloom radius in CSS pixels. */
  radius?: number
  /** Haze colour for atmospheric depth. */
  haze?: string
  hazeStrength?: number
}

/**
 * The whole film pass, in the order a real signal chain would run:
 * haze → bloom → grain.
 */
export function filmPass(ctx: Ctx2D, f: FrameInfo, o: FilmOpts = {}): void {
  if (!film.enabled) return
  const { w, h } = f
  if (o.haze) haze(ctx, w, h, o.haze, o.hazeStrength ?? 0.18)
  bloom(ctx, w, h, o.bloom ?? 0.3, o.radius ?? 14)
  filmGrain(ctx, o.grain ?? 0.055, f.now, !f.reduced)
}
