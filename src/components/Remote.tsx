/**
 * Remote — the on-screen remote control. Every button performs a real
 * action; nothing is decorative. Touch targets are >= 44px.
 */

import { useState } from 'react'
import type { ChannelMeta } from '../types'
import type { Prefs } from '../lib/prefs'

interface Props {
  channel: ChannelMeta
  power: boolean
  prefs: Prefs
  isFavorite: boolean
  guideOpen: boolean
  fullscreen: boolean
  fullscreenSupported: boolean
  onPower: () => void
  onTuneDelta: (delta: number) => void
  onRandom: () => void
  onGuide: () => void
  onMute: () => void
  onVolume: (delta: number) => void
  onFavorite: () => void
  onFullscreen: () => void
  onCaptions: () => void
  onShare: () => void
  onSetting: (key: 'crt' | 'reducedMotion' | 'speech', value: boolean) => void
  onResetPrefs: () => void
}

export default function Remote(p: Props) {
  const [showSettings, setShowSettings] = useState(false)
  const volPct = Math.round(p.prefs.volume * 100)

  const Toggle = ({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) => (
    <button
      className={`set-row ${on ? 'set-on' : ''}`}
      onClick={onClick}
      role="switch"
      aria-checked={on}
    >
      <span>{label}</span>
      <span className="set-knob" aria-hidden="true">{on ? 'ON' : 'OFF'}</span>
    </button>
  )

  return (
    <div className="remote" aria-label="TV remote control">
      {/* display */}
      <div className="remote-display">
        <span className="rd-ch">{String(p.channel.number).padStart(2, '0')}</span>
        <div className="rd-info">
          <span className="rd-name">{p.channel.name}</span>
          <span className="rd-sub">
            {p.prefs.muted ? 'MUTED' : `VOL ${volPct}%`} · {p.power ? 'ON AIR' : 'STANDBY'}
          </span>
        </div>
        <button
          className={`btn btn-fav ${p.isFavorite ? 'fav-on' : ''}`}
          onClick={p.onFavorite}
          aria-pressed={p.isFavorite}
          title={p.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {p.isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* main pad */}
      <div className="remote-pad">
        <div className="pad-col">
          <button className="btn btn-power" onClick={p.onPower} aria-label={p.power ? 'Turn TV off' : 'Turn TV on'}>
            <span aria-hidden="true">⏻</span>
          </button>
          <button className="btn btn-guide" onClick={p.onGuide} aria-pressed={p.guideOpen} aria-label="Toggle channel guide (G)">
            ☰ Guide
          </button>
        </div>

        <div className="pad-col pad-ch">
          <button className="btn btn-ch" onClick={() => p.onTuneDelta(1)} aria-label="Channel up">
            CH <span aria-hidden="true">▲</span>
          </button>
          <button className="btn btn-ch" onClick={() => p.onTuneDelta(-1)} aria-label="Channel down">
            CH <span aria-hidden="true">▼</span>
          </button>
        </div>

        <div className="pad-col">
          <button className="btn btn-vol" onClick={() => p.onVolume(0.1)} aria-label="Volume up">
            VOL <span aria-hidden="true">+</span>
          </button>
          <button className="btn btn-vol" onClick={() => p.onVolume(-0.1)} aria-label="Volume down">
            VOL <span aria-hidden="true">−</span>
          </button>
        </div>

        <div className="pad-col">
          <button className={`btn ${p.prefs.muted ? 'btn-active' : ''}`} onClick={p.onMute} aria-pressed={p.prefs.muted} aria-label="Mute (M)">
            {p.prefs.muted ? '🔇' : '🔊'}
          </button>
          <button className="btn btn-rand" onClick={p.onRandom} aria-label="Random channel">
            🎲 <span className="btn-text">Rand</span>
          </button>
        </div>
      </div>

      {/* utility row */}
      <div className="remote-utility">
        <button className={`btn btn-sm ${p.prefs.captions ? 'btn-active' : ''}`} onClick={p.onCaptions} aria-pressed={p.prefs.captions} title="Toggle captions">
          CC
        </button>
        <button
          className={`btn btn-sm ${p.fullscreen ? 'btn-active' : ''}`}
          onClick={p.onFullscreen}
          disabled={!p.fullscreenSupported}
          title={p.fullscreenSupported ? 'Fullscreen (F)' : 'Fullscreen not supported in this browser'}
          aria-pressed={p.fullscreen}
        >
          ⛶
        </button>
        <button className="btn btn-sm" onClick={p.onShare} title="Copy shareable link to this channel">
          🔗 Share
        </button>
        <button
          className={`btn btn-sm ${showSettings ? 'btn-active' : ''}`}
          onClick={() => setShowSettings((s) => !s)}
          aria-expanded={showSettings}
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {showSettings && (
        <div className="settings" role="group" aria-label="Settings">
          <Toggle label="CRT effects" on={p.prefs.crt} onClick={() => p.onSetting('crt', !p.prefs.crt)} />
          <Toggle label="Reduced motion" on={p.prefs.reducedMotion} onClick={() => p.onSetting('reducedMotion', !p.prefs.reducedMotion)} />
          <Toggle label="Voice narration" on={p.prefs.speech} onClick={() => p.onSetting('speech', !p.prefs.speech)} />
          <button className="set-row set-danger" onClick={p.onResetPrefs}>
            <span>Reset preferences</span>
            <span className="set-knob" aria-hidden="true">↺</span>
          </button>
          <p className="set-note">
            Favorites, volume, effects and last channel are saved on this device.
          </p>
        </div>
      )}

      <p className="remote-hint">
        Keys: ▲▼ channel · M mute · F fullscreen · G guide · 0-9 direct tune · Esc close
      </p>
    </div>
  )
}
