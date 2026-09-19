/**
 * Robot Kitchen — robot chef Benji, bubbling pot, ingredients hopping in
 * on beats, steam, recipe card, timer.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import { between, rand2 } from '../lib/rng'
import {
  blinkPhase, circle, rr, sky, sparkle, starfield, text,
} from '../lib/draw'
import { PORTRAIT_CROP, drawSubject, photoBackdrop } from '../lib/plates'
import { filmPass } from '../lib/film'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#be123c'
  rr(ctx, -s * 0.45, -s * 0.45, s * 0.9, s * 0.9, s * 0.2)
  ctx.fill()
  // pot
  ctx.fillStyle = '#e2e8f0'
  rr(ctx, -s * 0.25, -s * 0.1, s * 0.5, s * 0.32, s * 0.06)
  ctx.fill()
  // steam
  ctx.strokeStyle = '#fecdd3'
  ctx.lineWidth = s * 0.05
  ctx.lineCap = 'round'
  for (let i = 0; i < 2; i++) {
    ctx.beginPath()
    ctx.moveTo(-s * 0.1 + i * s * 0.2, -s * 0.15)
    ctx.quadraticCurveTo(
      -s * 0.1 + i * s * 0.2 + Math.sin(t * 3 + i) * s * 0.08, -s * 0.28,
      -s * 0.1 + i * s * 0.2, -s * 0.38,
    )
    ctx.stroke()
  }
  ctx.restore()
}

const RECIPES: Record<string, { name: string; serves: string; ingredients: string[] }> = {
  'rk-souffle': {
    name: 'ZERO-GRAVITY SOUFFLÉ', serves: '4 DIMENSIONS',
    ingredients: ['3 CLOUDS', '1 SMALL IDEA', '220° FOR 9 MIN', '1 LID (SKY-SIZED)'],
  },
  'rk-pickle': {
    name: 'QUANTUM PICKLE SURPRISE', serves: '2 TIMELINES',
    ingredients: ['1 CUCUMBER', '1 JAR', 'PATIENCE, DICED', '0 REGRETS'],
  },
  'rk-meatballs': {
    name: 'METEOR MEATBALLS', serves: '1 HELMET',
    ingredients: ['1 METEOR EACH', 'STARDUST', 'COMET SALT', 'GRAVITY PAN'],
  },
}

/** An ingredient hopping through the air into the pot. */
function hoppingIngredient(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, px: number, py: number,
  progress: number, kind: number, s: number,
): void {
  // parabolic arc
  const x = x0 + (px - x0) * progress
  const y = y0 + (py - y0) * progress - Math.sin(progress * Math.PI) * s * 1.6
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(progress * 6)
  const colors = ['#fde047', '#86efac', '#fda4af', '#93c5fd']
  ctx.fillStyle = colors[kind % 4]
  if (kind % 3 === 0) {
    circle(ctx, 0, 0, s * 0.16)
    ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    circle(ctx, s * 0.05, -s * 0.04, s * 0.05)
    ctx.fill()
  } else if (kind % 3 === 1) {
    rr(ctx, -s * 0.12, -s * 0.12, s * 0.24, s * 0.24, s * 0.05)
    ctx.fill()
    // eyes — everything in this kitchen is alive
    ctx.fillStyle = '#1e1b4b'
    circle(ctx, -s * 0.04, -s * 0.02, s * 0.025)
    ctx.fill()
    circle(ctx, s * 0.04, -s * 0.02, s * 0.025)
    ctx.fill()
  } else {
    // star sprinkle
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r2 = i % 2 ? s * 0.07 : s * 0.15
      const a = (i * Math.PI) / 5
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2)
    }
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)

  // ── the set itself: a photographed plate when one is available ──
  const plated = photoBackdrop(ctx, f, { zoom: 1.05, biasY: 0.1, tint: '#fb7185', haze: 'rgba(251,113,133,0.14)', scrim: 0.42 })
  if (!plated) {
    sky(ctx, w, h, '#2a0a1e', '#4c0519', '#701a3e')
    starfield(ctx, w, h, seed + 7, reduced ? 0 : t * 0.3, 25, 0.5)

  }
  const recipe = RECIPES[f.segment.id] ?? RECIPES['rk-souffle']

  if (!plated) {
    // kitchen back wall: shelf with jars
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(0, h * 0.2, w, h * 0.03)
    for (let i = 0; i < 5; i++) {
      const jx = w * (0.08 + i * 0.11)
      ctx.fillStyle = `hsla(${150 + i * 40}, 70%, 60%, 0.5)`
      rr(ctx, jx, h * 0.12, u * 0.03, h * 0.08, u * 0.008)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(jx + u * 0.006, h * 0.13, u * 0.006, h * 0.05)
    }

  }
  // counter
  const counterY = h * 0.62
  if (!plated) {
    ctx.fillStyle = '#9f1239'
    ctx.fillRect(0, counterY, w, h * 0.06)
    ctx.fillStyle = '#4c0519'
    ctx.fillRect(0, counterY + h * 0.06, w, h)

  }
  // ── pot ──
  const potX = w * 0.58, potY = counterY - u * 0.01
  ctx.fillStyle = '#cbd5e1'
  rr(ctx, potX - u * 0.12, potY - u * 0.1, u * 0.24, u * 0.12, u * 0.02)
  ctx.fill()
  ctx.fillStyle = '#94a3b8'
  ctx.fillRect(potX - u * 0.14, potY - u * 0.11, u * 0.28, u * 0.015)
  // bubbling surface
  ctx.fillStyle = recipe.name.includes('PICKLE') ? '#84cc16' : recipe.name.includes('METEOR') ? '#fb923c' : '#a5b4fc'
  ctx.beginPath()
  ctx.ellipse(potX, potY - u * 0.1, u * 0.11, u * 0.018, 0, 0, Math.PI * 2)
  ctx.fill()
  // bubbles
  for (let i = 0; i < 6; i++) {
    const phase = (t * 1.4 + i * 0.6) % 1
    const bx = potX + between(seed, i, -u * 0.08, u * 0.08)
    const by = potY - u * 0.1 - phase * u * 0.06
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - phase)})`
    ctx.lineWidth = 1.5
    circle(ctx, bx, by, u * 0.006 + phase * u * 0.01)
    ctx.stroke()
  }
  // steam
  if (!reduced) {
    ctx.strokeStyle = 'rgba(226,232,240,0.35)'
    ctx.lineWidth = u * 0.008
    ctx.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      const sx = potX + (i - 1) * u * 0.05
      ctx.moveTo(sx, potY - u * 0.13)
      for (let yy = 0; yy < 4; yy++) {
        ctx.quadraticCurveTo(
          sx + Math.sin(t * 2 + yy + i) * u * 0.03, potY - u * (0.16 + yy * 0.05),
          sx + Math.sin(t * 2 + yy + 0.5 + i) * u * 0.04, potY - u * (0.19 + yy * 0.05),
        )
      }
      ctx.stroke()
    }
  }

  // ── ingredients hop in on beats (each beat = one ingredient) ──
  const ingCount = Math.min(4, f.beatIndex + 1)
  for (let i = 0; i < ingCount; i++) {
    const startT = f.segment.beats[i + 1]?.t ?? 999
    const prog = Math.min(1, Math.max(0, (t - startT) / 1.2))
    if (prog <= 0 || prog >= 1) continue
    const x0 = w * 0.05 + rand2(seed, i) * w * 0.2
    hoppingIngredient(ctx, x0, counterY - u * 0.02, potX, potY - u * 0.12, prog, i + f.segIndex, u)
  }
  // splash sparkle when an ingredient lands
  for (let i = 0; i < 4; i++) {
    const startT = f.segment.beats[i + 1]?.t ?? 999
    const dt = t - (startT + 1.2)
    if (dt > 0 && dt < 0.6 && !reduced) {
      sparkle(ctx, potX, potY - u * 0.14, u * 0.02 * (1 - dt / 0.6), '#fef08a', t)
    }
  }

  // ── Benji the robot chef — photographed when we have him ──
  const chefH = h * 0.62
  const hasChef = drawSubject(ctx, f, {
    x: w * 0.2, y: counterY + h * 0.05, w: chefH * 0.74, h: chefH,
    anchor: 1, crop: PORTRAIT_CROP, phase: 0.5,
  })
  if (!hasChef) {
  const bx = w * 0.22, by = counterY - u * 0.02
  ctx.save()
  ctx.translate(bx, by)
  // body
  ctx.fillStyle = '#e2e8f0'
  rr(ctx, -u * 0.08, -u * 0.04, u * 0.16, u * 0.17, u * 0.03)
  ctx.fill()
  // apron
  ctx.fillStyle = '#fb7185'
  rr(ctx, -u * 0.055, -u * 0.02, u * 0.11, u * 0.13, u * 0.02)
  ctx.fill()
  text(ctx, 'B3-N', 0, u * 0.06, { font: `800 ${u * 0.02}px system-ui`, align: 'center', color: '#fff' })
  // head
  ctx.fillStyle = '#cbd5e1'
  rr(ctx, -u * 0.065, -u * 0.15, u * 0.13, u * 0.1, u * 0.025)
  ctx.fill()
  // one big eye
  const blink = blinkPhase(t, seed + 4, 4.6)
  ctx.fillStyle = '#0f172a'
  circle(ctx, 0, -u * 0.1, u * 0.03)
  ctx.fill()
  ctx.fillStyle = '#22d3ee'
  circle(ctx, 0, -u * 0.1, u * 0.018 * (1 - blink))
  ctx.fill()
  // chef hat
  ctx.fillStyle = '#f8fafc'
  rr(ctx, -u * 0.045, -u * 0.21, u * 0.09, u * 0.06, u * 0.02)
  ctx.fill()
  for (let i = 0; i < 3; i++) {
    circle(ctx, -u * 0.03 + i * u * 0.03, -u * 0.21, u * 0.022)
    ctx.fill()
  }
  // stirring arm
  const stir = reduced ? 0.4 : Math.sin(t * 5) * 0.8 + 0.8
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = u * 0.02
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(u * 0.08, 0)
  ctx.quadraticCurveTo(u * 0.16, -u * 0.02, u * 0.2 + stir * u * 0.04, -u * 0.08)
  ctx.stroke()
  // spoon
  ctx.fillStyle = '#a3a3a3'
  circle(ctx, u * 0.21 + stir * u * 0.04, -u * 0.09, u * 0.018)
  ctx.fill()
  ctx.restore()
  }

  // ── recipe card (right) ──
  const cardX = w * 0.76, cardY = h * 0.16, cardW = w * 0.22, cardH = h * 0.36
  ctx.fillStyle = 'rgba(254,252,232,0.95)'
  ctx.save()
  ctx.translate(cardX, cardY)
  ctx.rotate(0.02)
  rr(ctx, 0, 0, cardW, cardH, 8)
  ctx.fill()
  ctx.fillStyle = '#9f1239'
  text(ctx, recipe.name, cardW / 2, cardH * 0.12, {
    font: `800 ${u * 0.016}px system-ui`, align: 'center', maxWidth: cardW - 10,
  })
  ctx.strokeStyle = '#fda4af'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cardW * 0.1, cardH * 0.18)
  ctx.lineTo(cardW * 0.9, cardH * 0.18)
  ctx.stroke()
  ctx.fillStyle = '#44403c'
  ctx.font = `600 ${u * 0.014}px system-ui`
  recipe.ingredients.forEach((ing, i) => {
    const done = f.beatIndex > i
    ctx.fillStyle = done ? '#16a34a' : '#78716c'
    ctx.fillText(`${done ? '✓' : '○'} ${ing}`, cardW * 0.08, cardH * (0.3 + i * 0.13))
  })
  ctx.fillStyle = '#9f1239'
  ctx.font = `800 ${u * 0.014}px system-ui`
  ctx.fillText(`SERVES: ${recipe.serves}`, cardW * 0.08, cardH * 0.9)
  ctx.restore()

  // ── timer ──
  const remain = Math.max(0, Math.ceil(f.segment.duration - t))
  ctx.fillStyle = 'rgba(2,6,23,0.85)'
  rr(ctx, w * 0.02, h * 0.02, w * 0.24, h * 0.1, 8)
  ctx.fill()
  text(ctx, `⏱ ${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, '0')} LEFT`, w * 0.04, h * 0.065, {
    font: `800 ${u * 0.022}px system-ui`, color: remain < 10 ? '#fda4af' : '#e2e8f0',
  })

  // floating soufflé near the end of the soufflé segment
  if (f.segment.id === 'rk-souffle' && t > 30) {
    const fy = h * 0.3 - Math.min(1, (t - 30) / 8) * h * 0.12 + (reduced ? 0 : Math.sin(t * 2) * 5)
    ctx.fillStyle = '#fde68a'
    circle(ctx, w * 0.58, fy, u * 0.05)
    ctx.fill()
    ctx.fillStyle = '#92400e'
    ctx.beginPath()
    ctx.ellipse(w * 0.58, fy + u * 0.03, u * 0.05, u * 0.02, 0, 0, Math.PI)
    ctx.fill()
    // tiny face
    ctx.fillStyle = '#451a03'
    circle(ctx, w * 0.58 - u * 0.015, fy - u * 0.01, u * 0.006)
    ctx.fill()
    circle(ctx, w * 0.58 + u * 0.015, fy - u * 0.01, u * 0.006)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(2,6,23,0.8)'
  ctx.fillRect(0, h - h * 0.055, w, h * 0.055)
  text(ctx, 'ROBOT KITCHEN • COMEDY PROGRAM • PLEASE DO NOT COOK ACTUAL CLOUDS', w * 0.5, h - h * 0.024, {
    font: `700 ${u * 0.015}px system-ui`, align: 'center', baseline: 'middle', color: '#fecdd3',
  })

  // ── film pass: haze, halation and grain over the whole frame ──
  filmPass(ctx, f, { grain: 0.055, bloom: 0.34, radius: 16, haze: 'rgba(254,205,211,0.14)', hazeStrength: 0.12 })
}
