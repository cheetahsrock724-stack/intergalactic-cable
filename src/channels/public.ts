/**
 * Public Access Planet — low-fi community stage: curtains, spotlight,
 * talent acts (singing blob, bulletin board, splitting amoeba), audience.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'
import { between } from '../lib/rng'
import {
  alien, blinkPhase, circle, rr, sky, sparkle, text, talkPhase,
} from '../lib/draw'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#7c2d12'
  circle(ctx, 0, 0, s * 0.48)
  ctx.fill()
  // little TV with antenna
  ctx.fillStyle = '#fb923c'
  rr(ctx, -s * 0.28, -s * 0.16, s * 0.56, s * 0.38, s * 0.06)
  ctx.fill()
  ctx.fillStyle = '#431407'
  rr(ctx, -s * 0.2, -s * 0.1, s * 0.4, s * 0.22, s * 0.04)
  ctx.fill()
  ctx.strokeStyle = '#fdba74'
  ctx.lineWidth = s * 0.045
  ctx.beginPath()
  ctx.moveTo(-s * 0.12, -s * 0.16)
  ctx.lineTo(-s * 0.22, -s * 0.34 + Math.sin(t * 2) * s * 0.02)
  ctx.moveTo(s * 0.12, -s * 0.16)
  ctx.lineTo(s * 0.22, -s * 0.34 + Math.cos(t * 2) * s * 0.02)
  ctx.stroke()
  ctx.restore()
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)
  sky(ctx, w, h, '#1c0a03', '#2d1206', '#431407')

  const segId = f.segment.id

  // ── stage ──
  const stageY = h * 0.68
  // back wall
  ctx.fillStyle = '#57230e'
  ctx.fillRect(0, h * 0.1, w, stageY - h * 0.1)
  // wood plank lines
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 1
  for (let y = h * 0.1; y < stageY; y += u * 0.05) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  // stage floor
  ctx.fillStyle = '#7c2d12'
  ctx.fillRect(0, stageY, w, h - stageY)
  ctx.fillStyle = 'rgba(251,146,60,0.25)'
  ctx.fillRect(0, stageY, w, u * 0.015)

  // spotlight cone
  ctx.save()
  const spotX = w * 0.5 + (reduced ? 0 : Math.sin(t * 0.4) * w * 0.04)
  const lg = ctx.createLinearGradient(spotX, 0, spotX, stageY)
  lg.addColorStop(0, 'rgba(254,243,199,0.22)')
  lg.addColorStop(1, 'rgba(254,243,199,0.03)')
  ctx.fillStyle = lg
  ctx.beginPath()
  ctx.moveTo(spotX - u * 0.02, h * 0.1)
  ctx.lineTo(spotX + u * 0.02, h * 0.1)
  ctx.lineTo(spotX + u * 0.2, stageY)
  ctx.lineTo(spotX - u * 0.2, stageY)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // curtains
  for (const side of [0, 1]) {
    const cx = side === 0 ? 0 : w - w * 0.14
    ctx.fillStyle = '#991b1b'
    ctx.fillRect(cx, 0, w * 0.14, h)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(cx + i * w * 0.035, 0, w * 0.012, h)
    }
  }
  // valance
  ctx.fillStyle = '#991b1b'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(w, 0)
  ctx.lineTo(w, h * 0.06)
  for (let x = w; x >= 0; x -= w * 0.1) {
    ctx.quadraticCurveTo(x - w * 0.05, h * 0.11, x - w * 0.1, h * 0.06)
  }
  ctx.closePath()
  ctx.fill()

  // ── audience silhouettes (front) ──
  for (let i = 0; i < 7; i++) {
    const ax = w * (0.08 + i * 0.14)
    const bob = reduced ? 0 : Math.abs(Math.sin(t * 3 + i * 1.1)) * u * 0.006
    ctx.fillStyle = '#0c0402'
    ctx.beginPath()
    ctx.ellipse(ax, h - u * 0.02 - bob, u * 0.05, u * 0.07, 0, Math.PI, Math.PI * 2)
    ctx.fill()
    circle(ctx, ax, h - u * 0.085 - bob, u * 0.022)
    ctx.fill()
  }
  // the lamp audience member
  const lampX = w * 0.92
  ctx.strokeStyle = '#0c0402'
  ctx.lineWidth = u * 0.008
  ctx.beginPath()
  ctx.moveTo(lampX, h)
  ctx.lineTo(lampX, h - u * 0.1)
  ctx.stroke()
  ctx.fillStyle = f.beat.sfx === 'crowd' ? '#fef08a' : '#a16207'
  ctx.beginPath()
  ctx.moveTo(lampX - u * 0.03, h - u * 0.1)
  ctx.lineTo(lampX + u * 0.03, h - u * 0.1)
  ctx.lineTo(lampX + u * 0.015, h - u * 0.14)
  ctx.lineTo(lampX - u * 0.015, h - u * 0.14)
  ctx.closePath()
  ctx.fill()

  // ── acts ──
  if (segId === 'pa-gary') {
    // Gary: big water blob with microphone, one long note
    const note = (reduced ? 0 : Math.sin(t * 2)) * 0.06
    const gy = stageY - u * 0.12 + Math.sin(t * 1.3) * u * 0.01
    ctx.save()
    ctx.translate(spotX, gy)
    const wob = reduced ? 1 : 1 + Math.sin(t * 3) * 0.05
    ctx.scale(wob, 2 - wob)
    const g2 = ctx.createRadialGradient(-u * 0.03, -u * 0.05, u * 0.01, 0, 0, u * 0.12)
    g2.addColorStop(0, 'rgba(125,211,252,0.95)')
    g2.addColorStop(1, 'rgba(2,132,199,0.9)')
    ctx.fillStyle = g2
    ctx.beginPath()
    ctx.ellipse(0, 0, u * 0.11, u * 0.1, 0, 0, Math.PI * 2)
    ctx.fill()
    // eyes (closed, feeling the music)
    ctx.strokeStyle = '#0c4a6e'
    ctx.lineWidth = u * 0.006
    ctx.beginPath()
    ctx.arc(-u * 0.035, -u * 0.02, u * 0.015, 0.2, Math.PI - 0.2)
    ctx.arc(u * 0.035, -u * 0.02, u * 0.015, 0.2, Math.PI - 0.2)
    ctx.stroke()
    // open singing mouth
    ctx.fillStyle = '#0c4a6e'
    ctx.beginPath()
    ctx.ellipse(0, u * 0.03, u * 0.02, u * (0.015 + Math.abs(note) * 0.3 + 0.01), 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // mic stand
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = u * 0.006
    ctx.beginPath()
    ctx.moveTo(spotX + u * 0.14, stageY)
    ctx.lineTo(spotX + u * 0.14, stageY - u * 0.16)
    ctx.stroke()
    ctx.fillStyle = '#1e293b'
    circle(ctx, spotX + u * 0.14, stageY - u * 0.17, u * 0.014)
    ctx.fill()
    // the ONE note floating
    if (!reduced) {
      const np = (t * 0.25) % 1
      ctx.globalAlpha = 1 - np
      text(ctx, '♪', spotX + u * 0.1 + np * u * 0.2, stageY - u * (0.2 + np * 0.2), {
        font: `${u * 0.05}px system-ui`, color: '#7dd3fc',
      })
      ctx.globalAlpha = 1
    }
    // "MOIST" banner during applause
    if (f.beat.sfx === 'crowd' || f.beat.sfx === 'chime') {
      text(ctx, '"MOIST."', spotX, stageY - u * 0.32, {
        font: `900 ${u * 0.04}px system-ui`, align: 'center', color: '#7dd3fc',
        shadow: 'rgba(125,211,252,0.6)',
      })
    }
  } else if (segId === 'pa-bulletin') {
    // cork bulletin board with pinned notes appearing per beat
    const bx = w * 0.24, by = h * 0.2, bw = w * 0.52, bh = h * 0.42
    ctx.fillStyle = '#92400e'
    rr(ctx, bx - u * 0.015, by - u * 0.015, bw + u * 0.03, bh + u * 0.03, 6)
    ctx.fill()
    ctx.fillStyle = '#b45309'
    rr(ctx, bx, by, bw, bh, 4)
    ctx.fill()
    const notes = [
      { txt: 'LOST: MOON-MOON\nREWARD: CASSEROLE', hue: 50 },
      { txt: 'FOR SALE: GRAVITY WELL\nPULLS LEFT', hue: 200 },
      { txt: 'POTLUCK THURSDAY\nLABEL YOUR DISHES', hue: 130 },
      { txt: 'THANKS KEVIN!\n(STREETLIGHT IS FIXED-ISH)', hue: 320 },
    ]
    notes.forEach((note, i) => {
      if (i > f.beatIndex - 1) return
      const nx = bx + bw * (0.06 + (i % 2) * 0.5)
      const ny = by + bh * (0.1 + Math.floor(i / 2) * 0.45)
      ctx.save()
      ctx.translate(nx, ny)
      ctx.rotate(between(seed, i, -0.05, 0.05))
      ctx.fillStyle = `hsl(${note.hue}, 85%, 85%)`
      ctx.fillRect(0, 0, bw * 0.4, bh * 0.35)
      // pin
      ctx.fillStyle = '#dc2626'
      circle(ctx, bw * 0.2, -u * 0.004, u * 0.008)
      ctx.fill()
      ctx.fillStyle = '#1c1917'
      ctx.font = `700 ${u * 0.015}px system-ui`
      note.txt.split('\n').forEach((line, li) => {
        ctx.fillText(line, u * 0.012, bh * 0.12 + li * u * 0.024)
      })
      ctx.restore()
    })
    // Dorpa reading with pointer
    alien(ctx, {
      x: w * 0.14, y: stageY - u * 0.06, s: u * 0.055,
      color: '#fdba74', shade: '#9a3412', eyes: 2, antenna: true,
      blink: blinkPhase(t, seed + 6), talk: talkPhase(t, 10, true),
    })
    ctx.strokeStyle = '#fdba74'
    ctx.lineWidth = u * 0.012
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(w * 0.18, stageY - u * 0.08)
    ctx.lineTo(w * 0.24 + (reduced ? 0 : Math.sin(t * 3) * u * 0.02), stageY - u * 0.16)
    ctx.stroke()
  } else {
    // amoeba open mic — splits in two during the set
    const split = Math.min(1, Math.max(0, (t - 12) / 3))
    const ay = stageY - u * 0.08
    for (let i = 0; i <= (split > 0.5 ? 1 : 0); i++) {
      const ax = spotX + (i === 0 ? -1 : 1) * split * u * 0.1
      const s2 = u * (0.09 - split * 0.02)
      ctx.save()
      ctx.translate(ax, ay)
      ctx.fillStyle = 'rgba(134,239,172,0.9)'
      ctx.beginPath()
      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        const rr2 = s2 * (1 + (reduced ? 0 : Math.sin(a * 3 + t * 2 + i) * 0.08))
        const px = Math.cos(a) * rr2 * 1.2
        const py = Math.sin(a) * rr2 * 0.8
        if (a === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      // nucleus
      ctx.fillStyle = 'rgba(22,101,52,0.7)'
      circle(ctx, 0, 0, s2 * 0.35)
      ctx.fill()
      // eyes
      ctx.fillStyle = '#fff'
      circle(ctx, -s2 * 0.25, -s2 * 0.15, s2 * 0.16)
      ctx.fill()
      circle(ctx, s2 * 0.25, -s2 * 0.15, s2 * 0.16)
      ctx.fill()
      ctx.fillStyle = '#14532d'
      circle(ctx, -s2 * 0.25, -s2 * 0.15, s2 * 0.07)
      ctx.fill()
      circle(ctx, s2 * 0.25, -s2 * 0.15, s2 * 0.07)
      ctx.fill()
      ctx.restore()
    }
    // mic
    ctx.fillStyle = '#1e293b'
    circle(ctx, spotX - u * 0.14, stageY - u * 0.12, u * 0.012)
    ctx.fill()
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = u * 0.005
    ctx.beginPath()
    ctx.moveTo(spotX - u * 0.14, stageY - u * 0.11)
    ctx.lineTo(spotX - u * 0.14, stageY)
    ctx.stroke()
    if (split > 0.5) {
      text(ctx, '(the club allows this)', spotX, stageY - u * 0.24, {
        font: `600 ${u * 0.018}px system-ui`, align: 'center', color: 'rgba(254,243,199,0.8)',
      })
    }
  }

  // low-fi broadcast frame + rolling tracking line
  ctx.strokeStyle = 'rgba(253,186,116,0.5)'
  ctx.lineWidth = 2
  ctx.strokeRect(u * 0.015, u * 0.015, w - u * 0.03, h - u * 0.03)
  if (!reduced) {
    const ty = ((t * 40) % (h + 60)) - 30
    const tg = ctx.createLinearGradient(0, ty - 12, 0, ty + 12)
    tg.addColorStop(0, 'rgba(255,255,255,0)')
    tg.addColorStop(0.5, 'rgba(255,255,255,0.05)')
    tg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = tg
    ctx.fillRect(0, ty - 12, w, 24)
  }

  // REC dot
  const recOn = reduced ? true : Math.sin(t * 3) > 0
  if (recOn) {
    ctx.fillStyle = '#ef4444'
    circle(ctx, w * 0.93, h * 0.06, u * 0.01)
    ctx.fill()
    text(ctx, 'REC', w * 0.93, h * 0.085, {
      font: `800 ${u * 0.014}px system-ui`, align: 'center', color: '#fca5a5',
    })
  }

  // corner sparkles for talent applause
  if (f.beat.sfx === 'crowd' || f.beat.sfx === 'chime') {
    for (let i = 0; i < 5; i++) {
      sparkle(ctx, between(seed, i * 9, w * 0.2, w * 0.8), between(seed, i * 9 + 1, h * 0.15, h * 0.5), u * 0.012, '#fde047', reduced ? 0 : t + i)
    }
  }

  ctx.fillStyle = 'rgba(2,6,23,0.75)'
  ctx.fillRect(0, h - h * 0.05, w, h * 0.05)
  text(ctx, 'PUBLIC ACCESS PLANET • FILMED IN A CRATER WITH ONE CHAIR • COMMUNITY POWERED', w * 0.5, h - h * 0.022, {
    font: `700 ${u * 0.014}px system-ui`, align: 'center', baseline: 'middle', color: '#fed7aa',
  })
}
