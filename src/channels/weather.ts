/**
 * Void Weather — animated forecast map: planet regions, moving fronts,
 * sideways rain, crystal fog, gravity storm spiral, presenter corner.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import { between } from '../lib/rng'
import {
  alien, blinkPhase, circle, marquee, planet, rain, rr, sky,
  starfield, talkPhase, text,
} from '../lib/draw'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#0c4a6e'
  circle(ctx, 0, 0, s * 0.48)
  ctx.fill()
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = s * 0.06
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(0, 0, s * (0.16 + i * 0.12), t * (i % 2 ? 1 : -1), t * (i % 2 ? 1 : -1) + 2.2)
    ctx.stroke()
  }
  ctx.restore()
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)
  sky(ctx, w, h, '#020617', '#0c1e3e', '#1e3a8a')
  starfield(ctx, w, h, seed, reduced ? 0 : t, 45, 1)

  const segId = f.segment.id

  // ── forecast map: a big planet disc with regions ──
  const cx = w * 0.56, cy = h * 0.46, R = Math.min(w, h) * 0.33
  planet(ctx, cx, cy, R, '#155e75', '#082f49')

  // region blobs (deterministic)
  for (let i = 0; i < 5; i++) {
    const a = between(seed, i * 2, 0, Math.PI * 2)
    const d = between(seed, i * 2 + 1, R * 0.1, R * 0.72)
    const rx = cx + Math.cos(a) * d
    const ry = cy + Math.sin(a) * d * 0.8
    ctx.fillStyle = `hsla(${190 + i * 16}, 70%, 55%, 0.28)`
    ctx.beginPath()
    ctx.ellipse(rx, ry, R * 0.2, R * 0.13, a, 0, Math.PI * 2)
    ctx.fill()
  }

  // moving fronts — curved lines sweeping across
  const frontX = reduced ? 0 : ((t * 30) % (R * 3)) - R * 1.5
  ctx.save()
  circle(ctx, cx, cy, R)
  ctx.clip()
  ctx.strokeStyle = 'rgba(250,204,21,0.7)'
  ctx.lineWidth = 3
  ctx.setLineDash([10, 8])
  for (let k = -1; k <= 1; k++) {
    ctx.beginPath()
    for (let yy = -R; yy <= R; yy += 8) {
      const xx = cx + frontX + k * R * 0.45 + Math.sin(yy * 0.02 + t) * 18
      if (yy === -R) ctx.moveTo(xx, cy + yy)
      else ctx.lineTo(xx, cy + yy)
    }
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.restore()

  // ── segment-specific phenomena ──
  ctx.save()
  circle(ctx, cx, cy, R * 0.98)
  ctx.clip()
  if (segId === 'vw-rain') {
    rain(ctx, w, h, seed, reduced ? 0 : t, {
      color: 'rgba(125,211,252,0.75)', slant: 2.2, count: 80, speed: 340,
    })
    // sideways arrow indicators
    for (let i = 0; i < 4; i++) {
      const ay = h * (0.25 + i * 0.15)
      const ax = reduced ? w * 0.2 : ((t * 120 + i * 160) % (w * 1.2)) - w * 0.1
      ctx.strokeStyle = '#7dd3fc'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(ax + 34, ay)
      ctx.moveTo(ax + 34, ay)
      ctx.lineTo(ax + 24, ay - 6)
      ctx.moveTo(ax + 34, ay)
      ctx.lineTo(ax + 24, ay + 6)
      ctx.stroke()
    }
  } else if (segId === 'vw-fog') {
    // drifting crystal fog blobs + sparkles
    for (let i = 0; i < 9; i++) {
      const fx = (between(seed, i * 3, 0, w) + (reduced ? 0 : t * (10 + i * 3))) % (w + 200) - 100
      const fy = between(seed, i * 3 + 1, h * 0.1, h * 0.9)
      const fr = u * (0.06 + between(seed, i * 3 + 2, 0, 0.05))
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr)
      g.addColorStop(0, 'rgba(224,242,254,0.28)')
      g.addColorStop(1, 'rgba(224,242,254,0)')
      ctx.fillStyle = g
      circle(ctx, fx, fy, fr)
      ctx.fill()
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.save()
        ctx.translate(fx + fr * 0.4, fy - fr * 0.3)
        ctx.rotate(reduced ? 0.4 : t + i)
        ctx.fillRect(-2, -6, 4, 12)
        ctx.fillRect(-6, -2, 12, 4)
        ctx.restore()
      }
    }
  } else {
    // gravity storm spiral
    const sx = cx + Math.cos(t * 0.3) * R * 0.3
    const sy = cy + Math.sin(t * 0.3) * R * 0.2
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate(reduced ? 0 : -t * 1.6)
    for (let arm = 0; arm < 3; arm++) {
      ctx.strokeStyle = `hsla(${270 + arm * 20}, 90%, 70%, 0.8)`
      ctx.lineWidth = 4
      ctx.beginPath()
      for (let a = 0; a < Math.PI * 3; a += 0.15) {
        const r2 = a * R * 0.045
        const px = Math.cos(a + (arm * Math.PI * 2) / 3) * r2
        const py = Math.sin(a + (arm * Math.PI * 2) / 3) * r2 * 0.9
        if (a === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    }
    ctx.restore()
    // swirling debris
    for (let i = 0; i < 8; i++) {
      const a = (reduced ? i : t * 1.4 + i * 0.8)
      const r2 = R * (0.15 + (i % 4) * 0.1)
      ctx.fillStyle = i % 2 ? '#c4b5fd' : '#fda4af'
      circle(ctx, sx + Math.cos(a) * r2, sy + Math.sin(a) * r2 * 0.85, u * 0.008)
      ctx.fill()
    }
  }
  ctx.restore()

  // map frame
  ctx.strokeStyle = 'rgba(56,189,248,0.6)'
  ctx.lineWidth = 2
  circle(ctx, cx, cy, R)
  ctx.stroke()

  // ── presenter (lower-left corner, in a rounded inset) ──
  const ix = w * 0.02, iy = h * 0.55, iw = w * 0.24, ih = h * 0.3
  ctx.fillStyle = 'rgba(2,6,23,0.82)'
  rr(ctx, ix, iy, iw, ih, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(56,189,248,0.5)'
  ctx.stroke()
  const talking = (f.beat.speaker ?? '').includes('Cumulusa')
  alien(ctx, {
    x: ix + iw * 0.5, y: iy + ih * 0.62, s: iw * 0.24,
    color: '#7dd3fc', shade: '#075985', eyes: 2, antenna: true,
    blink: blinkPhase(t, seed + 3), talk: talkPhase(t, 10, talking),
  })
  text(ctx, 'CUMULUSA', ix + iw / 2, iy + ih - 8, {
    font: `700 ${u * 0.017}px system-ui`, align: 'center', color: '#bae6fd',
  })

  // temperature readout panel
  ctx.fillStyle = 'rgba(2,6,23,0.85)'
  rr(ctx, w * 0.02, h * 0.1, w * 0.26, h * 0.14, 8)
  ctx.fill()
  const temp = -12 + Math.round(Math.sin(t * 0.4) * 3)
  text(ctx, `${temp}°V`, w * 0.045, h * 0.165, {
    font: `800 ${u * 0.04}px system-ui`, color: '#7dd3fc',
  })
  text(ctx, segId === 'vw-gravity' ? 'GRAVITY: SIDEWAYS' : segId === 'vw-fog' ? 'VISIBILITY: GORGEOUS' : 'WIND: OPINIONATED',
    w * 0.045, h * 0.205, { font: `700 ${u * 0.017}px system-ui`, color: '#e0f2fe' })

  const tickers: Record<string, string> = {
    'vw-rain': 'SIDEWAYS RAIN ALL AFTERNOON • UMBRELLAS SPECTATING ONLY • WALK CRAB-STYLE • COMPLIMENT THE WIND • ',
    'vw-fog': 'CRYSTAL FOG ADVISORY • DO NOT LICK THE FOG • FOG CHIMES WILL GUIDE YOU HOME • BRING A SOFT CLOTH • ',
    'vw-gravity': 'GRAVITY STORM 14:00–16:00 • GRAVITY MAY POINT LEFT • TIE DOWN LOOSE MOONS • HOLD YOUR SOUP • ',
  }
  marquee(ctx, tickers[segId] ?? '', h - h * 0.08, reduced ? 0 : t, w, h * 0.08, {
    bg: 'rgba(2,6,23,0.9)', color: '#bae6fd', speed: reduced ? 0 : 58,
  })
}
