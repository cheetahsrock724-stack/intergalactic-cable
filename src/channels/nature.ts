/**
 * Alien Nature — parallax ecosystems with original creatures:
 * hopping Bumblegloops, drifting Sky Squids, grazing Mossbacks.
 */

import type { ChannelRenderer, FrameInfo, LogoRenderer } from '../types'
import { between, rand2 } from '../lib/rng'
import {
  circle, marquee, particles, planet, rr, sky, starfield, text,
} from '../lib/draw'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#365314'
  circle(ctx, 0, 0, s * 0.48)
  ctx.fill()
  ctx.strokeStyle = '#84cc16'
  ctx.lineWidth = s * 0.07
  ctx.beginPath()
  ctx.moveTo(0, s * 0.3)
  ctx.quadraticCurveTo(0, -s * 0.1, Math.sin(t * 0.8) * s * 0.18, -s * 0.3)
  ctx.stroke()
  ctx.fillStyle = '#a3e635'
  circle(ctx, Math.sin(t * 0.8) * s * 0.18, -s * 0.3, s * 0.09)
  ctx.fill()
  ctx.restore()
}

function drawGrass(
  ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, t: number,
  baseY: number, color: string, reduced: boolean,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let i = 0; i < 46; i++) {
    const x = between(seed, i, 0, w)
    const hh = between(seed, i + 900, h * 0.03, h * 0.09)
    const sway = reduced ? 0 : Math.sin(t * 1.4 + i) * 5
    ctx.moveTo(x, baseY)
    ctx.quadraticCurveTo(x + sway * 0.5, baseY - hh * 0.6, x + sway, baseY - hh)
  }
  ctx.stroke()
}

function bumblegloop(
  ctx: CanvasRenderingContext2D, x: number, y: number, s: number,
  t: number, hue: number, reduced: boolean,
): void {
  const hop = reduced ? 0 : Math.abs(Math.sin(t * 2.4))
  const yy = y - hop * s * 0.55
  const squash = reduced ? 1 : 1 + Math.sin(t * 2.4 + Math.PI / 2) * 0.08
  ctx.save()
  ctx.translate(x, yy)
  ctx.scale(1 / squash, squash)
  // legs
  ctx.strokeStyle = `hsl(${hue}, 60%, 32%)`
  ctx.lineWidth = s * 0.09
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const lx = -s * 0.4 + i * s * 0.4
    const step = reduced ? 0 : Math.sin(t * 8 + i * 2) * s * 0.12
    ctx.beginPath()
    ctx.moveTo(lx, s * 0.5)
    ctx.lineTo(lx + step, s * 0.95)
    ctx.stroke()
  }
  // round body
  const g = ctx.createRadialGradient(-s * 0.25, -s * 0.3, s * 0.1, 0, 0, s * 0.8)
  g.addColorStop(0, `hsl(${hue}, 85%, 68%)`)
  g.addColorStop(1, `hsl(${hue}, 70%, 42%)`)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.75, s * 0.66, 0, 0, Math.PI * 2)
  ctx.fill()
  // fuzz
  ctx.strokeStyle = `hsla(${hue}, 90%, 80%, 0.6)`
  ctx.lineWidth = 1.5
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.6)
    ctx.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.74)
    ctx.stroke()
  }
  // big happy eyes
  for (const ex of [-s * 0.26, s * 0.22]) {
    ctx.fillStyle = '#fff'
    circle(ctx, ex, -s * 0.16, s * 0.17)
    ctx.fill()
    ctx.fillStyle = '#1e1b4b'
    circle(ctx, ex + s * 0.04, -s * 0.13, s * 0.08)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    circle(ctx, ex + s * 0.08, -s * 0.2, s * 0.03)
    ctx.fill()
  }
  // smile
  ctx.strokeStyle = '#4c1d95'
  ctx.lineWidth = s * 0.05
  ctx.beginPath()
  ctx.arc(0, s * 0.1, s * 0.22, 0.2, Math.PI - 0.2)
  ctx.stroke()
  ctx.restore()
}

function skySquid(
  ctx: CanvasRenderingContext2D, x: number, y: number, s: number,
  t: number, f: FrameInfo, phase: number,
): void {
  const drift = f.reduced ? 0 : Math.sin(t * 0.6 + phase) * s * 0.3
  const yy = y + (f.reduced ? 0 : Math.sin(t * 0.9 + phase) * s * 0.15)
  ctx.save()
  ctx.translate(x + drift, yy)
  // mantle
  const g = ctx.createRadialGradient(0, -s * 0.2, s * 0.1, 0, 0, s)
  g.addColorStop(0, '#c4b5fd')
  g.addColorStop(1, '#6d28d9')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(0, -s * 0.1, s * 0.55, s * 0.75, 0, Math.PI, Math.PI * 2)
  ctx.ellipse(0, -s * 0.1, s * 0.55, s * 0.35, 0, 0, Math.PI)
  ctx.fill()
  // lantern eyes
  const glow = 0.6 + 0.4 * Math.sin(t * 2 + phase)
  for (const ex of [-s * 0.22, s * 0.22]) {
    ctx.fillStyle = `rgba(253,224,71,${glow})`
    circle(ctx, ex, -s * 0.25, s * 0.12)
    ctx.fill()
    ctx.fillStyle = '#312e81'
    circle(ctx, ex, -s * 0.25, s * 0.05)
    ctx.fill()
  }
  // tentacles
  ctx.strokeStyle = '#8b5cf6'
  ctx.lineWidth = s * 0.08
  ctx.lineCap = 'round'
  for (let i = 0; i < 6; i++) {
    const tx = -s * 0.4 + i * s * 0.16
    const wave = f.reduced ? 0.2 : Math.sin(t * 2 + i * 0.9 + phase)
    ctx.beginPath()
    ctx.moveTo(tx, s * 0.2)
    ctx.quadraticCurveTo(tx + wave * s * 0.3, s * 0.6, tx + wave * s * 0.5, s)
    ctx.stroke()
  }
  ctx.restore()
}

function mossback(
  ctx: CanvasRenderingContext2D, x: number, y: number, s: number,
  t: number, f: FrameInfo,
): void {
  const walk = f.reduced ? 0 : t * 12
  ctx.save()
  ctx.translate(x, y)
  // legs
  ctx.strokeStyle = '#57534e'
  ctx.lineWidth = s * 0.14
  ctx.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    const lx = -s * 0.55 + i * s * 0.37
    const step = f.reduced ? 0 : Math.sin(walk * 0.3 + i * Math.PI) * s * 0.08
    ctx.beginPath()
    ctx.moveTo(lx, s * 0.1)
    ctx.lineTo(lx + step, s * 0.7)
    ctx.stroke()
  }
  // body
  const g = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.2)
  g.addColorStop(0, '#78716c')
  g.addColorStop(1, '#44403c')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.85, s * 0.45, 0, 0, Math.PI * 2)
  ctx.fill()
  // head
  ctx.fillStyle = '#78716c'
  ctx.beginPath()
  ctx.ellipse(s * 0.8, -s * 0.05, s * 0.28, s * 0.22, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1c1917'
  circle(ctx, s * 0.9, -s * 0.12, s * 0.04)
  ctx.fill()
  // garden on shell: little flowers + moss
  ctx.fillStyle = '#65a30d'
  ctx.beginPath()
  ctx.ellipse(0, -s * 0.38, s * 0.66, s * 0.2, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 7; i++) {
    const fx = -s * 0.55 + i * s * 0.18
    const fh = s * (0.14 + rand2(42, i) * 0.16)
    const sway = f.reduced ? 0 : Math.sin(t + i * 1.4) * 3
    ctx.strokeStyle = '#4d7c0f'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(fx, -s * 0.38)
    ctx.lineTo(fx + sway, -s * 0.38 - fh)
    ctx.stroke()
    ctx.fillStyle = `hsl(${300 + i * 18}, 85%, 72%)`
    circle(ctx, fx + sway, -s * 0.38 - fh, s * 0.045)
    ctx.fill()
  }
  // sigh cloud every 10s
  if (!f.reduced) {
    const cyc = (t % 10) / 10
    if (cyc > 0.75) {
      const p = (cyc - 0.75) / 0.25
      ctx.fillStyle = `rgba(226,232,240,${0.5 * (1 - p)})`
      circle(ctx, s * 1.1 + p * s * 0.4, -s * 0.4 - p * s * 0.5, s * 0.08 + p * s * 0.14)
      ctx.fill()
    }
  }
  ctx.restore()
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)
  const segId = f.segment.id

  // ── sky per ecosystem ──
  if (segId === 'an-bumblegloop') {
    sky(ctx, w, h, '#2e1065', '#7c3aed', '#c084fc')
    // three patient suns
    for (let i = 0; i < 3; i++) {
      const sx = w * (0.15 + i * 0.3)
      const sy = h * (0.16 + (i % 2) * 0.08)
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, u * 0.08)
      g.addColorStop(0, ['#fef08a', '#fda4af', '#a5f3fc'][i])
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      circle(ctx, sx, sy, u * 0.08)
      ctx.fill()
    }
  } else if (segId === 'an-skysquid') {
    sky(ctx, w, h, '#0c4a6e', '#0369a1', '#0ea5e9')
    // gas world bands below
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `hsla(${200 + i * 8}, 80%, ${30 + i * 6}%, 0.5)`
      ctx.fillRect(0, h * (0.7 + i * 0.05), w, h * 0.045)
    }
    particles(ctx, w, h, seed, reduced ? 0 : t, 26, {
      color: 'rgba(224,242,254,0.4)', size: 2.5, fall: -14, drift: 24,
    })
  } else {
    sky(ctx, w, h, '#0f172a', '#1e293b', '#334155')
    starfield(ctx, w, h, seed, reduced ? 0 : t, 60, 1)
    planet(ctx, w * 0.82, h * 0.18, u * 0.1, '#a5b4fc', '#3730a3')
  }

  // ── floating islands / ground ──
  if (segId === 'an-skysquid') {
    // floating rocks
    for (let i = 0; i < 3; i++) {
      const fx = w * (0.12 + i * 0.35)
      const fy = h * (0.55 + (i % 2) * 0.2) + (reduced ? 0 : Math.sin(t * 0.5 + i) * 6)
      ctx.fillStyle = '#1e3a5f'
      ctx.beginPath()
      ctx.moveTo(fx - u * 0.07, fy)
      ctx.lineTo(fx + u * 0.07, fy)
      ctx.lineTo(fx, fy + u * 0.06)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#155e75'
      ctx.beginPath()
      ctx.ellipse(fx, fy, u * 0.07, u * 0.016, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // pod of sky squids
    skySquid(ctx, w * 0.3, h * 0.34, u * 0.13, t, f, 0)
    skySquid(ctx, w * 0.62, h * 0.28, u * 0.09, t, f, 2.1)
    skySquid(ctx, w * 0.48, h * 0.5, u * 0.06, t, f, 4.2)
  } else if (segId === 'an-bumblegloop') {
    // rolling lavender hills
    ctx.fillStyle = '#7e22ce'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.72)
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, h * 0.72 - Math.sin(x * 0.01 + 1) * h * 0.05)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.fill()
    ctx.fillStyle = '#581c87'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.84)
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, h * 0.84 - Math.sin(x * 0.014 + 3) * h * 0.04)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.fill()
    drawGrass(ctx, w, h, seed, t, h * 0.9, 'rgba(216,180,254,0.5)', reduced)
    // herd of bumblegloops
    bumblegloop(ctx, w * 0.24, h * 0.78, u * 0.075, t, 285, reduced)
    bumblegloop(ctx, w * 0.5, h * 0.83, u * 0.1, t + 1.2, 320, reduced)
    bumblegloop(ctx, w * 0.74, h * 0.76, u * 0.06, t + 2.4, 250, reduced)
    // pollen particles
    particles(ctx, w, h, seed, reduced ? 0 : t, 20, {
      color: 'rgba(253,224,71,0.55)', size: 2, fall: -10, drift: 20,
    })
  } else {
    // crystal canyon floor
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, h * 0.78, w, h * 0.22)
    // crystals
    for (let i = 0; i < 7; i++) {
      const cx2 = between(seed, i * 2, 0, w)
      const chh = between(seed, i * 2 + 1, h * 0.08, h * 0.22)
      ctx.fillStyle = `hsla(${180 + i * 20}, 70%, 60%, 0.4)`
      ctx.beginPath()
      ctx.moveTo(cx2 - u * 0.02, h * 0.79)
      ctx.lineTo(cx2, h * 0.79 - chh)
      ctx.lineTo(cx2 + u * 0.02, h * 0.79)
      ctx.closePath()
      ctx.fill()
    }
    mossback(ctx, reduced ? w * 0.45 : ((t * 14) % (w * 1.4)) - w * 0.2, h * 0.72, u * 0.12, t, f)
    particles(ctx, w, h, seed, reduced ? 0 : t, 16, {
      color: 'rgba(163,230,53,0.4)', size: 1.8, fall: 6, drift: 14,
    })
  }

  // documentary title card (fades in during first seconds)
  if (t < 6) {
    const a = Math.min(1, t / 1.2) * (t > 4.5 ? Math.max(0, (6 - t) / 1.5) : 1)
    ctx.fillStyle = `rgba(2,6,23,${0.55 * a})`
    rr(ctx, w * 0.16, h * 0.12, w * 0.68, h * 0.16, 10)
    ctx.fill()
    ctx.globalAlpha = a
    text(ctx, 'ALIEN NATURE', w * 0.5, h * 0.19, {
      font: `800 ${u * 0.035}px system-ui`, align: 'center', color: '#a3e635', shadow: 'rgba(163,230,53,0.5)',
    })
    text(ctx, f.segment.title, w * 0.5, h * 0.245, {
      font: `600 ${u * 0.022}px system-ui`, align: 'center', color: '#ecfccb',
    })
    ctx.globalAlpha = 1
  }

  // narrator chip
  text(ctx, 'Narrated by Sir David Tentaclebone', w - u * 0.03, h * 0.9 - h * 0.085, {
    font: `600 ${u * 0.016}px system-ui`, align: 'right', color: 'rgba(236,252,203,0.85)',
  })
  marquee(ctx, 'ALIEN NATURE • ALL CREATURES IMAGINARY • NO ECOSYSTEMS WERE DISTURBED • ', h - h * 0.075, reduced ? 0 : t, w, h * 0.075, {
    bg: 'rgba(2,6,23,0.85)', color: '#d9f99d', speed: reduced ? 0 : 46,
  })
}
