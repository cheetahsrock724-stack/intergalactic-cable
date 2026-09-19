/**
 * Earth Explained Wrong — blueprint-style documentary diagrams of everyday
 * objects with confidently wrong labels, magnifier, confidence meter.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import {
  circle, rr, sky, starfield, text, wrapText,
} from '../lib/draw'
import { photoBackdrop } from '../lib/plates'
import { filmPass } from '../lib/film'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#166534'
  circle(ctx, 0, 0, s * 0.48)
  ctx.fill()
  // tiny blue planet with a question mark
  ctx.fillStyle = '#3b82f6'
  circle(ctx, 0, 0, s * 0.3)
  ctx.fill()
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.ellipse(-s * 0.1, -s * 0.05, s * 0.12, s * 0.08, 0.6 + Math.sin(t) * 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fef08a'
  ctx.font = `900 ${s * 0.36}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('?', s * 0.02, s * 0.02)
  ctx.restore()
}

type Label = { x: number; y: number; text: string; side: 1 | -1 }

interface Subject {
  name: string
  labels: Label[]
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, reduced: boolean) => void
}

const SUBJECTS: Record<string, Subject> = {
  'ew-toaster': {
    name: 'TOASTER (RITUAL HEAT SHRINE)',
    labels: [
      { x: 0.05, y: -0.45, text: 'OFFERING SLOT', side: -1 },
      { x: 0.42, y: -0.1, text: 'CEREMONIAL CATAPULT', side: 1 },
      { x: -0.4, y: 0.15, text: 'FIRE TRIAL CHAMBER', side: -1 },
      { x: 0.1, y: 0.48, text: 'ALTAR OF FAILED OFFERINGS', side: 1 },
    ],
    draw: (ctx, x, y, s, t, reduced) => {
      ctx.save()
      ctx.translate(x, y)
      // body
      ctx.fillStyle = '#94a3b8'
      rr(ctx, -s * 0.5, -s * 0.3, s, s * 0.6, s * 0.12)
      ctx.fill()
      ctx.fillStyle = '#cbd5e1'
      rr(ctx, -s * 0.5, -s * 0.3, s, s * 0.12, s * 0.06)
      ctx.fill()
      // slots
      ctx.fillStyle = '#1e293b'
      rr(ctx, -s * 0.35, -s * 0.26, s * 0.3, s * 0.06, s * 0.02)
      ctx.fill()
      rr(ctx, s * 0.05, -s * 0.26, s * 0.3, s * 0.06, s * 0.02)
      ctx.fill()
      // glow from within
      const glow = 0.5 + (reduced ? 0.3 : Math.sin(t * 3) * 0.3)
      ctx.fillStyle = `rgba(251,146,60,${glow})`
      rr(ctx, -s * 0.32, -s * 0.24, s * 0.24, s * 0.03, s * 0.01)
      ctx.fill()
      rr(ctx, s * 0.08, -s * 0.24, s * 0.24, s * 0.03, s * 0.01)
      ctx.fill()
      // lever
      const leverY = reduced ? 0 : Math.sin(t * 0.8) * s * 0.04
      ctx.fillStyle = '#475569'
      rr(ctx, s * 0.44, -s * 0.1 + leverY, s * 0.08, s * 0.14, s * 0.03)
      ctx.fill()
      // toast popping periodically
      const pop = (t % 8) / 8
      if (pop > 0.7) {
        const up = (pop - 0.7) / 0.3
        ctx.fillStyle = '#fbbf24'
        rr(ctx, -s * 0.33, -s * 0.26 - up * s * 0.3, s * 0.26, s * 0.22, s * 0.04)
        ctx.fill()
        ctx.fillStyle = '#92400e'
        circle(ctx, -s * 0.24, -s * 0.17 - up * s * 0.3, s * 0.02)
        ctx.fill()
        circle(ctx, -s * 0.16, -s * 0.17 - up * s * 0.3, s * 0.02)
        ctx.fill()
      }
      // feet
      ctx.fillStyle = '#334155'
      ctx.fillRect(-s * 0.4, s * 0.3, s * 0.12, s * 0.06)
      ctx.fillRect(s * 0.28, s * 0.3, s * 0.12, s * 0.06)
      ctx.restore()
    },
  },
  'ew-sock': {
    name: 'SINGLE SOCK (SACRED TEXTILE)',
    labels: [
      { x: -0.1, y: -0.5, text: 'ASCENSION CUFF', side: -1 },
      { x: 0.4, y: -0.15, text: 'PARTNER MEMORY ZONE', side: 1 },
      { x: -0.42, y: 0.1, text: 'PORTAL SCAR (WASHING)', side: -1 },
      { x: 0.15, y: 0.45, text: 'PUPPET CONTROL DOME', side: 1 },
    ],
    draw: (ctx, x, y, s, t, reduced) => {
      ctx.save()
      ctx.translate(x, y)
      const sway = reduced ? 0 : Math.sin(t * 1.2) * 0.08
      ctx.rotate(sway)
      // sock shape
      ctx.fillStyle = '#60a5fa'
      ctx.beginPath()
      ctx.moveTo(-s * 0.22, -s * 0.55)
      ctx.lineTo(s * 0.22, -s * 0.55)
      ctx.lineTo(s * 0.2, s * 0.1)
      ctx.quadraticCurveTo(s * 0.18, s * 0.45, s * 0.45, s * 0.42)
      ctx.quadraticCurveTo(s * 0.6, s * 0.4, s * 0.58, s * 0.55)
      ctx.quadraticCurveTo(s * 0.5, s * 0.7, s * 0.1, s * 0.6)
      ctx.quadraticCurveTo(-s * 0.22, s * 0.5, -s * 0.24, s * 0.1)
      ctx.closePath()
      ctx.fill()
      // stripes
      ctx.fillStyle = '#dbeafe'
      ctx.fillRect(-s * 0.22, -s * 0.5, s * 0.44, s * 0.07)
      ctx.fillRect(-s * 0.23, -s * 0.36, s * 0.45, s * 0.05)
      // hole (portal scar)
      ctx.fillStyle = '#1e3a8a'
      ctx.beginPath()
      ctx.ellipse(-s * 0.05, -s * 0.1, s * 0.08, s * 0.06, 0.4, 0, Math.PI * 2)
      ctx.fill()
      // googly eyes (memorial effigy)
      for (const ex of [-s * 0.1, s * 0.08]) {
        ctx.fillStyle = '#fff'
        circle(ctx, ex, s * 0.28, s * 0.07)
        ctx.fill()
        const look = reduced ? 0 : Math.sin(t * 2 + ex) * s * 0.02
        ctx.fillStyle = '#1e1b4b'
        circle(ctx, ex + look, s * 0.28, s * 0.03)
        ctx.fill()
      }
      ctx.restore()
    },
  },
  'ew-fan': {
    name: 'CEILING FAN (GOVERNOR OF TIME)',
    labels: [
      { x: 0, y: -0.55, text: 'TEMPORAL ANCHOR BOLT', side: 1 },
      { x: 0.48, y: -0.1, text: 'HOUR BLADE, SENIOR', side: 1 },
      { x: -0.48, y: 0.1, text: 'HOUR BLADE, JUNIOR', side: -1 },
      { x: 0.05, y: 0.5, text: 'NEGOTIATION CORD (DO NOT PULL 3×)', side: 1 },
    ],
    draw: (ctx, x, y, s, t, reduced) => {
      ctx.save()
      ctx.translate(x, y - s * 0.1)
      // rod
      ctx.fillStyle = '#78716c'
      ctx.fillRect(-s * 0.03, -s * 0.55, s * 0.06, s * 0.3)
      // motor
      ctx.fillStyle = '#a8a29e'
      circle(ctx, 0, -s * 0.2, s * 0.12)
      ctx.fill()
      // blades
      const spin = reduced ? 0.5 : t * 2.2
      for (let i = 0; i < 4; i++) {
        const a = spin + (i * Math.PI) / 2
        ctx.save()
        ctx.rotate(a)
        ctx.fillStyle = i % 2 ? '#d6d3d1' : '#a8a29e'
        rr(ctx, s * 0.1, -s * 0.035, s * 0.5, s * 0.07, s * 0.03)
        ctx.fill()
        ctx.restore()
      }
      ctx.fillStyle = '#57534e'
      circle(ctx, 0, -s * 0.2, s * 0.05)
      ctx.fill()
      // pull chain
      const chainSway = reduced ? 0 : Math.sin(t * 1.5) * s * 0.03
      ctx.strokeStyle = '#a8a29e'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(s * 0.08, -s * 0.12)
      ctx.quadraticCurveTo(s * 0.1 + chainSway, s * 0.1, s * 0.09 + chainSway, s * 0.28)
      ctx.stroke()
      ctx.fillStyle = '#fbbf24'
      circle(ctx, s * 0.09 + chainSway, s * 0.3, s * 0.035)
      ctx.fill()
      // rotating shadow stripes on "wall"
      if (!reduced) {
        ctx.globalAlpha = 0.12
        ctx.fillStyle = '#000'
        for (let i = 0; i < 6; i++) {
          const a = t * 1.1 + (i * Math.PI) / 3
          ctx.save()
          ctx.rotate(a)
          ctx.fillRect(0, -s * 0.01, s * 1.2, s * 0.02)
          ctx.restore()
        }
        ctx.globalAlpha = 1
      }
      ctx.restore()
    },
  },
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)

  // ── the set itself: a photographed plate when one is available ──
  const plated = photoBackdrop(ctx, f, { zoom: 1.02, tint: '#86efac', haze: 'rgba(134,239,172,0.12)', scrim: 0.4 })
  if (!plated) {
    sky(ctx, w, h, '#03120a', '#052e16', '#14532d')
    starfield(ctx, w, h, seed, reduced ? 0 : t * 0.2, 30, 0.5)

    // blueprint grid
    ctx.strokeStyle = 'rgba(134,239,172,0.1)'
    ctx.lineWidth = 1
    const grid = u * 0.06
    ctx.beginPath()
    for (let x = 0; x < w; x += grid) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
    }
    for (let y = 0; y < h; y += grid) {
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
    }
    ctx.stroke()

  }
  const subject = SUBJECTS[f.segment.id] ?? SUBJECTS['ew-toaster']

  // subject
  subject.draw(ctx, w * 0.5, h * 0.48, u * 0.4, t, reduced)

  // labels appear progressively with beats
  const shown = Math.min(subject.labels.length, f.beatIndex)
  subject.labels.forEach((label, i) => {
    if (i >= shown) return
    const age = t - (f.segment.beats[i + 1]?.t ?? 99)
    if (age < 0) return
    const lx = w * 0.5 + label.x * u * 0.75
    const ly = h * 0.48 + label.y * u * 0.6
    const anchorX = w * 0.5 + label.x * u * 0.3
    const anchorY = h * 0.48 + label.y * u * 0.35
    // leader line
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(anchorX, anchorY)
    ctx.lineTo(lx, ly)
    ctx.stroke()
    ctx.fillStyle = '#facc15'
    circle(ctx, anchorX, anchorY, 3)
    ctx.fill()
    // label box
    ctx.font = `700 ${u * 0.015}px system-ui`
    const tw = ctx.measureText(label.text).width
    const bx = label.side === 1 ? lx : lx - tw - 12
    ctx.fillStyle = 'rgba(2,6,23,0.85)'
    rr(ctx, bx - 6, ly - u * 0.017, tw + 12, u * 0.026, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(250,204,21,0.6)'
    ctx.stroke()
    text(ctx, label.text, bx, ly, {
      font: `700 ${u * 0.015}px system-ui`, color: '#fef08a',
    })
  })

  // magnifier sweep
  if (!reduced) {
    const mx = w * 0.5 + Math.sin(t * 0.4) * u * 0.2
    const my = h * 0.48 + Math.cos(t * 0.3) * u * 0.12
    ctx.strokeStyle = 'rgba(254,240,138,0.5)'
    ctx.lineWidth = u * 0.008
    circle(ctx, mx, my, u * 0.07)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(254,240,138,0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(mx + u * 0.05, my + u * 0.05)
    ctx.lineTo(mx + u * 0.09, my + u * 0.09)
    ctx.stroke()
  }

  // header
  ctx.fillStyle = 'rgba(2,6,23,0.85)'
  rr(ctx, w * 0.02, h * 0.02, w * 0.66, h * 0.12, 8)
  ctx.fill()
  text(ctx, 'EARTH EXPLAINED WRONG', w * 0.04, h * 0.055, {
    font: `800 ${u * 0.024}px system-ui`, color: '#fef08a',
  })
  ctx.font = `700 ${u * 0.016}px system-ui`
  const lines = wrapText(ctx, subject.name, `700 ${u * 0.016}px system-ui`, w * 0.6, 1)
  text(ctx, lines[0] ?? subject.name, w * 0.04, h * 0.1, {
    font: `700 ${u * 0.016}px system-ui`, color: '#bbf7d0',
  })

  // confidence meter (always 100%)
  ctx.fillStyle = 'rgba(2,6,23,0.85)'
  rr(ctx, w * 0.7, h * 0.02, w * 0.28, h * 0.075, 8)
  ctx.fill()
  text(ctx, 'CONFIDENCE', w * 0.72, h * 0.045, {
    font: `700 ${u * 0.013}px system-ui`, color: '#86efac',
  })
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  rr(ctx, w * 0.72, h * 0.06, w * 0.24, h * 0.015, 4)
  ctx.fill()
  ctx.fillStyle = '#22c55e'
  const fill = Math.min(1, t / 2)
  rr(ctx, w * 0.72, h * 0.06, w * 0.24 * fill, h * 0.015, 4)
  ctx.fill()
  text(ctx, '100%', w * 0.955, h * 0.072, {
    font: `800 ${u * 0.014}px system-ui`, align: 'right', color: '#bbf7d0',
  })

  // footer
  ctx.fillStyle = 'rgba(2,6,23,0.8)'
  ctx.fillRect(0, h - h * 0.055, w, h * 0.055)
  text(ctx, 'ANALYSIS BY PROF. WRONGINGTON • WRONGNESS: UNMEASURED • EARTH OBJECTS ARE HARMLESS, TRUST US', w * 0.5, h - h * 0.024, {
    font: `700 ${u * 0.014}px system-ui`, align: 'center', baseline: 'middle', color: '#bbf7d0',
  })

  // ── film pass: haze, halation and grain over the whole frame ──
  filmPass(ctx, f, { grain: 0.05, bloom: 0.32, radius: 15, haze: 'rgba(187,247,208,0.12)', hazeStrength: 0.1 })
}
