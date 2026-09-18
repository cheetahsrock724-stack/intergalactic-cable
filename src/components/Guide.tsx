/**
 * Guide — slide-out channel guide. Search + category filters + favorites
 * filter combine. "On air" rows derive from the same schedule function as
 * the player, so the guide always agrees with the TV.
 */

import { useMemo, useState } from 'react'
import { CATEGORIES, CHANNELS } from '../data/channels'
import { channelStateAt } from '../lib/schedule'
import type { CategoryId, ChannelMeta } from '../types'

interface Props {
  now: number
  currentSlug: string
  favorites: string[]
  onSelect: (slug: string) => void
  onToggleFavorite: (id: string) => void
  onClose: () => void
}

export default function Guide({ now, currentSlug, favorites, onSelect, onToggleFavorite, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [favOnly, setFavOnly] = useState(false)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CHANNELS.filter((ch) => {
      if (favOnly && !favorites.includes(ch.id)) return false
      if (category !== 'all' && ch.category !== category) return false
      if (!q) return true
      const haystack = [
        ch.name, ch.tagline, ch.logoText, String(ch.number),
        CATEGORIES.find((c) => c.id === ch.category)?.label ?? '',
        ...ch.segments.map((s) => s.title),
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [query, category, favOnly, favorites])

  const row = (ch: ChannelMeta) => {
    const st = channelStateAt(ch, now)
    const cat = CATEGORIES.find((c) => c.id === ch.category)
    const active = ch.slug === currentSlug
    return (
      <li key={ch.id}>
        <button
          className={`guide-row ${active ? 'guide-active' : ''}`}
          onClick={() => onSelect(ch.slug)}
          aria-current={active ? 'true' : undefined}
        >
          <span className="gr-logo" style={{ background: ch.accent }}>{ch.logoText}</span>
          <span className="gr-num">{String(ch.number).padStart(2, '0')}</span>
          <span className="gr-main">
            <span className="gr-name">{ch.name}</span>
            <span className="gr-now">
              <span className="gr-onair" aria-hidden="true">●</span> {st.segment.title}
            </span>
            <span className="gr-progress" aria-hidden="true">
              <span
                className="gr-progress-fill"
                style={{ width: `${Math.round((st.t / st.segment.duration) * 100)}%`, background: ch.accent }}
              />
            </span>
          </span>
          <span className="gr-cat">{cat?.label}</span>
        </button>
        <button
          className={`gr-fav ${favorites.includes(ch.id) ? 'fav-on' : ''}`}
          onClick={() => onToggleFavorite(ch.id)}
          aria-label={favorites.includes(ch.id) ? `Unfavorite ${ch.name}` : `Favorite ${ch.name}`}
          aria-pressed={favorites.includes(ch.id)}
        >
          {favorites.includes(ch.id) ? '★' : '☆'}
        </button>
      </li>
    )
  }

  return (
    <aside className="guide" role="dialog" aria-label="Channel guide">
      <div className="guide-head">
        <h2>Channel Guide</h2>
        <button className="btn btn-sm guide-close" onClick={onClose} aria-label="Close guide (Esc)">✕</button>
      </div>

      <div className="guide-search">
        <input
          type="search"
          placeholder="Search channels & shows…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search channels"
        />
        <button
          className={`btn btn-sm ${favOnly ? 'btn-active' : ''}`}
          onClick={() => setFavOnly((f) => !f)}
          aria-pressed={favOnly}
          title="Show favorites only"
        >
          ★
        </button>
      </div>

      <div className="guide-cats" role="group" aria-label="Category filters">
        <button className={`cat-chip ${category === 'all' ? 'cat-on' : ''}`} onClick={() => setCategory('all')}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`cat-chip ${category === c.id ? 'cat-on' : ''}`}
            onClick={() => setCategory((cur) => (cur === c.id ? 'all' : c.id))}
            aria-pressed={category === c.id}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="guide-list">
        {rows.map(row)}
        {rows.length === 0 && (
          <li className="guide-empty">
            No channels match. The multiverse is big, but not <em>that</em> big.
          </li>
        )}
      </ul>

      <p className="guide-foot">
        All programming is simulated live — generated from a deterministic schedule, not a real broadcast feed.
      </p>
    </aside>
  )
}
