/**
 * Galactic News 404 — studio scene: two alien anchors at a desk, starfield
 * window with planet, rotating headline wall, lower-third style graphics.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import {
  alien, blinkPhase, circle, marquee, planet, rr, sky,
  sparkle, starfield, talkPhase, text,
} from '../lib/draw'
import { PORTRAIT_CROP, drawSubject, photoBackdrop } from '../lib/plates'
import { filmPass } from '../lib/film'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#0ea5e9'
  rr(ctx, -s * 0.5, -s * 0.5, s, s, s * 0.22)
  ctx.fill()
  ctx.strokeStyle = '#e0f2fe'
  ctx.lineWidth = s * 0.07
  circle(ctx, 0, 0, s * 0.3)
  ctx.stroke()
  ctx.fillStyle = '#f472b6'
  circle(ctx, Math.cos(t) * s * 0.12, Math.sin(t * 1.3) * s * 0.1, s * 0.09)
  ctx.fill()
  ctx.restore()
}

const HEADLINES = [
  'COMET UNION WINS TAIL RIGHTS',
  'MONDAY 4% LONGER NEAR BLACK HOLES',
  'SATURN COMPLETES LAP 4,000',
  'EXPRESS WORMHOLE: ARRIVE BEFORE YOU LEAVE',
  'PRESIDENT NEBULA RACE TIGHTENS',
  'ASTEROID: "I UNDERSTAND IMPACT"',
  'POLLING STATIONS SPLIT IN HALF',
  'STARS FEEL UPSTAGED BY COMET TAILS',
]

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7) // unit scale

  // ── the set itself: a photographed plate when one is available ──
  const plated = photoBackdrop(ctx, f, { zoom: 1.02, biasY: -0.1, tint: '#22d3ee', haze: 'rgba(125,211,252,0.10)', scrim: 0.46 })

  if (!plated) {
    // studio backdrop
    sky(ctx, w, h, '#060b24', '#0b1336', '#131c4d')

  }
  // big window with space view (upper area)
  const wx = w * 0.06, wy = h * 0.06, ww = w * 0.88, wh = h * 0.42
  if (!plated) {
    ctx.save()
    rr(ctx, wx, wy, ww, wh, 10)
    ctx.clip()
    sky(ctx, w, h, '#01030f', '#040a24', '#0a1130')
    starfield(ctx, w, h, seed, reduced ? 0 : t, 70, 2)
    planet(ctx, wx + ww * 0.78, wy + wh * 0.42, u * 0.16, '#7dd3fc', '#1e40af', 'rgba(125,211,252,0.7)')
    planet(ctx, wx + ww * 0.2, wy + wh * 0.3, u * 0.06, '#f9a8d4', '#831843')
    ctx.restore()
    ctx.strokeStyle = 'rgba(34,211,238,0.55)'
    ctx.lineWidth = 3
    rr(ctx, wx, wy, ww, wh, 10)
    ctx.stroke()

  }
  // headline wall: rotating headlines panel right side
  const hx = w * 0.62, hy = wy + wh * 0.12, hw2 = ww * 0.34
  ctx.fillStyle = 'rgba(3,7,23,0.75)'
  rr(ctx, hx, hy, hw2, wh * 0.76, 8)
  ctx.fill()
  const hIdx = Math.floor((reduced ? f.segIndex * 3 + Math.floor(t / 6) : t / 4)) % HEADLINES.length
  text(ctx, 'HEADLINES', hx + hw2 / 2, hy + wh * 0.12, {
    font: `800 ${u * 0.028}px system-ui`, color: '#22d3ee', align: 'center',
  })
  for (let i = 0; i < 3; i++) {
    const idx = (hIdx + i) % HEADLINES.length
    const yy = hy + wh * (0.26 + i * 0.22)
    ctx.fillStyle = i === 0 ? '#f8fafc' : 'rgba(226,232,240,0.55)'
    ctx.font = `600 ${u * 0.022}px system-ui`
    ctx.save()
    ctx.beginPath()
    ctx.rect(hx + 6, yy - wh * 0.09, hw2 - 12, wh * 0.18)
    ctx.clip()
    ctx.fillText(`• ${HEADLINES[idx]}`, hx + 12, yy, hw2 - 24)
    ctx.restore()
  }

  // desk
  const deskY = h * 0.62
  const dg = ctx.createLinearGradient(0, deskY, 0, h)
  dg.addColorStop(0, '#1e293b')
  dg.addColorStop(1, '#0f172a')
  ctx.fillStyle = dg
  rr(ctx, -w * 0.05, deskY, w * 1.1, h - deskY + 10, 16)
  ctx.fill()
  ctx.fillStyle = '#22d3ee'
  ctx.globalAlpha = 0.75
  ctx.fillRect(0, deskY, w, 3)
  ctx.globalAlpha = 1
  // desk logo
  text(ctx, 'GN404', w * 0.5, deskY + h * 0.1, {
    font: `900 ${u * 0.075}px system-ui`, align: 'center',
    color: 'rgba(34,211,238,0.85)', shadow: 'rgba(34,211,238,0.6)',
  })

  // anchors — talk when their beats are active
  const speaker = f.beat.speaker ?? ''
  const zorpTalks = speaker.includes('Zorpina') || speaker === ''
  const glarbTalks = speaker.includes('Glarb')
  const bob = reduced ? 0 : Math.sin(t * 2) * u * 0.008

  // the anchor is photographed; the drawn pair is the fallback
  const anchorH = h * 0.62
  const hasAnchor = drawSubject(ctx, f, {
    x: w * 0.34, y: deskY + h * 0.02, w: anchorH * 0.74, h: anchorH,
    anchor: 1, crop: PORTRAIT_CROP, phase: 0,
  })
  if (!hasAnchor) {
    alien(ctx, {
      x: w * 0.3, y: deskY - u * 0.1 + bob, s: u * 0.085,
      color: '#67e8f9', shade: '#0e7490', eyes: 2, antenna: true,
      blink: blinkPhase(t, seed + 1), talk: talkPhase(t, 12, zorpTalks),
    })
    alien(ctx, {
      x: w * 0.46, y: deskY - u * 0.085 - bob, s: u * 0.075,
      color: '#f9a8d4', shade: '#9d174d', eyes: 3,
      blink: blinkPhase(t, seed + 2, 4.1), talk: talkPhase(t + 0.4, 11, glarbTalks),
    })
  }

  // mic + papers
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(w * 0.36, deskY)
  ctx.quadraticCurveTo(w * 0.36, deskY - u * 0.05, w * 0.33, deskY - u * 0.06)
  ctx.stroke()
  ctx.fillStyle = '#e2e8f0'
  ctx.save()
  ctx.translate(w * 0.24, deskY + h * 0.03)
  ctx.rotate(-0.1)
  ctx.fillRect(0, 0, u * 0.08, u * 0.05)
  ctx.restore()

  // LIVE light flashes gently at segment start
  const liveGlow = 0.5 + 0.5 * Math.sin(t * 4)
  ctx.fillStyle = `rgba(248,113,113,${reduced ? 0.7 : 0.4 + liveGlow * 0.6})`
  circle(ctx, w - u * 0.09, h * 0.1, u * 0.014)
  ctx.fill()
  text(ctx, 'LIVE', w - u * 0.12, h * 0.1 + u * 0.005, {
    font: `800 ${u * 0.022}px system-ui`, color: '#fecaca', align: 'right', baseline: 'middle',
  })

  // breaking-news flash on gavel-less channels: pulse at beat starts (not when reduced)
  if (!reduced && f.beatT < 0.5 && f.beat.sfx) {
    ctx.fillStyle = `rgba(244,114,182,${0.25 * (1 - f.beatT * 2)})`
    ctx.fillRect(0, 0, w, h)
  }

  // ticker
  const ticker = `GN404 • ${f.segment.title.toUpperCase()} • SIMULATED LIVE BROADCAST • ALL HEADLINES FICTIONAL • ${HEADLINES[(f.segIndex + 1) % HEADLINES.length]} • `
  marquee(ctx, ticker, h - h * 0.085, reduced ? 0 : t, w, h * 0.085, {
    bg: 'rgba(2,6,23,0.9)', color: '#e0f2fe', speed: reduced ? 0 : 64,
  })

  sparkle(ctx, w * 0.94, h * 0.18, u * 0.02, '#22d3ee', reduced ? 0 : t)

  // ── film pass: haze, halation and grain over the whole frame ──
  filmPass(ctx, f, { grain: 0.045, bloom: 0.3, radius: 13 })
}
