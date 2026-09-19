/**
 * Deep Space Radio — procedural ambient visuals: reactive waveform driven
 * by the audio analyser when audio is running (synthetic fallback when not),
 * drifting nebula, orbiting rings, dial graphic.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import { between } from '../lib/rng'
import { audio } from '../lib/audio'
import {
  circle, equalizer, planet, ring, rr, sky, starfield, text,
} from '../lib/draw'
import { PORTRAIT_CROP, drawSubject, photoBackdrop } from '../lib/plates'
import { filmPass } from '../lib/film'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#1e1b4b'
  circle(ctx, 0, 0, s * 0.48)
  ctx.fill()
  // signal waves
  ctx.strokeStyle = '#818cf8'
  ctx.lineWidth = s * 0.05
  for (let i = 1; i <= 3; i++) {
    const r = s * (0.1 + i * 0.11)
    const a = 0.9 - i * 0.1 + Math.sin(t * 1.2 + i) * 0.1
    ctx.beginPath()
    ctx.arc(0, s * 0.1, r, -Math.PI / 2 - a, -Math.PI / 2 + a)
    ctx.stroke()
  }
  ctx.fillStyle = '#22d3ee'
  circle(ctx, 0, s * 0.1, s * 0.07)
  ctx.fill()
  ctx.restore()
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)

  // ── the set itself: a photographed plate when one is available ──
  const plated = photoBackdrop(ctx, f, { zoom: 1.02, biasY: -0.05, tint: '#818cf8', haze: 'rgba(129,140,248,0.14)', scrim: 0.42 })
  const segId = f.segment.id
  if (!plated) {
    sky(ctx, w, h, '#02010a', '#0a0620', '#150b33')
    starfield(ctx, w, h, seed, reduced ? 0 : t * 0.5, 120, 1.5)

    // drifting nebula clouds
    for (let i = 0; i < 4; i++) {
      const nx = (between(seed, i * 2, 0, w) + (reduced ? 0 : t * (4 + i * 2))) % (w + u * 0.6) - u * 0.3
      const ny = between(seed, i * 2 + 1, h * 0.05, h * 0.55)
      const nr = u * (0.16 + i * 0.05)
      const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr)
      const hue = segId === 'dsr-whales' ? 200 + i * 15 : segId === 'dsr-static' ? 250 + i * 10 : 265 + i * 18
      g.addColorStop(0, `hsla(${hue}, 80%, 55%, 0.16)`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      circle(ctx, nx, ny, nr)
      ctx.fill()
    }

    // distant planet with ring
    planet(ctx, w * 0.85, h * 0.2, u * 0.09, '#6366f1', '#1e1b4b', 'rgba(129,140,248,0.6)')

  }
  // ── reactive waveform ──
  const levels = audio.getLevels()
  const bars = 28
  const baseY = h * 0.62
  const barW = w / bars
  for (let i = 0; i < bars; i++) {
    let v: number
    if (levels && levels.length) {
      const idx = Math.floor((i / bars) * levels.length)
      v = Math.max(0.05, levels[idx] / 255)
    } else {
      // synthetic fallback — still musical
      v =
        0.1 +
        0.35 * Math.abs(Math.sin((reduced ? 0 : t) * 2 + i * 0.55)) +
        0.15 * Math.abs(Math.sin((reduced ? 0 : t) * 3.7 + i * 1.3))
    }
    const bh = v * h * 0.3
    const hue = 230 + (i / bars) * 80
    const g = ctx.createLinearGradient(0, baseY - bh, 0, baseY + bh * 0.3)
    g.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.95)`)
    g.addColorStop(1, `hsla(${hue}, 90%, 45%, 0.15)`)
    ctx.fillStyle = g
    rr(ctx, i * barW + barW * 0.2, baseY - bh, barW * 0.6, bh, 3)
    ctx.fill()
    // reflection
    ctx.globalAlpha = 0.2
    rr(ctx, i * barW + barW * 0.2, baseY + 2, barW * 0.6, bh * 0.3, 3)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // horizon line
  ctx.strokeStyle = 'rgba(129,140,248,0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, baseY)
  ctx.lineTo(w, baseY)
  ctx.stroke()

  // the DJ in the studio, photographed
  const djH = h * 0.56
  drawSubject(ctx, f, {
    x: w * 0.26, y: h * 0.95, w: djH * 0.74, h: djH,
    anchor: 1, crop: PORTRAIT_CROP, phase: 0.8,
  })

  // ── segment character ──
  if (segId === 'dsr-whales') {
    // distant whale silhouettes drifting
    for (let i = 0; i < 2; i++) {
      const wx = (between(seed, i * 5, 0, w) + (reduced ? 0 : t * (8 + i * 5))) % (w + u * 0.4) - u * 0.2
      const wy = h * (0.22 + i * 0.14) + (reduced ? 0 : Math.sin(t * 0.7 + i * 2) * h * 0.02)
      const s = u * (0.09 - i * 0.03)
      ctx.fillStyle = `rgba(99,102,241,${0.55 - i * 0.2})`
      ctx.beginPath()
      ctx.ellipse(wx, wy, s, s * 0.42, Math.sin(t * 0.5 + i) * 0.15, 0, Math.PI * 2)
      ctx.fill()
      // tail
      ctx.beginPath()
      ctx.moveTo(wx - s * 0.9, wy)
      ctx.lineTo(wx - s * 1.4, wy - s * 0.35)
      ctx.lineTo(wx - s * 1.4, wy + s * 0.35)
      ctx.closePath()
      ctx.fill()
      // song ripple
      if (!reduced) {
        const ripple = (t * 0.5 + i) % 1
        ctx.strokeStyle = `rgba(165,180,252,${0.5 * (1 - ripple)})`
        ctx.lineWidth = 2
        circle(ctx, wx + s, wy, ripple * u * 0.12)
        ctx.stroke()
      }
    }
  } else if (segId === 'dsr-hum') {
    // one long horizontal hum line undulating
    ctx.strokeStyle = 'rgba(34,211,238,0.8)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let x = 0; x <= w; x += 6) {
      const y =
        h * 0.36 +
        Math.sin(x * 0.02 + (reduced ? 0 : t) * 1.5) * h * 0.02 +
        Math.sin(x * 0.005 + (reduced ? 0 : t) * 0.6) * h * 0.035
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.strokeStyle = 'rgba(34,211,238,0.25)'
    ctx.lineWidth = 8
    ctx.stroke()
  } else {
    // sleep static: soft drifting dots + slow pulse circle
    const pulse = (reduced ? 0.5 : (t % 6) / 6)
    ctx.strokeStyle = `rgba(165,180,252,${0.5 * (1 - pulse)})`
    ctx.lineWidth = 2
    circle(ctx, w * 0.5, h * 0.34, pulse * u * 0.3)
    ctx.stroke()
    ctx.fillStyle = 'rgba(199,210,254,0.7)'
    circle(ctx, w * 0.5, h * 0.34, u * 0.012)
    ctx.fill()
    text(ctx, 'zzz', w * 0.5 + u * 0.04, h * 0.3, {
      font: `600 ${u * 0.024}px system-ui`, color: 'rgba(199,210,254,0.7)',
    })
  }

  // ── dial graphic with progress through the program ──
  const prog = Math.min(1, f.t / f.segment.duration)
  ring(ctx, w * 0.1, h * 0.16, u * 0.045, prog, '#22d3ee', 'rgba(255,255,255,0.12)', u * 0.008)
  text(ctx, `${Math.floor(prog * 100)}%`, w * 0.1, h * 0.165, {
    font: `800 ${u * 0.017}px system-ui`, align: 'center', baseline: 'middle', color: '#c7d2fe',
  })

  // frequency strip
  ctx.fillStyle = 'rgba(2,6,23,0.8)'
  rr(ctx, w * 0.28, h * 0.1, w * 0.44, h * 0.07, 8)
  ctx.fill()
  const freq = (89.1 + f.segIndex * 0.2).toFixed(1)
  text(ctx, `◉ ${freq} GHz — ${f.segment.title.toUpperCase()}`, w * 0.5, h * 0.142, {
    font: `700 ${u * 0.018}px system-ui`, align: 'center', color: '#a5b4fc',
  })

  equalizer(ctx, w * 0.03, h * 0.9 - h * 0.075, w * 0.2, h * 0.055, 10, reduced ? 0 : t, 'rgba(129,140,248,0.6)', levels)
  text(ctx, 'DEEP SPACE RADIO — PROCEDURAL AMBIENT • SIMULATED TRANSMISSION', w - u * 0.03, h * 0.9 - h * 0.04, {
    font: `600 ${u * 0.014}px system-ui`, align: 'right', color: 'rgba(199,210,254,0.75)',
  })

  // ── film pass: haze, halation and grain over the whole frame ──
  filmPass(ctx, f, { grain: 0.065, bloom: 0.36, radius: 18, haze: 'rgba(165,180,252,0.14)', hazeStrength: 0.12 })
}
