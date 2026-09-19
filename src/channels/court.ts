/**
 * Space Court — courtroom scene: judge with gavel strikes on beats,
 * two litigants arguing, jury of cubes, case banner, reactions.
 */

import type { ChannelRenderer, LogoRenderer } from '../types'

import {
  alien, blinkPhase, circle, rr, sky, speechBubble, starfield,
  talkPhase, text,
} from '../lib/draw'
import { photoBackdrop } from '../lib/plates'
import { filmPass } from '../lib/film'

export const logo: LogoRenderer = (ctx, x, y, size, t) => {
  ctx.save()
  ctx.translate(x, y)
  const s = size
  ctx.fillStyle = '#4c1d95'
  circle(ctx, 0, 0, s * 0.48)
  ctx.fill()
  // scales of justice
  ctx.strokeStyle = '#facc15'
  ctx.lineWidth = s * 0.06
  const tilt = Math.sin(t * 1.5) * 0.2
  ctx.beginPath()
  ctx.moveTo(0, -s * 0.25)
  ctx.lineTo(0, s * 0.2)
  ctx.moveTo(-s * 0.28, -s * 0.1 + tilt * s * 0.3)
  ctx.lineTo(s * 0.28, -s * 0.1 - tilt * s * 0.3)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(-s * 0.28, -s * 0.02 + tilt * s * 0.3, s * 0.1, 0, Math.PI)
  ctx.arc(s * 0.28, -s * 0.02 - tilt * s * 0.3, s * 0.1, 0, Math.PI)
  ctx.stroke()
  ctx.restore()
}

const CASES: Record<string, { plaintiff: string; defendant: string; no: string }> = {
  'sc-thursday': { plaintiff: 'ZIX', defendant: 'THURSDAY', no: '001' },
  'sc-singinghole': { plaintiff: 'BLOBBERT', defendant: 'BLACK HOLE', no: '002' },
  'sc-parking': { plaintiff: 'LUNA PETIT', defendant: 'MOTH JR.', no: '003' },
}

export const render: ChannelRenderer = (ctx, f) => {
  const { w, h, t, seed, reduced } = f
  const u = Math.min(w, h * 1.7)

  // ── the set itself: a photographed plate when one is available ──
  const plated = photoBackdrop(ctx, f, { zoom: 1.02, biasY: -0.05, tint: '#c4b5fd', haze: 'rgba(196,181,253,0.10)', scrim: 0.44 })
  if (!plated) {
    sky(ctx, w, h, '#1e1b4b', '#312e81', '#4c1d95')
    starfield(ctx, w, h, seed, reduced ? 0 : t, 30, 0.5)

  }
  const info = CASES[f.segment.id] ?? CASES['sc-thursday']

  // gavel shake: judge strikes near beat starts with sfx
  const gavelHit = !reduced && f.beat.sfx === 'gavel' && f.beatT < 0.35
  const shake = gavelHit ? Math.sin(f.beatT * 60) * u * 0.006 : 0
  ctx.save()
  ctx.translate(shake, shake * 0.5)

  if (!plated) {
    // courtroom back wall: big seal
    ctx.strokeStyle = 'rgba(250,204,21,0.35)'
    ctx.lineWidth = 3
    circle(ctx, w * 0.5, h * 0.24, u * 0.12)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(250,204,21,0.2)'
    circle(ctx, w * 0.5, h * 0.24, u * 0.1)
    ctx.stroke()
    text(ctx, '⚖', w * 0.5, h * 0.24, {
      font: `${u * 0.09}px system-ui`, align: 'center', baseline: 'middle', color: 'rgba(250,204,21,0.5)',
    })

  }
  // ── judge bench ──
  const benchY = h * 0.34
  ctx.fillStyle = '#78350f'
  rr(ctx, w * 0.3, benchY, w * 0.4, h * 0.16, 8)
  ctx.fill()
  ctx.fillStyle = '#92400e'
  ctx.fillRect(w * 0.3, benchY, w * 0.4, h * 0.03)

  // judge (3 eyes, tiny wig)
  const judgeTalks = (f.beat.speaker ?? '').includes('Judge')
  const jx = w * 0.5, jy = benchY - u * 0.02
  ctx.save()
  // wig
  ctx.fillStyle = '#e7e5e4'
  ctx.beginPath()
  ctx.ellipse(jx, jy - u * 0.075, u * 0.075, u * 0.028, 0, Math.PI, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 3; i++) {
    circle(ctx, jx - u * 0.05 + i * u * 0.05, jy - u * 0.085, u * 0.022)
    ctx.fill()
  }
  ctx.restore()
  alien(ctx, {
    x: jx, y: jy, s: u * 0.06, color: '#c4b5fd', shade: '#5b21b6',
    eyes: 3, blink: blinkPhase(t, seed + 5, 4.4), talk: talkPhase(t, 9, judgeTalks),
  })

  // gavel arm — swings on gavel beats
  const swing = gavelHit ? Math.sin(f.beatT * 18) * 0.9 : 0.2
  ctx.save()
  ctx.translate(jx + u * 0.09, jy + u * 0.02)
  ctx.rotate(swing)
  ctx.strokeStyle = '#c4b5fd'
  ctx.lineWidth = u * 0.018
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(u * 0.07, u * 0.03)
  ctx.stroke()
  ctx.fillStyle = '#78350f'
  rr(ctx, u * 0.055, u * 0.008, u * 0.05, u * 0.03, u * 0.008)
  ctx.fill()
  ctx.restore()
  // gavel block
  ctx.fillStyle = '#713f12'
  rr(ctx, jx + u * 0.13, jy + u * 0.05, u * 0.07, u * 0.02, 4)
  ctx.fill()
  if (gavelHit) {
    ctx.strokeStyle = `rgba(250,204,21,${1 - f.beatT * 3})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(jx + u * 0.16, jy + u * 0.05, f.beatT * u * 0.25, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ── litigant tables ──
  const tableY = h * 0.62
  for (const [i, label] of [info.plaintiff, info.defendant].entries()) {
    const lx = w * (i === 0 ? 0.22 : 0.78)
    ctx.fillStyle = '#57534e'
    rr(ctx, lx - w * 0.13, tableY + u * 0.06, w * 0.26, h * 0.05, 6)
    ctx.fill()
    const isSpeaking =
      (f.beat.speaker ?? '').toUpperCase().includes(label.split(' ')[0]) ||
      (i === 0 && (f.beat.speaker ?? '').includes('Zix')) ||
      (i === 1 && ((f.beat.speaker ?? '').includes('Defense') || (f.beat.speaker ?? '').includes('Luna') || (f.beat.speaker ?? '').includes('Moth')))
    const colors = i === 0 ? ['#86efac', '#166534'] : ['#fda4af', '#9f1239']
    alien(ctx, {
      x: lx, y: tableY - u * 0.01, s: u * 0.055,
      color: colors[0], shade: colors[1],
      eyes: i === 0 ? 2 : 1, antenna: i === 1,
      blink: blinkPhase(t, seed + 10 + i, 3.8),
      talk: talkPhase(t + i, 13, isSpeaking),
      rot: isSpeaking && !reduced ? Math.sin(t * 6) * 0.05 : 0,
    })
    text(ctx, label, lx, tableY + u * 0.06 + h * 0.045, {
      font: `800 ${u * 0.018}px system-ui`, align: 'center', color: '#e7e5e4',
    })
    // gesturing arm when speaking
    if (isSpeaking && !reduced) {
      const dir = i === 0 ? 1 : -1
      ctx.strokeStyle = colors[0]
      ctx.lineWidth = u * 0.016
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(lx + dir * u * 0.05, tableY)
      ctx.lineTo(lx + dir * u * 0.11, tableY - u * 0.05 - Math.sin(t * 9) * u * 0.03)
      ctx.stroke()
    }
  }

  // ── jury of small cubes (back row, bobbing) ──
  const juryY = h * 0.5
  for (let i = 0; i < 7; i++) {
    const jx2 = w * (0.1 + i * 0.133)
    const bob = reduced ? 0 : Math.abs(Math.sin(t * 3 + i)) * u * 0.008
    ctx.fillStyle = `hsl(${200 + i * 20}, 70%, ${55 + (i % 3) * 10}%)`
    rr(ctx, jx2 - u * 0.018, juryY - u * 0.018 - bob, u * 0.036, u * 0.036, u * 0.006)
    ctx.fill()
    ctx.fillStyle = '#1e1b4b'
    circle(ctx, jx2 - u * 0.007, juryY - u * 0.005 - bob, u * 0.004)
    ctx.fill()
    circle(ctx, jx2 + u * 0.007, juryY - u * 0.005 - bob, u * 0.004)
    ctx.fill()
    // tiny smile during chime beats
    if (f.beat.sfx === 'chime') {
      ctx.strokeStyle = '#1e1b4b'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(jx2, juryY + u * 0.006 - bob, u * 0.008, 0.2, Math.PI - 0.2)
      ctx.stroke()
    }
  }

  // ── case banner ──
  ctx.fillStyle = 'rgba(2,6,23,0.88)'
  rr(ctx, w * 0.02, h * 0.02, w * 0.6, h * 0.1, 8)
  ctx.fill()
  ctx.fillStyle = '#facc15'
  rr(ctx, w * 0.02, h * 0.02, u * 0.02, h * 0.1, 8)
  ctx.fill()
  text(ctx, `CASE #${info.no}: ${info.plaintiff} v. ${info.defendant}`, w * 0.06, h * 0.055, {
    font: `800 ${u * 0.021}px system-ui`, color: '#fde68a',
  })
  text(ctx, 'SPACE COURT • ALL DISPUTES FICTIONAL • NO REAL LAWYERS EXIST HERE', w * 0.06, h * 0.095, {
    font: `600 ${u * 0.014}px system-ui`, color: 'rgba(253,230,138,0.7)',
  })

  // floating "ORDER!" during gavel beats
  if (gavelHit) {
    ctx.save()
    ctx.globalAlpha = 1 - f.beatT * 2.5
    text(ctx, 'ORDER!', w * 0.5, h * 0.16, {
      font: `900 ${u * 0.07}px system-ui`, align: 'center', color: '#facc15',
      shadow: 'rgba(250,204,21,0.8)', stroke: '#451a03', strokeWidth: 6,
    })
    ctx.restore()
  }

  // speech bubble for dialogue beats
  if (f.beat.caption.length < 90 && (f.beat.speaker ?? '') !== 'Bailiff Boop') {
    const spk = (f.beat.speaker ?? '').toUpperCase()
    const onLeft = spk.includes('ZIX') || spk.includes('LUNA')
    const bx = onLeft ? w * 0.1 : w * 0.55
    const by = tableY - u * 0.2
    speechBubble(ctx, bx, by, w * 0.35, h * 0.1, onLeft ? bx + w * 0.05 : bx + w * 0.3, by + h * 0.14)
    ctx.fillStyle = '#1e1b4b'
    ctx.font = `600 ${u * 0.016}px system-ui`
    const words = f.beat.caption.split(' ')
    let line = ''
    let yy = by + h * 0.035
    for (const wd of words) {
      const test2 = line ? `${line} ${wd}` : wd
      if (ctx.measureText(test2).width > w * 0.32 && line) {
        ctx.fillText(line, bx + w * 0.016, yy)
        line = wd
        yy += h * 0.028
      } else line = test2
    }
    ctx.fillText(line, bx + w * 0.016, yy)
  }

  ctx.restore() // shake

  // bailiff strip
  ctx.fillStyle = 'rgba(2,6,23,0.8)'
  ctx.fillRect(0, h - h * 0.06, w, h * 0.06)
  const dots = '•'.repeat(1 + (Math.floor(t) % 3))
  text(ctx, `SPACE COURT — VERDICT PENDING ${dots}`, w * 0.5, h - h * 0.025, {
    font: `700 ${u * 0.016}px system-ui`, align: 'center', color: '#c4b5fd', baseline: 'middle',
  })

  // ── film pass: haze, halation and grain over the whole frame ──
  filmPass(ctx, f, { grain: 0.055, bloom: 0.28, radius: 14, haze: 'rgba(196,181,253,0.12)', hazeStrength: 0.1 })
}
