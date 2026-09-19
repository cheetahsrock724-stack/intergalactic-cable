/**
 * Persistent preferences. Stored as JSON in localStorage under a versioned
 * key. All storage access is guarded so the app still works when storage is
 * unavailable (private mode, embedded browsers, ...).
 */

export interface Prefs {
  volume: number // 0..1
  muted: boolean
  captions: boolean
  crt: boolean
  reducedMotion: boolean
  speech: boolean
  /** Photographic film pass: grain + bloom (costs fill rate). */
  film: boolean
  favorites: string[] // channel ids
  lastChannel: string // channel slug
}

export const PREFS_KEY = 'intergalactic-cable/v1'

export const DEFAULT_PREFS: Prefs = {
  volume: 0.7,
  muted: false,
  captions: true,
  crt: true,
  reducedMotion: false,
  speech: true,
  film: true,
  favorites: [],
  lastChannel: 'galactic-news-404',
}

function clampVolume(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  if (!Number.isFinite(n)) return DEFAULT_PREFS.volume
  return Math.min(1, Math.max(0, n))
}

/** Merge arbitrary stored data over defaults, sanitizing every field. */
export function sanitizePrefs(raw: unknown): Prefs {
  const p: Prefs = { ...DEFAULT_PREFS }
  if (!raw || typeof raw !== 'object') return p
  const r = raw as Record<string, unknown>
  p.volume = clampVolume(r.volume)
  if (typeof r.muted === 'boolean') p.muted = r.muted
  if (typeof r.captions === 'boolean') p.captions = r.captions
  if (typeof r.crt === 'boolean') p.crt = r.crt
  if (typeof r.reducedMotion === 'boolean') p.reducedMotion = r.reducedMotion
  if (typeof r.speech === 'boolean') p.speech = r.speech
  if (typeof r.film === 'boolean') p.film = r.film
  if (Array.isArray(r.favorites)) {
    p.favorites = r.favorites.filter((f): f is string => typeof f === 'string')
  }
  if (typeof r.lastChannel === 'string' && r.lastChannel) p.lastChannel = r.lastChannel
  return p
}

export function loadPrefs(storage: Pick<Storage, 'getItem'> = localStorage): Prefs {
  try {
    const raw = storage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    return sanitizePrefs(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(
  prefs: Prefs,
  storage: Pick<Storage, 'setItem'> = localStorage,
): boolean {
  try {
    storage.setItem(PREFS_KEY, JSON.stringify(prefs))
    return true
  } catch {
    return false
  }
}

export function clearPrefs(
  storage: Pick<Storage, 'removeItem'> = localStorage,
): void {
  try {
    storage.removeItem(PREFS_KEY)
  } catch {
    /* ignore */
  }
}
