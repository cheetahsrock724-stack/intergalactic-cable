/**
 * App — orchestrates power state, channel tuning, hash routing, keyboard
 * controls, audio wiring, and persistent preferences.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CHANNELS } from './data/channels'
import type { ChannelMeta } from './types'
import { channelStateAt } from './lib/schedule'
import {
  nextDialChannel,
  randomDialChannel,
  resolveChannelById,
  resolveChannelByNumber,
  resolveChannelBySlug,
} from './lib/dial'
import { audio } from './lib/audio'
import { film as filmPass } from './lib/film'
import { channelHash, parseChannelSlug, shareUrl } from './lib/url'
import { PREFS_KEY, DEFAULT_PREFS, loadPrefs } from './lib/prefs'
import { usePrefs } from './hooks/usePrefs'
import TvStage, { type OnAirInfo } from './components/TvStage'
import Remote from './components/Remote'
import Guide from './components/Guide'

const TUNE_MS = 420

function initialChannel(): ChannelMeta {
  const fromHash = parseChannelSlug(window.location.hash)
  if (fromHash) {
    const ch = resolveChannelBySlug(fromHash)
    if (ch) return ch
  }
  const prefs = loadPrefs()
  return resolveChannelBySlug(prefs.lastChannel) ?? CHANNELS[0]
}

export default function App() {
  const [prefs, updatePrefs, resetPrefs] = usePrefs()
  const [channel, setChannel] = useState<ChannelMeta>(initialChannel)
  const [prevChannel, setPrevChannel] = useState<ChannelMeta | null>(null)
  const [power, setPower] = useState(false)
  const [tuning, setTuning] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [numEntry, setNumEntry] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const numTimer = useRef<number | null>(null)
  const tuneTimer = useRef<number | null>(null)
  const toastTimer = useRef<number | null>(null)
  const tvRef = useRef<HTMLDivElement | null>(null)

  const fullscreenSupported =
    typeof document !== 'undefined' &&
    (document.fullscreenEnabled ||
      // Safari on iOS only supports video fullscreen; treat as unsupported
      !!(document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled)

  // ── schedule tick (guides + now-playing; cheap, 4 Hz) ──
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  // ── first-visit: honor OS reduced-motion preference ──
  useEffect(() => {
    let hasSaved = false
    try {
      hasSaved = localStorage.getItem(PREFS_KEY) !== null
    } catch { /* storage unavailable */ }
    if (!hasSaved && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      updatePrefs({ reducedMotion: true, crt: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── toast helper ──
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  // ── audio wiring ──
  useEffect(() => {
    audio.setVolume(prefs.volume)
    audio.setMuted(prefs.muted)
    audio.speechEnabled = prefs.speech
    filmPass.enabled = prefs.film
  }, [prefs.volume, prefs.muted, prefs.speech, prefs.film])

  useEffect(() => {
    if (power && !tuning) audio.setStyle(channel.music)
  }, [power, tuning, channel])

  // pause audio when the page is hidden; resume + recalc on return
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        void audio.suspend()
      } else if (power) {
        void audio.ensure().then(() => {
          if (power) audio.setStyle(channel.music)
        })
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [power, channel])

  // cleanup on unmount
  useEffect(() => () => {
    audio.dispose()
    if (numTimer.current) clearTimeout(numTimer.current)
    if (tuneTimer.current) clearTimeout(tuneTimer.current)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  // ── tuning ──
  /** Commit a channel change: state, prefs, hash, and the tuning interlude. */
  const applyTune = useCallback(
    (next: ChannelMeta) => {
      setChannel(next)
      updatePrefs({ lastChannel: next.slug })
      history.replaceState(null, '', channelHash(next.slug))
      if (power) {
        setTuning(true)
        audio.tuningBurst(TUNE_MS / 1000)
        audio.stopSpeech()
        if (tuneTimer.current) clearTimeout(tuneTimer.current)
        tuneTimer.current = window.setTimeout(() => setTuning(false), TUNE_MS)
      }
    },
    [power, updatePrefs],
  )

  const tune = useCallback(
    (next: ChannelMeta) => {
      if (next.slug === channel.slug) return
      setPrevChannel(channel)
      applyTune(next)
    },
    [channel, applyTune],
  )

  /** The remote's ⇄ Last button: hop back to the previous station and
   *  leave the one we just left as the new "last", so it toggles. */
  const tuneLast = useCallback(() => {
    if (!prevChannel) {
      showToast('No previous channel yet — flip somewhere first')
      return
    }
    const back = prevChannel
    setPrevChannel(channel)
    applyTune(back)
  }, [prevChannel, channel, applyTune, showToast])

  const tuneDelta = useCallback(
    (delta: number) => {
      tune(nextDialChannel(channel, delta))
    },
    [channel, tune],
  )

  const tuneRandom = useCallback(() => {
    tune(randomDialChannel(channel))
  }, [channel, tune])

  const tuneNumber = useCallback(
    (n: number) => {
      const ch = resolveChannelByNumber(n)
      if (ch) tune(ch)
      else showToast(`No channel ${n} in this universe`)
    },
    [tune, showToast],
  )

  // ── power ──
  const togglePower = useCallback(() => {
    if (power) {
      setPower(false)
      audio.powerOff()
      void audio.suspend()
    } else {
      // user gesture — safe to start audio
      void audio.ensure().then(() => {
        audio.setVolume(prefs.volume)
        audio.setMuted(prefs.muted)
        audio.powerOn()
        setPower(true)
      })
    }
  }, [power, prefs.volume, prefs.muted])

  // ── favorites ──
  const toggleFavorite = useCallback(
    (id: string) => {
      const has = prefs.favorites.includes(id)
      updatePrefs({
        favorites: has ? prefs.favorites.filter((f) => f !== id) : [...prefs.favorites, id],
      })
      const ch = resolveChannelById(id)
      if (ch) showToast(has ? `Removed ${ch.name} from favorites` : `★ ${ch.name} favorited`)
    },
    [prefs.favorites, updatePrefs, showToast],
  )

  // ── fullscreen ──
  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = tvRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void el.requestFullscreen?.()
    } catch {
      showToast('Fullscreen is not available here')
    }
  }, [showToast])

  // ── share ──
  const share = useCallback(() => {
    const url = shareUrl(channel.slug)
    const done = () => showToast('Link copied — send someone a channel from another universe')
    try {
      void navigator.clipboard.writeText(url).then(done, () => showToast(`Link: ${url}`))
    } catch {
      showToast(`Link: ${url}`)
    }
  }, [channel, showToast])

  // ── numeric entry ──
  const pushDigit = useCallback(
    (d: string) => {
      setNumEntry((cur) => {
        const next = ((cur ?? '') + d).slice(0, 3)
        if (numTimer.current) clearTimeout(numTimer.current)
        numTimer.current = window.setTimeout(() => {
          setNumEntry((v) => {
            if (v) tuneNumber(parseInt(v, 10))
            return null
          })
        }, 1400)
        return next
      })
    },
    [tuneNumber],
  )

  // ── keyboard controls ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) {
        return // never intercept typing in fields
      }
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          tuneDelta(1)
          break
        case 'ArrowDown':
          e.preventDefault()
          tuneDelta(-1)
          break
        case 'l': case 'L':
          tuneLast()
          break
        case 'm': case 'M':
          updatePrefs({ muted: !prefs.muted })
          break
        case 'f': case 'F':
          if (fullscreenSupported) toggleFullscreen()
          break
        case 'g': case 'G':
          setGuideOpen((g) => !g)
          break
        case 'Escape':
          if (guideOpen) setGuideOpen(false)
          else if (numEntry) setNumEntry(null)
          break
        case 'Enter':
          if (numEntry) {
            if (numTimer.current) clearTimeout(numTimer.current)
            tuneNumber(parseInt(numEntry, 10))
            setNumEntry(null)
          }
          break
        default:
          if (/^[0-9]$/.test(e.key)) pushDigit(e.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tuneDelta, prefs.muted, updatePrefs, fullscreenSupported, toggleFullscreen, guideOpen, numEntry, pushDigit, tuneNumber])

  // ── hash changes (manual edit / pasted link) ──
  useEffect(() => {
    const onHash = () => {
      const slug = parseChannelSlug(window.location.hash)
      if (!slug) return
      const ch = resolveChannelBySlug(slug)
      if (ch && ch.slug !== channel.slug) {
        setPrevChannel(channel)
        setChannel(ch)
        if (power) {
          setTuning(true)
          audio.stopSpeech()
          if (tuneTimer.current) clearTimeout(tuneTimer.current)
          tuneTimer.current = window.setTimeout(() => setTuning(false), TUNE_MS)
        }
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [channel, power])

  // ── reset preferences ──
  const onResetPrefs = useCallback(() => {
    resetPrefs()
    showToast('Preferences reset — fresh universe')
  }, [resetPrefs, showToast])

  // on-air info for overlays (from the same schedule code as the guide)
  const onair: OnAirInfo = useMemo(() => {
    const st = channelStateAt(channel, now)
    return {
      segIndex: st.segIndex,
      beatIndex: st.beatIndex,
      t: st.t,
      progress: Math.min(1, st.t / st.segment.duration),
    }
  }, [channel, now])

  const isFavorite = prefs.favorites.includes(channel.id)

  return (
    <div className={`app ${prefs.reducedMotion ? 'reduced-motion' : ''}`}>
      <header className="topbar">
        <h1 className="wordmark">
          <span className="wm-dish" aria-hidden="true">📡</span>
          INTERGALACTIC<span className="wm-accent">CABLE</span>
        </h1>
        <p className="tagline">Simulated live TV from imaginary planets &amp; alternate universes</p>
      </header>

      <main className="stage-layout">
        <div className="tv-column" ref={tvRef}>
          <TvStage
            channel={channel}
            power={power}
            reduced={prefs.reducedMotion}
            crt={prefs.crt}
            captions={prefs.captions}
            tuning={tuning}
            numEntry={numEntry}
            onair={onair}
            onTurnOn={togglePower}
            fullscreenSupported={fullscreenSupported}
          />
        </div>

        <Remote
          channel={channel}
          prevChannel={prevChannel}
          power={power}
          prefs={prefs}
          isFavorite={isFavorite}
          guideOpen={guideOpen}
          fullscreen={fullscreen}
          fullscreenSupported={fullscreenSupported}
          onPower={togglePower}
          onTuneDelta={tuneDelta}
          onLast={tuneLast}
          onRandom={tuneRandom}
          onGuide={() => setGuideOpen((g) => !g)}
          onMute={() => updatePrefs({ muted: !prefs.muted })}
          onVolume={(d) =>
            updatePrefs({
              volume: Math.min(1, Math.max(0, Math.round((prefs.volume + d) * 10) / 10)),
              muted: false,
            })
          }
          onFavorite={() => toggleFavorite(channel.id)}
          onFullscreen={toggleFullscreen}
          onCaptions={() => updatePrefs({ captions: !prefs.captions })}
          onShare={share}
          onSetting={(k, v) => updatePrefs({ [k]: v })}
          onResetPrefs={onResetPrefs}
        />
      </main>

      {guideOpen && (
        <Guide
          now={now}
          currentSlug={channel.slug}
          favorites={prefs.favorites}
          onSelect={(slug) => {
            const ch = resolveChannelBySlug(slug)
            if (ch) {
              tune(ch)
              if (window.innerWidth < 900) setGuideOpen(false)
            }
          }}
          onToggleFavorite={toggleFavorite}
          onClose={() => setGuideOpen(false)}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}

      <footer className="page-foot">
        <span>
          Every broadcast is original, procedurally animated fiction — deterministic scheduling,
          simulated live, no real feeds. Volume, favorites &amp; effects are stored locally
          (currently {prefs.lastChannel === DEFAULT_PREFS.lastChannel ? 'defaults' : 'saved'}).
        </span>
      </footer>
    </div>
  )
}
