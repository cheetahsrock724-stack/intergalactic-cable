/**
 * Dream Commercials — short surreal animated ads: morphing products,
 * popping slogan words, rotating starbursts, confetti.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import { between } from '../lib/rng'
import { circle, rr, sky, sparkle, starShape, text } from '../lib/draw'
import { photoBackdrop } from '../lib/plates'
import { filmPass } from '../lib/film'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#f472b6'
  starShape(ctx, 0, 0, s * 0.5, s * 0.2, 5, t * 0.6)
  ctx.fill()
  ctx.fillStyle = '#22d3ee'
  circle(ctx, 0, 0, s * 0.16)
  ctx.fill()
  ctx.restore()
}

interface Ad {
  product: string
  slogan: string[]
  hue: number
  drawProduct: (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, reduced: boolean) => void
}

const ADS: Record<string, Ad> = {
  'dc-dejavu': {
    product: "DR. NEBULA'S BOTTLED DÉJÀ VU",
    slogan: ['YOU HAVE', 'SEEN THIS', 'BEFORE'],
    hue: 265,
    drawProduct: (ctx, x, y, s, t, reduced) => {
      // bottle with swirling memory
      ctx.save()
      ctx.translate(x, y)
      ctx.fillStyle = 'rgba(196,181,253,0.25)'
      rr(ctx, -s * 0.18, -s * 0.4, s * 0.36, s * 0.8, s * 0.1)
      ctx.fill()
      ctx.strokeStyle = '#ddd6fe'
      ctx.lineWidth = s * 0.02
      rr(ctx, -s * 0.18, -s * 0.4, s * 0.36, s * 0.8, s * 0.1)
      ctx.stroke()
      // cork
      ctx.fillStyle = '#a78bfa'
      rr(ctx, -s * 0.08, -s * 0.48, s * 0.16, s * 0.1, s * 0.03)
      ctx.fill()
      // memory swirl
      ctx.save()
      rr(ctx, -s * 0.16, -s * 0.36, s * 0.32, s * 0.72, s * 0.08)
      ctx.clip()
      for (let i = 0; i < 4; i++) {
        const a = (reduced ? i : t * 1.2 + i * 1.6)
        ctx.fillStyle = `hsla(${265 + i * 25}, 90%, 70%, 0.55)`
        ctx.beginPath()
        ctx.ellipse(Math.cos(a) * s * 0.07, Math.sin(a * 1.3) * s * 0.2, s * 0.13, s * 0.08, a, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
      // label
      ctx.fillStyle = '#f5f3ff'
      rr(ctx, -s * 0.14, s * 0.05, s * 0.28, s * 0.16, s * 0.03)
      ctx.fill()
      ctx.fillStyle = '#4c1d95'
      ctx.font = `800 ${s * 0.07}px system-ui`
      ctx.textAlign = 'center'
      ctx.fillText('DÉJÀ VU', 0, s * 0.16)
      ctx.restore()
    },
  },
  'dc-nap': {
    product: 'THE FOREVER NAP by VoidCo',
    slogan: ['SLEEP LIKE', 'A PLANET'],
    hue: 220,
    drawProduct: (ctx, x, y, s, t, reduced) => {
      // floating mattress with orbits
      ctx.save()
      ctx.translate(x, y)
      const floatY = reduced ? 0 : Math.sin(t * 0.8) * s * 0.05
      // orbit rings
      ctx.strokeStyle = 'rgba(129,140,248,0.5)'
      ctx.lineWidth = s * 0.012
      for (let i = 0; i < 2; i++) {
        ctx.beginPath()
        ctx.ellipse(0, floatY, s * (0.5 + i * 0.12), s * (0.16 + i * 0.05), reduced ? 0.3 : t * 0.2 + i, 0, Math.PI * 2)
        ctx.stroke()
      }
      // mattress
      ctx.fillStyle = '#312e81'
      rr(ctx, -s * 0.35, floatY - s * 0.1, s * 0.7, s * 0.22, s * 0.08)
      ctx.fill()
      ctx.fillStyle = '#4338ca'
      rr(ctx, -s * 0.35, floatY - s * 0.16, s * 0.7, s * 0.1, s * 0.05)
      ctx.fill()
      // pillow + sleeping planet
      ctx.fillStyle = '#e0e7ff'
      rr(ctx, -s * 0.3, floatY - s * 0.2, s * 0.18, s * 0.08, s * 0.03)
      ctx.fill()
      ctx.fillStyle = '#818cf8'
      circle(ctx, -s * 0.21, floatY - s * 0.24, s * 0.07)
      ctx.fill()
      // zzz
      if (!reduced) {
        const z = Math.floor(t) % 3
        ctx.fillStyle = '#c7d2fe'
        ctx.font = `800 ${s * (0.1 + z * 0.02)}px system-ui`
        ctx.textAlign = 'center'
        ctx.fillText('z', s * 0.3 + z * s * 0.06, floatY - s * (0.3 + z * 0.12))
      }
      ctx.restore()
    },
  },
  'dc-splash': {
    product: 'SPLASH! Water That Remembers You',
    slogan: ['IT REMEMBERS', 'YOU'],
    hue: 190,
    drawProduct: (ctx, x, y, s, t, reduced) => {
      // glass of water with a tiny heart and memories
      ctx.save()
      ctx.translate(x, y)
      ctx.fillStyle = 'rgba(186,230,253,0.3)'
      ctx.beginPath()
      ctx.moveTo(-s * 0.2, -s * 0.35)
      ctx.lineTo(s * 0.2, -s * 0.35)
      ctx.lineTo(s * 0.14, s * 0.35)
      ctx.lineTo(-s * 0.14, s * 0.35)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#bae6fd'
      ctx.lineWidth = s * 0.02
      ctx.stroke()
      // water with wavy top
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(-s * 0.19, -s * 0.1)
      ctx.lineTo(s * 0.19, -s * 0.1)
      ctx.lineTo(s * 0.14, s * 0.34)
      ctx.lineTo(-s * 0.14, s * 0.34)
      ctx.closePath()
      ctx.clip()
      ctx.fillStyle = '#0ea5e9'
      ctx.fillRect(-s * 0.2, -s * 0.1, s * 0.4, s * 0.5)
      ctx.strokeStyle = 'rgba(224,242,254,0.8)'
      ctx.lineWidth = s * 0.015
      ctx.beginPath()
      for (let xx = -s * 0.2; xx <= s * 0.2; xx += 4) {
        const yy = -s * 0.1 + (reduced ? 0 : Math.sin(xx * 0.08 + t * 4) * s * 0.02)
        if (xx === -s * 0.2) ctx.moveTo(xx, yy)
        else ctx.lineTo(xx, yy)
      }
      ctx.stroke()
      // tiny heart inside
      const hy = (reduced ? 0 : Math.sin(t * 1.5) * s * 0.06)
      ctx.fillStyle = '#fda4af'
      const hs = s * 0.05
      ctx.beginPath()
      ctx.arc(-hs * 0.5, hy + s * 0.1, hs * 0.6, Math.PI, 0)
      ctx.arc(hs * 0.5, hy + s * 0.1, hs * 0.6, Math.PI, 0)
      ctx.lineTo(0, hy + s * 0.24)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      ctx.restore()
    },
  },
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)

  // ── the set itself: a photographed plate when one is available ──
  const plated = photoBackdrop(ctx, f, { zoom: 1.04, tint: '#f0abfc', haze: 'rgba(240,171,252,0.16)', scrim: 0.36 })
  const ad = ADS[f.segment.id] ?? ADS['dc-dejavu']

  if (!plated) {
    // dreamy gradient backdrop cycling slowly
    const hueShift = reduced ? 0 : Math.sin(t * 0.3) * 20
    sky(
      ctx, w, h,
      `hsl(${ad.hue + hueShift}, 60%, 12%)`,
      `hsl(${ad.hue + 30 + hueShift}, 65%, 22%)`,
      `hsl(${ad.hue + 60 + hueShift}, 60%, 16%)`,
    )
    // soft blobs
    for (let i = 0; i < 5; i++) {
      const bx = between(seed, i * 2, 0, w)
      const by = between(seed, i * 2 + 1, 0, h)
      const br = u * (0.1 + between(seed, i, 0, 0.15))
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br)
      g.addColorStop(0, `hsla(${ad.hue + i * 30}, 80%, 65%, 0.16)`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      circle(ctx, bx, by, br)
      ctx.fill()
    }

  }
  // rotating starburst behind product
  ctx.save()
  ctx.translate(w * 0.5, h * 0.48)
  ctx.rotate(reduced ? 0.2 : t * 0.35)
  ctx.fillStyle = `hsla(${ad.hue}, 90%, 70%, 0.18)`
  starShape(ctx, 0, 0, u * 0.42, u * 0.3, 14, 0)
  ctx.fill()
  ctx.restore()

  // product
  ad.drawProduct(ctx, w * 0.5, h * 0.48, u * 0.5, t, reduced)

  // NEW! tag spinning in
  ctx.save()
  ctx.translate(w * 0.78, h * 0.22)
  ctx.rotate(reduced ? -0.2 : Math.sin(t * 1.4) * 0.15)
  ctx.fillStyle = '#facc15'
  starShape(ctx, 0, 0, u * 0.09, u * 0.06, 10, 0.3)
  ctx.fill()
  text(ctx, 'NEW!', 0, u * 0.012, {
    font: `900 ${u * 0.03}px system-ui`, align: 'center', baseline: 'middle', color: '#713f12',
  })
  ctx.restore()

  // slogan words pop in with beats
  ad.slogan.forEach((word, i) => {
    const at = 2 + i * 5
    if (t < at) return
    const pop = Math.min(1, (t - at) * 3)
    const scale = pop < 1 ? 0.5 + pop * 0.5 + Math.sin((1 - pop) * 10) * 0.1 : 1 + (reduced ? 0 : Math.sin(t * 2 + i) * 0.02)
    ctx.save()
    ctx.translate(w * 0.5, h * 0.1 + i * h * 0.07)
    ctx.scale(scale, scale)
    text(ctx, word, 0, 0, {
      font: `900 ${u * 0.055}px system-ui`, align: 'center', baseline: 'middle',
      color: '#f8fafc', shadow: `hsla(${ad.hue}, 90%, 60%, 0.9)`,
      stroke: `hsl(${ad.hue}, 70%, 25%)`, strokeWidth: u * 0.008,
    })
    ctx.restore()
  })

  // confetti during price/disclaimer beats
  if (!reduced && t > 20) {
    for (let i = 0; i < 24; i++) {
      const cx = between(seed, i * 3, 0, w)
      const fall = (t * (40 + i * 6) + i * 90) % (h + 40)
      ctx.fillStyle = `hsla(${(i * 67) % 360}, 85%, 65%, 0.8)`
      ctx.save()
      ctx.translate(cx, fall - 20)
      ctx.rotate(fall * 0.05 + i)
      ctx.fillRect(-3, -1.5, 6, 3)
      ctx.restore()
    }
  }

  // product name ribbon
  ctx.fillStyle = 'rgba(2,6,23,0.82)'
  rr(ctx, w * 0.06, h * 0.8, w * 0.88, h * 0.1, 10)
  ctx.fill()
  ctx.fillStyle = `hsl(${ad.hue}, 85%, 60%)`
  rr(ctx, w * 0.06, h * 0.8, u * 0.018, h * 0.1, 10)
  ctx.fill()
  text(ctx, ad.product, w * 0.5, h * 0.845, {
    font: `800 ${u * 0.026}px system-ui`, align: 'center', color: '#f8fafc',
  })
  text(ctx, 'DREAM COMMERCIALS • PRODUCT DOES NOT EXIST • PLEASE PURCHASE IMAGINATION INSTEAD', w * 0.5, h * 0.885, {
    font: `600 ${u * 0.013}px system-ui`, align: 'center', color: 'rgba(248,250,252,0.7)',
  })

  // sparkles
  for (let i = 0; i < 5; i++) {
    sparkle(
      ctx,
      between(seed, i * 7 + 1, w * 0.1, w * 0.9),
      between(seed, i * 7 + 2, h * 0.15, h * 0.7),
      u * 0.016, '#fde047', reduced ? 0 : t + i * 1.3,
    )
  }

  // ── film pass: haze, halation and grain over the whole frame ──
  filmPass(ctx, f, { grain: 0.045, bloom: 0.42, radius: 18, haze: 'rgba(240,171,252,0.14)', hazeStrength: 0.1 })
}
