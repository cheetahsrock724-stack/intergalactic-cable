/**
 * Shared canvas drawing helpers. All randomness is derived from (seed, index)
 * so frames are stable and frame-rate independent.
 */

import { rand2 } from './rng'

export function rr(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

export function circle(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number,
): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
}

export function starShape(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r1: number, r2: number, points: number, rot: number,
): void {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2
    const a = rot + (i * Math.PI) / points
    const px = x + Math.cos(a) * r
    const py = y + Math.sin(a) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/** Vertical gradient background. */
export function sky(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  c0: string, c1: string, c2?: string,
): void {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, c0)
  g.addColorStop(0.6, c1)
  g.addColorStop(1, c2 ?? c1)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/** Deterministic twinkling starfield with slow drift. */
export function starfield(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, seed: number, t: number,
  count = 90, drift = 4,
): void {
  for (let i = 0; i < count; i++) {
    const x = (rand2(seed, i * 3) * w + t * drift * (0.3 + rand2(seed, i * 3 + 1))) % w
    const y = rand2(seed, i * 3 + 1) * h
    const r = 0.5 + rand2(seed, i * 3 + 2) * 1.4
    const tw = 0.45 + 0.55 * Math.sin(t * (1 + rand2(seed, i) * 2.5) + i * 1.7)
    ctx.fillStyle = `rgba(255,255,255,${(0.25 + 0.6 * tw).toFixed(3)})`
    circle(ctx, (x + w) % w, y, r)
    ctx.fill()
  }
}

/** Ringed planet. */
export function planet(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  base: string, shade: string, ring?: string, tilt = -0.35,
): void {
  if (ring) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.strokeStyle = ring
    ctx.lineWidth = Math.max(2, r * 0.12)
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 1.7, r * 0.5, 0, Math.PI, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.2, x, y, r)
  g.addColorStop(0, base)
  g.addColorStop(1, shade)
  ctx.fillStyle = g
  circle(ctx, x, y, r)
  ctx.fill()
  if (ring) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(tilt)
    ctx.strokeStyle = ring
    ctx.lineWidth = Math.max(2, r * 0.12)
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 1.7, r * 0.5, 0, 0, Math.PI)
    ctx.stroke()
    ctx.restore()
  }
}

/** Cartoon alien head: blobby body, N eyes, talky mouth. */
export interface AlienOpts {
  x: number
  y: number
  s: number // head radius
  color: string
  shade: string
  eyes?: number // 1..3
  blink: number // 0..1 (1 = closed)
  talk: number // 0..1 mouth open
  rot?: number
  antenna?: boolean
  pupilColor?: string
}

export function alien(ctx: CanvasRenderingContext2D, o: AlienOpts): void {
  const eyes = o.eyes ?? 2
  ctx.save()
  ctx.translate(o.x, o.y)
  if (o.rot) ctx.rotate(o.rot)
  // antenna
  if (o.antenna) {
    ctx.strokeStyle = o.shade
    ctx.lineWidth = Math.max(2, o.s * 0.09)
    ctx.beginPath()
    ctx.moveTo(0, -o.s * 0.9)
    ctx.quadraticCurveTo(o.s * 0.2, -o.s * 1.5, o.s * 0.45, -o.s * 1.45)
    ctx.stroke()
    ctx.fillStyle = '#f472b6'
    circle(ctx, o.s * 0.45, -o.s * 1.45, o.s * 0.14)
    ctx.fill()
  }
  // head blob
  const g = ctx.createRadialGradient(-o.s * 0.3, -o.s * 0.35, o.s * 0.2, 0, 0, o.s)
  g.addColorStop(0, o.color)
  g.addColorStop(1, o.shade)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(0, 0, o.s, o.s * 1.08, 0, 0, Math.PI * 2)
  ctx.fill()
  // eyes
  const spread = o.s * 0.42
  for (let i = 0; i < eyes; i++) {
    const ex = eyes === 1 ? 0 : (i - (eyes - 1) / 2) * spread
    const ey = eyes === 3 && i === 1 ? -o.s * 0.35 : -o.s * 0.12
    const er = o.s * (eyes === 3 ? 0.2 : 0.24)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(ex, ey, er, er * (1 - o.blink * 0.85), 0, 0, Math.PI * 2)
    ctx.fill()
    if (o.blink < 0.6) {
      ctx.fillStyle = o.pupilColor ?? '#1e1b4b'
      circle(ctx, ex + er * 0.15, ey + er * 0.1, er * 0.45)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      circle(ctx, ex + er * 0.35, ey - er * 0.15, er * 0.16)
      ctx.fill()
    }
  }
  // mouth
  const mh = 0.08 + o.talk * 0.5
  ctx.fillStyle = '#3b0764'
  ctx.beginPath()
  ctx.ellipse(0, o.s * 0.5, o.s * 0.3, o.s * mh, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Blink value (0 open .. 1 closed) from a periodic blink schedule. */
export function blinkPhase(t: number, seed: number, period = 3.4): number {
  const off = rand2(seed, 77) * period
  const p = (t + off) % period
  return p < 0.12 ? Math.sin((p / 0.12) * Math.PI) : 0
}

/** Talk value 0..1 — animated while "speaking". */
export function talkPhase(t: number, speed = 11, active = true): number {
  if (!active) return 0.05
  return 0.25 + 0.75 * Math.abs(Math.sin(t * speed) * Math.sin(t * speed * 0.37))
}

export function text(
  ctx: CanvasRenderingContext2D,
  str: string, x: number, y: number,
  opts: {
    font?: string
    color?: string
    align?: CanvasTextAlign
    baseline?: CanvasTextBaseline
    shadow?: string
    maxWidth?: number
    stroke?: string
    strokeWidth?: number
  } = {},
): void {
  ctx.save()
  ctx.font = opts.font ?? '16px system-ui, sans-serif'
  ctx.textAlign = opts.align ?? 'left'
  ctx.textBaseline = opts.baseline ?? 'alphabetic'
  if (opts.shadow) {
    ctx.shadowColor = opts.shadow
    ctx.shadowBlur = 10
  }
  if (opts.stroke) {
    ctx.lineWidth = opts.strokeWidth ?? 4
    ctx.strokeStyle = opts.stroke
    ctx.lineJoin = 'round'
    ctx.strokeText(str, x, y, opts.maxWidth)
  }
  ctx.fillStyle = opts.color ?? '#fff'
  ctx.fillText(str, x, y, opts.maxWidth)
  ctx.restore()
}

/** Shrink font size until the text fits maxWidth. Returns used size. */
export function fitFont(
  ctx: CanvasRenderingContext2D,
  str: string, weight: string, size: number, maxWidth: number,
): number {
  let s = size
  ctx.font = `${weight} ${s}px system-ui, sans-serif`
  while (ctx.measureText(str).width > maxWidth && s > 8) {
    s -= 1
    ctx.font = `${weight} ${s}px system-ui, sans-serif`
  }
  return s
}

/** Wraps text into lines that fit maxWidth. */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  str: string, font: string, maxWidth: number, maxLines = 3,
): string[] {
  ctx.save()
  ctx.font = font
  const words = str.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
      if (lines.length === maxLines) break
    } else {
      line = test
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  ctx.restore()
  return lines
}

/** Scrolling ticker along the bottom of the scene. */
export function marquee(
  ctx: CanvasRenderingContext2D,
  str: string, y: number, t: number, w: number, h: number,
  opts: { bg?: string; color?: string; speed?: number; font?: string } = {},
): void {
  const speed = opts.speed ?? 70
  ctx.save()
  ctx.fillStyle = opts.bg ?? 'rgba(3,6,20,0.85)'
  ctx.fillRect(0, y, w, h)
  ctx.beginPath()
  ctx.rect(0, y, w, h)
  ctx.clip()
  const font = opts.font ?? `600 ${Math.round(h * 0.5)}px system-ui, sans-serif`
  ctx.font = font
  const tw = ctx.measureText(str).width + 80
  const x = w - ((t * speed) % (w + tw))
  ctx.fillStyle = opts.color ?? '#e2e8f0'
  ctx.textBaseline = 'middle'
  ctx.fillText(str, x, y + h / 2)
  ctx.fillText(str, x + tw, y + h / 2)
  ctx.restore()
}

/** News-style lower third banner. */
export function lowerThird(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, headline: string, accent: string,
  progress = 1,
): void {
  ctx.save()
  ctx.fillStyle = 'rgba(3,7,23,0.88)'
  rr(ctx, x, y, w, h, 6)
  ctx.fill()
  ctx.fillStyle = accent
  rr(ctx, x, y, Math.max(8, w * 0.22), h, 6)
  ctx.fill()
  ctx.fillStyle = '#030717'
  const lh = Math.round(h * 0.46)
  text(ctx, label, x + w * 0.11, y + h / 2, {
    font: `800 ${lh}px system-ui, sans-serif`,
    align: 'center', baseline: 'middle', color: '#fff',
  })
  const fs = fitFont(ctx, headline, '700', Math.round(h * 0.44), w * 0.72)
  text(ctx, headline, x + w * 0.25, y + h / 2, {
    font: `700 ${fs}px system-ui, sans-serif`,
    baseline: 'middle', color: '#f8fafc',
  })
  if (progress > 0 && progress < 1) {
    ctx.fillStyle = accent
    ctx.fillRect(x, y + h - 3, w * progress, 3)
  }
  ctx.restore()
}

/** Comic speech bubble with tail. */
export function speechBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  tailX: number, tailY: number, fill = 'rgba(248,250,252,0.96)',
): void {
  ctx.save()
  ctx.fillStyle = fill
  rr(ctx, x, y, w, h, h * 0.28)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(tailX - h * 0.12, y + h - 2)
  ctx.lineTo(tailX + h * 0.12, y + h - 2)
  ctx.lineTo(tailX + (tailX > x + w / 2 ? h * 0.2 : -h * 0.2), tailY)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** Four-point sparkle. */
export function sparkle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, color = '#fde047', t = 0,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(t * 2)
  ctx.fillStyle = color
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.quadraticCurveTo(r * 0.15, -r * 0.15, r, 0)
  ctx.quadraticCurveTo(r * 0.15, r * 0.15, 0, r)
  ctx.quadraticCurveTo(-r * 0.15, r * 0.15, -r, 0)
  ctx.quadraticCurveTo(-r * 0.15, -r * 0.15, 0, -r)
  ctx.fill()
  ctx.restore()
}

/** Simple animated bar-graph equalizer. */
export function equalizer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  bars: number, t: number, color: string, levels?: Uint8Array | null,
): void {
  const bw = w / bars
  for (let i = 0; i < bars; i++) {
    let v: number
    if (levels && levels.length) {
      const idx = Math.floor((i / bars) * levels.length)
      v = Math.max(0.06, levels[idx] / 255)
    } else {
      v =
        0.25 +
        0.6 *
          Math.abs(
            Math.sin(t * 3 + i * 1.3) * 0.6 + Math.sin(t * 7.3 + i * 2.1) * 0.4,
          )
    }
    ctx.fillStyle = color
    rr(ctx, x + i * bw + bw * 0.15, y + h * (1 - v), bw * 0.7, h * v, 2)
    ctx.fill()
  }
}

// ---- static / noise -----------------------------------------------------

let noiseTiles: HTMLCanvasElement[] | null = null
const NOISE_TILE = 96

function getNoiseTiles(): HTMLCanvasElement[] {
  if (noiseTiles) return noiseTiles
  noiseTiles = []
  for (let n = 0; n < 4; n++) {
    const c = document.createElement('canvas')
    c.width = NOISE_TILE
    c.height = NOISE_TILE
    const g = c.getContext('2d')
    if (!g) continue
    const img = g.createImageData(NOISE_TILE, NOISE_TILE)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rand2(n * 999 + 1, i) * 255)
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    g.putImageData(img, 0, 0)
    noiseTiles.push(c)
  }
  return noiseTiles
}

/** Cheap animated TV static via pre-rendered noise tiles. */
export function staticNoise(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, t: number, alpha = 1, tint?: string,
): void {
  const tiles = getNoiseTiles()
  if (!tiles.length) return
  const tile = tiles[Math.floor(t * 22) % tiles.length]
  ctx.save()
  ctx.globalAlpha = alpha
  const pat = ctx.createPattern(tile, 'repeat')
  if (pat) {
    ctx.fillStyle = pat
    ctx.fillRect(0, 0, w, h)
  }
  if (tint) {
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = tint
    ctx.fillRect(0, 0, w, h)
  }
  ctx.restore()
}

/** Horizontal roll bar + static used while tuning between channels. */
export function tuningScreen(
  ctx: CanvasRenderingContext2D, w: number, h: number, t: number,
): void {
  ctx.fillStyle = '#0a0a12'
  ctx.fillRect(0, 0, w, h)
  staticNoise(ctx, w, h, t, 0.55)
  const barY = ((t * 260) % (h + 160)) - 80
  const g = ctx.createLinearGradient(0, barY - 60, 0, barY + 60)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.28)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, barY - 60, w, 120)
}

/** CRT scanlines drawn on the canvas itself (fallback when CSS is off). */
export function scanlines(
  ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.12,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#000'
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1.4)
  ctx.restore()
}

/** Vignette darkening at the screen edges. */
export function vignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.45,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  )
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.42)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/** Small badge with text — used for station logos in-scene. */
export function badge(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, label: string, bg: string, fg = '#fff', scale = 1,
): void {
  ctx.save()
  const fs = 13 * scale
  ctx.font = `800 ${fs}px system-ui, sans-serif`
  const tw = ctx.measureText(label).width
  const pw = tw + 14 * scale
  const ph = fs + 9 * scale
  ctx.globalAlpha = 0.92
  ctx.fillStyle = bg
  rr(ctx, x, y, pw, ph, ph / 2)
  ctx.fill()
  ctx.fillStyle = fg
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + 7 * scale, y + ph / 2 + 1)
  ctx.restore()
}

/** Deterministic drifting particles (dust / spores / snow). */
export function particles(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, seed: number, t: number, count: number,
  opts: { color?: string; size?: number; fall?: number; drift?: number } = {},
): void {
  const fall = opts.fall ?? 26
  const drift = opts.drift ?? 10
  for (let i = 0; i < count; i++) {
    const speed = 0.4 + rand2(seed, i * 5)
    const x =
      (rand2(seed, i * 5 + 1) * w + Math.sin(t * 0.7 + i) * drift) % w
    const y = (rand2(seed, i * 5 + 2) * h + t * fall * speed) % h
    const r = (opts.size ?? 2) * (0.5 + rand2(seed, i * 5 + 3))
    ctx.fillStyle = opts.color ?? 'rgba(255,255,255,0.5)'
    circle(ctx, (x + w) % w, y, r)
    ctx.fill()
  }
}

/** Rain with a horizontal slant (for sideways alien rain). */
export function rain(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, seed: number, t: number,
  opts: { color?: string; slant?: number; count?: number; speed?: number } = {},
): void {
  const count = opts.count ?? 70
  const slant = opts.slant ?? 1.6
  const speed = opts.speed ?? 420
  ctx.save()
  ctx.strokeStyle = opts.color ?? 'rgba(125,211,252,0.6)'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    const x0 = (rand2(seed, i * 2) * (w + h)) % (w + h)
    const y = (rand2(seed, i * 2 + 1) * h + t * speed * (0.6 + rand2(seed, i))) % h
    const x = (x0 + y * slant) % (w + h)
    ctx.moveTo(x, y)
    ctx.lineTo(x + 6 * slant, y + 10)
  }
  ctx.stroke()
  ctx.restore()
}

/** Progress ring. */
export function ring(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, p: number,
  color: string, track = 'rgba(255,255,255,0.15)', lw = 4,
): void {
  ctx.save()
  ctx.lineWidth = lw
  ctx.strokeStyle = track
  circle(ctx, x, y, r)
  ctx.stroke()
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p))
  ctx.stroke()
  ctx.restore()
}
