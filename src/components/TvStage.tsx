/**
 * TvStage — the television itself.
 *
 * - Runs one requestAnimationFrame loop that draws ONLY the active channel.
 * - Derives every frame from the deterministic schedule (channelStateAt),
 *   so switching away and back always lands on the correct broadcast offset.
 * - Triggers beat SFX + optional speech narration exactly once per beat.
 * - Shows captions, channel bug, now-playing bar, numeric entry, power
 *   screen, tuning static, and a visible fallback if a renderer throws.
 */

import { useEffect, useRef } from 'react'
import type { ChannelMeta, FrameInfo } from '../types'
import { getVisualForChannel } from '../channels'
import { channelStateAt, fmtClock } from '../lib/schedule'
import { audio } from '../lib/audio'
import { staticNoise, text, tuningScreen } from '../lib/draw'

export interface OnAirInfo {
  segIndex: number
  beatIndex: number
  t: number
  progress: number
}

interface Props {
  channel: ChannelMeta
  power: boolean
  reduced: boolean
  crt: boolean
  captions: boolean
  tuning: boolean
  numEntry: string | null
  onair: OnAirInfo
  onTurnOn: () => void
  fullscreenSupported: boolean
}

export default function TvStage({
  channel, power, reduced, crt, captions, tuning, numEntry,
  onair, onTurnOn, fullscreenSupported,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const beatKeyRef = useRef<string>('')
  const failedRef = useRef<Set<string>>(new Set())
  const startRef = useRef<number>(performance.now())
  const propsRef = useRef({ channel, power, reduced, tuning })
  propsRef.current = { channel, power, reduced, tuning }

  // ── render loop ──
  useEffect(() => {
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { channel: ch, power: pw, reduced: red, tuning: tn } = propsRef.current

      const parent = canvas.parentElement
      const cw = parent?.clientWidth ?? 640
      const chh = parent?.clientHeight ?? 360
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const bw = Math.floor(cw * dpr)
      const bh = Math.floor(chh * dpr)
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw
        canvas.height = bh
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const wall = performance.now()
      const nowSec = (wall - startRef.current) / 1000

      if (!pw) {
        // classic CRT "off" look
        ctx.fillStyle = '#050508'
        ctx.fillRect(0, 0, cw, chh)
        ctx.fillStyle = 'rgba(148,163,184,0.5)'
        ctx.fillRect(cw * 0.2, chh / 2 - 1, cw * 0.6, 2)
        return
      }

      if (tn) {
        tuningScreen(ctx, cw, chh, red ? wall / 4000 : wall / 1000)
        if (red) {
          text(ctx, 'TUNING…', cw / 2, chh / 2, {
            font: `700 ${Math.min(cw, chh) * 0.06}px system-ui`,
            align: 'center', baseline: 'middle', color: '#e2e8f0',
          })
        }
        return
      }

      const st = channelStateAt(ch, Date.now())
      const visual = getVisualForChannel(ch)
      const frame: FrameInfo = {
        w: cw, h: chh,
        t: st.t,
        segIndex: st.segIndex,
        segment: st.segment,
        beatIndex: st.beatIndex,
        beat: st.segment.beats[st.beatIndex] ?? st.segment.beats[0],
        beatT: st.beatT,
        loopT: st.loopT,
        cycle: st.cycle,
        seed: st.seed,
        now: nowSec,
        reduced: red,
        channel: ch,
      }

      if (!visual || failedRef.current.has(ch.id)) {
        // visible fallback for broken/missing renderers
        ctx.fillStyle = '#0b1020'
        ctx.fillRect(0, 0, cw, chh)
        staticNoise(ctx, cw, chh, nowSec, 0.06)
        text(ctx, '⚠ SIGNAL LOST', cw / 2, chh * 0.42, {
          font: `800 ${Math.min(cw, chh) * 0.07}px system-ui`,
          align: 'center', color: '#fca5a5',
        })
        text(ctx, `${ch.name} is having technical difficulties. Try another channel!`, cw / 2, chh * 0.55, {
          font: `600 ${Math.min(cw, chh) * 0.035}px system-ui`,
          align: 'center', color: '#cbd5e1',
        })
        return
      }

      try {
        visual.render(ctx, frame)
      } catch (err) {
        console.error(`Renderer failed for channel ${ch.id}:`, err)
        failedRef.current.add(ch.id)
      }

      // ── beat side-effects: SFX + speech, exactly once per beat ──
      const key = `${ch.id}:${st.segIndex}:${st.beatIndex}`
      if (key !== beatKeyRef.current) {
        beatKeyRef.current = key
        const beat = st.segment.beats[st.beatIndex]
        if (beat) {
          if (beat.sfx) audio.play(beat.sfx)
          audio.speak(beat.caption, beat.speaker)
        }
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // reset beat tracking when channel changes (so re-entry re-fires the intro beat)
  useEffect(() => {
    beatKeyRef.current = ''
  }, [channel.id])

  const segment = channel.segments[onair.segIndex] ?? channel.segments[0]
  const beat = segment.beats[onair.beatIndex] ?? segment.beats[0]
  const remaining = Math.max(0, segment.duration - onair.t)

  return (
    <div
      id="tv"
      className={[
        'tv-frame',
        power ? 'on' : 'off',
        crt && power ? 'crt' : '',
        reduced ? 'reduced' : '',
      ].filter(Boolean).join(' ')}
      aria-label={`Television screen playing ${channel.name}`}
    >
      <div className="screen-wrap">
        <canvas ref={canvasRef} className="screen" aria-hidden="true" />

        {/* CRT glass overlays */}
        {crt && power && !reduced && <div className="crt-scanlines" aria-hidden="true" />}
        {crt && power && <div className="crt-vignette" aria-hidden="true" />}
        {power && <div className="crt-glare" aria-hidden="true" />}

        {/* channel bug */}
        {power && !tuning && (
          <div className="channel-bug" aria-hidden="true">
            <span className="bug-logo" style={{ background: channel.accent }}>
              {channel.logoText}
            </span>
            <span className="bug-num">CH {String(channel.number).padStart(2, '0')}</span>
          </div>
        )}

        {/* simulated-live honesty badge */}
        {power && !tuning && (
          <div className="live-badge" aria-hidden="true">
            <span className="live-dot" /> SIMULATED LIVE
          </div>
        )}

        {/* captions */}
        {power && captions && !tuning && beat && (
          <div className="captions" role="status" aria-live="polite">
            {beat.speaker && <span className="cap-speaker">{beat.speaker}: </span>}
            {beat.caption}
          </div>
        )}

        {/* now playing bar */}
        {power && !tuning && (
          <div className="now-playing">
            <div className="np-row">
              <span className="np-name">{channel.name}</span>
              <span className="np-sep">•</span>
              <span className="np-segment">{segment.title}</span>
              <span className="np-time">-{fmtClock(remaining)}</span>
            </div>
            <div className="np-progress" aria-hidden="true">
              <div
                className="np-progress-fill"
                style={{ width: `${Math.round(onair.progress * 100)}%`, background: channel.accent }}
              />
            </div>
          </div>
        )}

        {/* numeric entry overlay */}
        {power && numEntry && (
          <div className="num-entry" aria-hidden="true">
            CH {numEntry}<span className="cursor">_</span>
          </div>
        )}

        {/* power screen */}
        {!power && (
          <div className="power-screen">
            <button className="power-big" onClick={onTurnOn}>
              <span className="power-icon" aria-hidden="true" />
              Turn on TV
            </button>
            <p className="power-sub">An infinite dial of simulated live programming from other universes</p>
          </div>
        )}
      </div>

      {/* bezel chin with knobs (decorative but real: they mirror state) */}
      <div className="bezel-chin" aria-hidden="true">
        <span className="chin-brand">INTERGALACTIC CABLE</span>
        <span className="chin-model">MODEL ∞ · SIM-U-LATOR</span>
        <span className={`chin-led ${power ? 'led-on' : ''}`} />
        <span className="chin-fs">{fullscreenSupported ? '⛶' : ''}</span>
      </div>
    </div>
  )
}
