/**
 * Strange Signals — atmospheric transmissions: procedurally evolving
 * sigils, interference bands, radar sweep, drifting glyph alphabet.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import { between, rand2 } from '../lib/rng'
import {
  circle, rr, staticNoise, starfield, text,
} from '../lib/draw'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#022c22'
  circle(ctx, 0, 0, s * 0.48)
  ctx.fill()
  ctx.strokeStyle = '#34d399'
  ctx.lineWidth = s * 0.05
  // radar sweep
  const a = t * 1.6
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.4, a - 0.5, a)
  ctx.lineTo(0, 0)
  ctx.fillStyle = 'rgba(52,211,153,0.35)'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#6ee7b7'
  circle(ctx, Math.cos(a - 1) * s * 0.3, Math.sin(a - 1) * s * 0.3, s * 0.05)
  ctx.fill()
  ctx.restore()
}

/** Draw a deterministic sigil: circles, lines and arcs from a seed. */
function sigil(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, s: number, seed: number,
  complexity: number, t: number, reduced: boolean, color: string,
): void {
  ctx.save()
  ctx.translate(x, y)
  if (!reduced) ctx.rotate(Math.sin(t * 0.3) * 0.1)
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.02
  // outer circle
  circle(ctx, 0, 0, s)
  ctx.stroke()
  // inner structure grows with complexity
  const n = 2 + Math.min(6, complexity)
  for (let i = 0; i < n; i++) {
    const a1 = rand2(seed, i * 3) * Math.PI * 2
    const a2 = rand2(seed, i * 3 + 1) * Math.PI * 2
    const r1 = s * (0.2 + rand2(seed, i * 3 + 2) * 0.75)
    ctx.beginPath()
    ctx.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1)
    ctx.lineTo(Math.cos(a2) * r1 * (0.4 + rand2(seed, i * 7) * 0.6), Math.sin(a2) * r1)
    ctx.stroke()
    if (i % 2 === 0) {
      ctx.beginPath()
      ctx.arc(0, 0, r1 * 0.55, a1, a2)
      ctx.stroke()
    }
    ctx.fillStyle = color
    circle(ctx, Math.cos(a1) * r1, Math.sin(a1) * r1, s * 0.035)
    ctx.fill()
  }
  // center eye
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = color
  circle(ctx, 0, 0, s * 0.05)
  ctx.fill()
  ctx.restore()
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)

  // near-black backdrop with faint green nebula
  ctx.fillStyle = '#010604'
  ctx.fillRect(0, 0, w, h)
  const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, u * 0.6)
  g.addColorStop(0, 'rgba(6,78,59,0.25)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  starfield(ctx, w, h, seed, reduced ? 0 : t * 0.3, 60, 0.8)

  // main sigil — complexity grows with beat index
  const sigilSeed = seed + f.segIndex * 101
  const pulse = reduced ? 1 : 1 + Math.sin(t * 1.5) * 0.03
  sigil(
    ctx, w * 0.5, h * 0.44, u * 0.22 * pulse, sigilSeed,
    f.beatIndex + 1, t, reduced, 'rgba(52,211,153,0.85)',
  )

  // small companion sigils fading in with beats
  for (let i = 0; i < Math.min(3, f.beatIndex); i++) {
    const sx = between(seed, i * 4 + 50, w * 0.1, w * 0.25)
    const sy = between(seed, i * 4 + 51, h * 0.2, h * 0.7)
    sigil(ctx, i % 2 ? w - sx : sx, sy, u * 0.05, sigilSeed + i * 37, i + 1, t + i, reduced, 'rgba(52,211,153,0.4)')
  }

  // interference bands — occasional horizontal glitches (never when reduced)
  if (!reduced) {
    const glitchOn = Math.sin(t * 1.1) > 0.85
    if (glitchOn) {
      for (let i = 0; i < 3; i++) {
        const gy = rand2(seed, Math.floor(t * 8) * 10 + i) * h
        ctx.fillStyle = `rgba(52,211,153,${0.08 + rand2(seed, i + Math.floor(t * 8)) * 0.1})`
        ctx.fillRect(0, gy, w, 2 + rand2(seed, i) * 10)
      }
      staticNoise(ctx, w, h, t, 0.05, 'rgba(52,211,153,0.4)')
    }
  }

  // drifting glyph alphabet in the margins
  ctx.font = `400 ${u * 0.03}px system-ui`
  const glyphs = ['◬', '⟁', '⟠', '⧗', '◉', '⌬', '⟟', '⧉', '☌', '⚯', '⟴', '⦿']
  for (let i = 0; i < 10; i++) {
    const gx = between(seed, i * 6 + 9, 0, w)
    const gy = (between(seed, i * 6 + 10, 0, h) + (reduced ? 0 : t * 8)) % h
    ctx.fillStyle = `rgba(110,231,183,${0.1 + rand2(seed, i * 6 + 11) * 0.2})`
    ctx.fillText(glyphs[i % glyphs.length], gx, gy)
  }

  // radar sweep line
  if (!reduced) {
    const ra = t * 0.8
    ctx.save()
    ctx.translate(w * 0.5, h * 0.44)
    const rg = ctx.createLinearGradient(0, 0, Math.cos(ra) * u * 0.26, Math.sin(ra) * u * 0.26)
    rg.addColorStop(0, 'rgba(52,211,153,0.35)')
    rg.addColorStop(1, 'rgba(52,211,153,0)')
    ctx.strokeStyle = rg
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(ra) * u * 0.26, Math.sin(ra) * u * 0.26)
    ctx.stroke()
    ctx.restore()
  }

  // signal header
  ctx.fillStyle = 'rgba(1,6,4,0.85)'
  rr(ctx, w * 0.02, h * 0.02, w * 0.5, h * 0.1, 8)
  ctx.fill()
  ctx.strokeStyle = 'rgba(52,211,153,0.4)'
  ctx.stroke()
  text(ctx, `SIGNAL ${String(f.segIndex + 1).padStart(3, '0')}`, w * 0.04, h * 0.055, {
    font: `800 ${u * 0.024}px system-ui`, color: '#6ee7b7', shadow: 'rgba(52,211,153,0.5)',
  })
  text(ctx, 'SOURCE: UNKNOWN • DISTANCE: UNHELPFUL', w * 0.04, h * 0.095, {
    font: `600 ${u * 0.014}px system-ui`, color: 'rgba(110,231,183,0.7)',
  })

  // signal strength meter
  const bars = 5
  for (let i = 0; i < bars; i++) {
    const on = (reduced ? 0.5 : Math.sin(t * 2 + i)) > (i - 2) * 0.3
    ctx.fillStyle = on ? '#34d399' : 'rgba(52,211,153,0.2)'
    rr(ctx, w - w * 0.16 + i * u * 0.022, h * 0.075 - i * u * 0.008, u * 0.014, u * 0.012 + i * u * 0.008, 2)
    ctx.fill()
  }
  text(ctx, 'SIGNAL', w - w * 0.16, h * 0.045, {
    font: `700 ${u * 0.013}px system-ui`, color: 'rgba(110,231,183,0.8)',
  })

  // footer whisper
  ctx.fillStyle = 'rgba(1,6,4,0.8)'
  ctx.fillRect(0, h - h * 0.05, w, h * 0.05)
  const dots = '.'.repeat(1 + (Math.floor(reduced ? 0 : t * 1.5) % 3))
  text(ctx, `listening${dots}`, w * 0.5, h - h * 0.022, {
    font: `600 ${u * 0.015}px system-ui`, align: 'center', baseline: 'middle', color: 'rgba(110,231,183,0.8)',
  })
}
