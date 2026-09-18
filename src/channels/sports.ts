/**
 * Parallel Sports — orbital dome arena with blob competitors chasing a
 * star-ball, deterministic score changes, bobbing crowd, scoreboard.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import { between } from '../lib/rng'
import { circle, rr, sky, starShape, starfield, text } from '../lib/draw'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#064e3b'
  circle(ctx, 0, 0, s * 0.48)
  ctx.fill()
  ctx.strokeStyle = '#4ade80'
  ctx.lineWidth = s * 0.07
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.3, 0.4, Math.PI * 1.3)
  ctx.stroke()
  ctx.fillStyle = '#22d3ee'
  const a = t * 2
  circle(ctx, Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3, s * 0.1)
  ctx.fill()
  ctx.restore()
}

interface Player {
  homeX: number
  homeY: number
  speed: number
  phase: number
  hue: number
  size: number
}

function makePlayers(seed: number, count: number): Player[] {
  const ps: Player[] = []
  for (let i = 0; i < count; i++) {
    ps.push({
      homeX: between(seed, i * 4, 0.15, 0.85),
      homeY: between(seed, i * 4 + 1, 0.35, 0.75),
      speed: between(seed, i * 4 + 2, 0.5, 1.4),
      phase: between(seed, i * 4 + 3, 0, Math.PI * 2),
      hue: i % 2 === 0 ? 185 : 275,
      size: between(seed, i * 4 + 5, 0.028, 0.042),
    })
  }
  return ps
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)
  sky(ctx, w, h, '#020617', '#052e16', '#064e3b')
  starfield(ctx, w, h, seed, reduced ? 0 : t, 40, 1)

  const segId = f.segment.id

  // dome arena
  ctx.strokeStyle = 'rgba(74,222,128,0.5)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.62, w * 0.46, h * 0.4, 0, Math.PI, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(6,78,59,0.35)'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.62, w * 0.46, h * 0.4, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  // floor ellipse
  ctx.strokeStyle = 'rgba(74,222,128,0.35)'
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.62, w * 0.46, h * 0.12, 0, 0, Math.PI * 2)
  ctx.stroke()

  // goal ring (right side)
  const goalX = w * 0.86, goalY = h * 0.45
  ctx.strokeStyle = '#facc15'
  ctx.lineWidth = u * 0.012
  ctx.beginPath()
  ctx.ellipse(goalX, goalY, u * 0.015, u * 0.07, 0, 0, Math.PI * 2)
  ctx.stroke()

  // crowd rows along the dome
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 14; i++) {
      const a = Math.PI + (i / 13) * Math.PI
      const rr2 = 1 - row * 0.08
      const cx = w * 0.5 + Math.cos(a) * w * 0.42 * rr2
      const cy = h * 0.62 + Math.sin(a) * h * 0.36 * rr2
      const bob = reduced ? 0 : Math.abs(Math.sin(t * 4 + i * 0.7 + row)) * u * 0.006
      ctx.fillStyle = `hsla(${(i * 47 + row * 90) % 360}, 70%, 60%, 0.7)`
      circle(ctx, cx, cy - bob, u * 0.009)
      ctx.fill()
    }
  }

  // ── competitors ──
  const players = makePlayers(seed + f.segIndex * 31, segId === 'ps-marathon' ? 6 : 5)
  // ball position: deterministic Lissajous around the arena
  const ballA = reduced ? 1 : t * 0.9
  const ballX = w * 0.5 + Math.cos(ballA) * w * 0.3
  const ballY = h * 0.5 + Math.sin(ballA * 1.7) * h * 0.18
  // ball trail
  if (!reduced) {
    for (let i = 1; i <= 5; i++) {
      const ta = ballA - i * 0.08
      ctx.fillStyle = `rgba(34,211,238,${0.3 - i * 0.05})`
      circle(
        ctx,
        w * 0.5 + Math.cos(ta) * w * 0.3,
        h * 0.5 + Math.sin(ta * 1.7) * h * 0.18,
        u * (0.018 - i * 0.002),
      )
      ctx.fill()
    }
  }

  players.forEach((p, i) => {
    // chase ball with orbiting offset
    const orbit = reduced ? 0 : t * p.speed + p.phase
    const px =
      ballX + Math.cos(orbit) * u * (0.08 + i * 0.02) + (p.homeX - 0.5) * w * 0.12
    const py =
      ballY + Math.sin(orbit) * u * (0.06 + i * 0.015) + (p.homeY - 0.55) * h * 0.2
    const squash = reduced ? 1 : 1 + Math.sin(orbit * 2) * 0.12
    ctx.save()
    ctx.translate(px, py)
    ctx.scale(1 / squash, squash)
    const g = ctx.createRadialGradient(-u * 0.01, -u * 0.01, u * 0.005, 0, 0, u * p.size)
    g.addColorStop(0, `hsl(${p.hue}, 90%, 72%)`)
    g.addColorStop(1, `hsl(${p.hue}, 80%, 42%)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(0, 0, u * p.size, u * p.size * 0.85, 0, 0, Math.PI * 2)
    ctx.fill()
    // eyes looking at ball
    const dx = ballX - px, dy = ballY - py
    const dl = Math.max(1, Math.hypot(dx, dy))
    ctx.fillStyle = '#fff'
    circle(ctx, -u * 0.012, -u * 0.008, u * 0.008)
    ctx.fill()
    circle(ctx, u * 0.012, -u * 0.008, u * 0.008)
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    circle(ctx, -u * 0.012 + (dx / dl) * u * 0.003, -u * 0.008 + (dy / dl) * u * 0.003, u * 0.004)
    ctx.fill()
    circle(ctx, u * 0.012 + (dx / dl) * u * 0.003, -u * 0.008 + (dy / dl) * u * 0.003, u * 0.004)
    ctx.fill()
    ctx.restore()
  })

  // star-ball
  ctx.save()
  ctx.translate(ballX, ballY)
  ctx.rotate(reduced ? 0 : t * 3)
  const pulse = 1 + (reduced ? 0 : Math.sin(t * 6) * 0.08)
  ctx.fillStyle = '#22d3ee'
  ctx.shadowColor = 'rgba(34,211,238,0.9)'
  ctx.shadowBlur = 14
  starShape(ctx, 0, 0, u * 0.03 * pulse, u * 0.014 * pulse, 4, 0)
  ctx.fill()
  ctx.restore()

  // ── scoreboard: deterministic score evolution ──
  const scores = [
    Math.floor((t + f.segIndex * 3) / 9) % 7,
    Math.floor((t + f.segIndex * 5 + 4) / 11) % 6,
  ]
  ctx.fillStyle = 'rgba(2,6,23,0.9)'
  rr(ctx, w * 0.34, h * 0.03, w * 0.32, h * 0.11, 8)
  ctx.fill()
  ctx.strokeStyle = 'rgba(74,222,128,0.6)'
  ctx.stroke()
  text(ctx, segId === 'ps-marathon' ? 'HEAT 7' : segId === 'ps-darts' ? 'SEMI-FINAL' : 'FINALS', w * 0.5, h * 0.058, {
    font: `700 ${u * 0.014}px system-ui`, align: 'center', color: '#86efac',
  })
  text(ctx, 'COMETS', w * 0.4, h * 0.1, {
    font: `800 ${u * 0.016}px system-ui`, align: 'center', color: '#67e8f9',
  })
  text(ctx, String(scores[0]), w * 0.5, h * 0.105, {
    font: `900 ${u * 0.034}px system-ui`, align: 'center', color: '#f8fafc',
  })
  text(ctx, '–', w * 0.545, h * 0.1, {
    font: `700 ${u * 0.02}px system-ui`, align: 'center', color: '#94a3b8',
  })
  text(ctx, String(scores[1]), w * 0.59, h * 0.105, {
    font: `900 ${u * 0.034}px system-ui`, align: 'center', color: '#f8fafc',
  })
  text(ctx, 'VOLTAGES', w * 0.665, h * 0.1, {
    font: `800 ${u * 0.016}px system-ui`, align: 'center', color: '#c4b5fd',
  })

  // GOAL flash (deterministic moments)
  const goalAt = [12, 25, 38]
  for (const ga of goalAt) {
    const dt = t - ga
    if (dt > 0 && dt < 1.4 && !reduced) {
      ctx.fillStyle = `rgba(250,204,21,${0.3 * (1 - dt / 1.4)})`
      ctx.fillRect(0, 0, w, h)
      text(ctx, 'POINT!', goalX - u * 0.12, goalY - u * 0.12, {
        font: `900 ${u * 0.05}px system-ui`, align: 'center', color: '#facc15',
        shadow: 'rgba(250,204,21,0.8)',
      })
    }
  }

  // darts variant: floating dartboard
  if (segId === 'ps-darts') {
    const dbY = h * 0.35 + (reduced ? 0 : Math.sin(t * 0.8) * h * 0.03)
    ctx.save()
    ctx.translate(w * 0.72, dbY)
    for (let i = 4; i >= 0; i--) {
      ctx.fillStyle = i % 2 ? '#dc2626' : '#f8fafc'
      circle(ctx, 0, 0, u * (0.02 + i * 0.018))
      ctx.fill()
    }
    // stuck darts
    for (let i = 0; i < 3; i++) {
      const a = between(seed, i, 0, Math.PI * 2)
      const d = between(seed, i + 40, 0, u * 0.05)
      ctx.strokeStyle = '#0ea5e9'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d)
      ctx.lineTo(Math.cos(a) * (d + u * 0.03), Math.sin(a) * (d + u * 0.03))
      ctx.stroke()
      ctx.fillStyle = '#facc15'
      circle(ctx, Math.cos(a) * (d + u * 0.035), Math.sin(a) * (d + u * 0.035), u * 0.006)
      ctx.fill()
    }
    ctx.restore()
  }

  // marathon variant: checkered path
  if (segId === 'ps-marathon') {
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? '#f8fafc' : '#0f172a'
      ctx.globalAlpha = 0.5
      ctx.fillRect(w * 0.04 + i * w * 0.092, h * 0.88, w * 0.092, h * 0.03)
      ctx.globalAlpha = 1
    }
  }

  ctx.fillStyle = 'rgba(2,6,23,0.85)'
  ctx.fillRect(0, h - h * 0.06, w, h * 0.06)
  text(ctx, 'PARALLEL SPORTS • FICTIONAL GAMES • SCORES DECIDED BY VIBES • CERTIFIED BY ONE SMALL REFEREE CUBE',
    w * 0.5, h - h * 0.026, {
      font: `700 ${u * 0.014}px system-ui`, align: 'center', baseline: 'middle', color: '#bbf7d0',
    })
}
