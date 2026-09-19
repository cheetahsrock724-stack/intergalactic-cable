/**
 * Cosmic Shopping — product pedestal with rotating impossible products,
 * robot host Chip Zeta, price pops, sparkles, scarcity countdown.
 */

import type { ChannelRenderer, FrameInfo, LogoRenderer } from '../types'
import { rand2, between } from '../lib/rng'
import {
  circle, equalizer, rr, sky, sparkle, starShape,
  starfield, text, blinkPhase,
} from '../lib/draw'
import { PORTRAIT_CROP, drawSubject, photoBackdrop } from '../lib/plates'
import { filmPass } from '../lib/film'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#f59e0b'
  starShape(ctx, 0, 0, s * 0.52, s * 0.24, 8, t * 0.4)
  ctx.fill()
  ctx.fillStyle = '#78350f'
  circle(ctx, 0, 0, s * 0.22)
  ctx.fill()
  ctx.restore()
}

interface Product {
  name: string
  price: string
  units: number
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, f: FrameInfo) => void
}

const PRODUCTS: Record<string, Product> = {
  'cs-blackhole': {
    name: 'INSTA–BLACK HOLE KIT',
    price: '19.98 ✦ ZORBUCKS',
    units: 4000,
    draw: (ctx, x, y, s, t, f) => {
      // swirling black hole in a box
      ctx.save()
      ctx.translate(x, y)
      const spin = f.reduced ? 0 : t
      for (let i = 5; i >= 0; i--) {
        ctx.beginPath()
        ctx.ellipse(0, 0, s * (0.2 + i * 0.14), s * (0.07 + i * 0.05), spin * 0.5 + i, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${265 + i * 14}, 85%, ${45 + i * 7}%, 0.85)`
        ctx.lineWidth = s * 0.05
        ctx.stroke()
      }
      const g = ctx.createRadialGradient(0, 0, s * 0.02, 0, 0, s * 0.2)
      g.addColorStop(0, '#000')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = '#000'
      circle(ctx, 0, 0, s * 0.18)
      ctx.fill()
      ctx.restore()
    },
  },
  'cs-clock': {
    name: 'SELF-ARGUING ALARM CLOCK',
    price: '79.99 ✦ ZORBUCKS',
    units: 1200,
    draw: (ctx, x, y, s, t, f) => {
      ctx.save()
      ctx.translate(x, y)
      const shake = f.reduced ? 0 : Math.sin(t * 20) * (0.5 + 0.5 * Math.sin(t * 2)) * s * 0.02
      ctx.rotate(shake / s)
      // bells
      ctx.fillStyle = '#fbbf24'
      circle(ctx, -s * 0.32, -s * 0.38, s * 0.14)
      ctx.fill()
      circle(ctx, s * 0.32, -s * 0.38, s * 0.14)
      ctx.fill()
      // body
      ctx.fillStyle = '#f87171'
      circle(ctx, 0, 0, s * 0.42)
      ctx.fill()
      ctx.fillStyle = '#fff7ed'
      circle(ctx, 0, 0, s * 0.34)
      ctx.fill()
      // angry face instead of numbers
      const blink = blinkPhase(t, 5)
      ctx.fillStyle = '#1c1917'
      // angry eyes
      ctx.save()
      ctx.lineWidth = s * 0.03
      ctx.strokeStyle = '#1c1917'
      ctx.beginPath()
      ctx.moveTo(-s * 0.2, -s * 0.16)
      ctx.lineTo(-s * 0.06, -s * 0.08)
      ctx.moveTo(s * 0.2, -s * 0.16)
      ctx.lineTo(s * 0.06, -s * 0.08)
      ctx.stroke()
      ctx.restore()
      ctx.beginPath()
      ctx.ellipse(-s * 0.12, -s * 0.02, s * 0.045, s * 0.045 * (1 - blink), 0, 0, Math.PI * 2)
      ctx.ellipse(s * 0.12, -s * 0.02, s * 0.045, s * 0.045 * (1 - blink), 0, 0, Math.PI * 2)
      ctx.fill()
      // frown
      ctx.beginPath()
      ctx.arc(0, s * 0.22, s * 0.12, Math.PI * 1.2, Math.PI * 1.8)
      ctx.stroke()
      // clock hands
      ctx.strokeStyle = '#dc2626'
      ctx.lineWidth = s * 0.025
      ctx.beginPath()
      ctx.moveTo(0, 0)
      const a = t * 2
      ctx.lineTo(Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2)
      ctx.stroke()
      ctx.restore()
    },
  },
  'cs-nebula': {
    name: 'NEBULA-IN-A-JAR (GLITTER)',
    price: '49.99 ✦ ZORBUCKS',
    units: 800,
    draw: (ctx, x, y, s, t, f) => {
      ctx.save()
      ctx.translate(x, y)
      // jar
      ctx.fillStyle = 'rgba(224,242,254,0.14)'
      rr(ctx, -s * 0.3, -s * 0.4, s * 0.6, s * 0.8, s * 0.12)
      ctx.fill()
      ctx.strokeStyle = 'rgba(224,242,254,0.7)'
      ctx.lineWidth = s * 0.025
      rr(ctx, -s * 0.3, -s * 0.4, s * 0.6, s * 0.8, s * 0.12)
      ctx.stroke()
      // lid
      ctx.fillStyle = '#a78bfa'
      rr(ctx, -s * 0.33, -s * 0.47, s * 0.66, s * 0.1, s * 0.04)
      ctx.fill()
      // nebula swirl inside
      ctx.save()
      rr(ctx, -s * 0.28, -s * 0.38, s * 0.56, s * 0.76, s * 0.1)
      ctx.clip()
      for (let i = 0; i < 5; i++) {
        const a = (f.reduced ? 0 : t * 0.8) + i * 1.3
        ctx.fillStyle = `hsla(${280 + i * 20}, 90%, 65%, 0.5)`
        ctx.beginPath()
        ctx.ellipse(
          Math.cos(a) * s * 0.12, Math.sin(a) * s * 0.16,
          s * (0.16 - i * 0.02), s * (0.1 - i * 0.012), a, 0, Math.PI * 2,
        )
        ctx.fill()
      }
      // glitter
      for (let i = 0; i < 14; i++) {
        const gx = between(f.seed, i * 2, -s * 0.26, s * 0.26)
        const gy = between(f.seed, i * 2 + 1, -s * 0.34, s * 0.34)
        sparkle(ctx, gx, gy, s * 0.03, '#fef9c3', f.reduced ? 0 : t + i)
      }
      ctx.restore()
      ctx.restore()
    },
  },
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)

  // ── the set itself: a photographed plate when one is available ──
  const plated = photoBackdrop(ctx, f, { zoom: 1.05, biasY: 0.12, tint: '#f59e0b', haze: 'rgba(251,191,36,0.16)', scrim: 0.44 })
  if (!plated) {
    sky(ctx, w, h, '#1a0b2e', '#31103f', '#451a03')
    starfield(ctx, w, h, seed, reduced ? 0 : t, 50, 1)

    // studio glow floor
    const fg = ctx.createLinearGradient(0, h * 0.6, 0, h)
    fg.addColorStop(0, 'rgba(245,158,11,0.12)')
    fg.addColorStop(1, 'rgba(245,158,11,0.3)')
    ctx.fillStyle = fg
    ctx.fillRect(0, h * 0.6, w, h * 0.4)

  }
  const product = PRODUCTS[f.segment.id] ?? PRODUCTS['cs-blackhole']

  // pedestal
  const px = w * 0.62, py = h * 0.6
  ctx.fillStyle = '#4c1d95'
  rr(ctx, px - u * 0.16, py, u * 0.32, h * 0.2, 10)
  ctx.fill()
  ctx.fillStyle = '#6d28d9'
  ctx.beginPath()
  ctx.ellipse(px, py, u * 0.18, u * 0.05, 0, 0, Math.PI * 2)
  ctx.fill()
  // rotating glow ring
  ctx.strokeStyle = `rgba(251,191,36,${0.4 + 0.3 * Math.sin(t * 3)})`
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(px, py, u * 0.2, u * 0.058, 0, 0, Math.PI * 2)
  ctx.stroke()

  // product (rotating hover)
  ctx.save()
  ctx.translate(px, py - u * 0.16 + Math.sin(t * 1.5) * u * 0.012)
  if (!reduced) ctx.rotate(Math.sin(t * 0.7) * 0.06)
  product.draw(ctx, 0, 0, u * 0.42, t, f)
  ctx.restore()

  // host robot Chip Zeta (left) — photographed when we have him
  const hostH = h * 0.6
  const hasHost = drawSubject(ctx, f, {
    x: w * 0.19, y: h * 0.93, w: hostH * 0.74, h: hostH,
    anchor: 1, crop: PORTRAIT_CROP, phase: 1.1,
  })
  if (!hasHost) {
  const hx = w * 0.2, hy = h * 0.62
  const wave = reduced ? 0.3 : Math.sin(t * 5) * 0.5 + 0.5
  ctx.save()
  ctx.translate(hx, hy)
  // body
  ctx.fillStyle = '#e2e8f0'
  rr(ctx, -u * 0.07, -u * 0.02, u * 0.14, u * 0.16, u * 0.03)
  ctx.fill()
  // head
  ctx.fillStyle = '#cbd5e1'
  rr(ctx, -u * 0.06, -u * 0.14, u * 0.12, u * 0.11, u * 0.025)
  ctx.fill()
  // eyes
  const blink = blinkPhase(t, seed + 9, 5)
  ctx.fillStyle = '#0ea5e9'
  ctx.fillRect(-u * 0.04, -u * 0.11, u * 0.03, u * 0.02 * (1 - blink * 0.8))
  ctx.fillRect(u * 0.012, -u * 0.11, u * 0.03, u * 0.02 * (1 - blink * 0.8))
  // antenna
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, -u * 0.14)
  ctx.lineTo(0, -u * 0.18)
  ctx.stroke()
  ctx.fillStyle = '#f59e0b'
  circle(ctx, 0, -u * 0.19, u * 0.012)
  ctx.fill()
  // waving arm
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = u * 0.022
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(u * 0.07, u * 0.02)
  ctx.lineTo(u * 0.13, u * 0.02 - wave * u * 0.09)
  ctx.stroke()
  // mouth grille
  ctx.fillStyle = '#64748b'
  for (let i = 0; i < 3; i++) ctx.fillRect(-u * 0.035, -u * 0.075 + i * u * 0.012, u * 0.07, u * 0.006)
  ctx.restore()
  // speech waves when talking
  if ((f.beat.speaker ?? '').includes('Chip')) {
    ctx.strokeStyle = `rgba(245,158,11,${0.3 + 0.3 * Math.sin(t * 8)})`
    ctx.lineWidth = 2
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath()
      ctx.arc(hx + u * 0.08, hy - u * 0.1, u * 0.03 * i + (t * 20) % (u * 0.03), -0.8, 0.8)
      ctx.stroke()
    }
  }
  }

  // price tag pops in mid-segment
  if (t > 12) {
    const pop = Math.min(1, (t - 12) * 3)
    ctx.save()
    ctx.translate(w * 0.62, h * 0.2)
    ctx.rotate(Math.sin(t * 2) * 0.04)
    ctx.scale(pop, pop)
    ctx.fillStyle = '#fbbf24'
    starShape(ctx, 0, 0, u * 0.19, u * 0.14, 12, 0.2)
    ctx.fill()
    ctx.fillStyle = '#451a03'
    text(ctx, 'ONLY', 0, -u * 0.035, { font: `800 ${u * 0.026}px system-ui`, align: 'center' })
    text(ctx, product.price, 0, u * 0.005, { font: `800 ${u * 0.024}px system-ui`, align: 'center' })
    text(ctx, '*fictional currency', 0, u * 0.04, { font: `600 ${u * 0.015}px system-ui`, align: 'center' })
    ctx.restore()
  }

  // units remaining countdown (deterministic per cycle)
  const left = Math.max(3, product.units - Math.floor(t * 7) - (f.cycle % 9) * 31)
  ctx.fillStyle = 'rgba(2,6,23,0.85)'
  rr(ctx, w * 0.02, h * 0.08, w * 0.3, h * 0.075, 8)
  ctx.fill()
  text(ctx, `⚠ ONLY ${left} LEFT IN THIS DIMENSION`, w * 0.035, h * 0.122, {
    font: `800 ${u * 0.02}px system-ui`, color: '#fca5a5',
  })

  // product name card
  ctx.fillStyle = 'rgba(2,6,23,0.8)'
  rr(ctx, w * 0.36, h * 0.86, w * 0.62, h * 0.1, 8)
  ctx.fill()
  text(ctx, product.name, w * 0.67, h * 0.915, {
    font: `800 ${u * 0.026}px system-ui`, align: 'center', color: '#fde68a',
  })

  // sparkles
  for (let i = 0; i < 6; i++) {
    const sx = between(seed, i * 3, w * 0.4, w * 0.9)
    const sy = between(seed, i * 3 + 1, h * 0.15, h * 0.55)
    sparkle(ctx, sx, sy, u * 0.014 * (0.6 + rand2(seed, i) * 0.8), '#fde047', reduced ? 0 : t + i * 1.7)
  }
  equalizer(ctx, w * 0.02, h * 0.9, w * 0.3, h * 0.06, 12, reduced ? 0 : t, 'rgba(245,158,11,0.5)')

  // ── film pass: haze, halation and grain over the whole frame ──
  filmPass(ctx, f, { grain: 0.05, bloom: 0.36, radius: 16, haze: 'rgba(251,191,36,0.14)', hazeStrength: 0.1 })
}
