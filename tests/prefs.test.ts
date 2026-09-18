import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_PREFS, PREFS_KEY, clearPrefs, loadPrefs, sanitizePrefs, savePrefs,
} from '../src/lib/prefs'

class MemStorage implements Storage {
  private map = new Map<string, string>()
  get length(): number { return this.map.size }
  clear(): void { this.map.clear() }
  getItem(k: string): string | null { return this.map.get(k) ?? null }
  key(i: number): string | null { return [...this.map.keys()][i] ?? null }
  removeItem(k: string): void { this.map.delete(k) }
  setItem(k: string, v: string): void { this.map.set(k, v) }
}

describe('prefs', () => {
  let store: MemStorage
  beforeEach(() => { store = new MemStorage() })

  it('returns defaults when nothing is stored', () => {
    expect(loadPrefs(store)).toEqual(DEFAULT_PREFS)
  })

  it('round-trips saved prefs', () => {
    const p = { ...DEFAULT_PREFS, volume: 0.3, muted: true, favorites: ['gnews', 'radio'], lastChannel: 'space-court' }
    expect(savePrefs(p, store)).toBe(true)
    expect(loadPrefs(store)).toEqual(p)
  })

  it('clamps out-of-range volume', () => {
    expect(sanitizePrefs({ volume: 5 }).volume).toBe(1)
    expect(sanitizePrefs({ volume: -2 }).volume).toBe(0)
    expect(sanitizePrefs({ volume: 'oops' }).volume).toBe(DEFAULT_PREFS.volume)
  })

  it('ignores garbage types and keeps valid ones', () => {
    const p = sanitizePrefs({ muted: 'yes', captions: false, favorites: [1, 'ok', null], lastChannel: 42 })
    expect(p.muted).toBe(DEFAULT_PREFS.muted)
    expect(p.captions).toBe(false)
    expect(p.favorites).toEqual(['ok'])
    expect(p.lastChannel).toBe(DEFAULT_PREFS.lastChannel)
  })

  it('falls back to defaults on corrupted JSON', () => {
    store.setItem(PREFS_KEY, '{not json!!')
    expect(loadPrefs(store)).toEqual(DEFAULT_PREFS)
  })

  it('clearPrefs removes the stored key', () => {
    savePrefs({ ...DEFAULT_PREFS, volume: 0.1 }, store)
    clearPrefs(store)
    expect(store.getItem(PREFS_KEY)).toBeNull()
  })

  it('survives storage that throws (private mode)', () => {
    const hostile = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => { throw new Error('denied') },
    }
    expect(loadPrefs(hostile)).toEqual(DEFAULT_PREFS)
    expect(savePrefs(DEFAULT_PREFS, hostile)).toBe(false)
    expect(() => clearPrefs(hostile)).not.toThrow()
  })
})
