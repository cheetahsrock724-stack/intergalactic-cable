/**
 * Preferences state hook — loads persisted prefs on mount, saves on change.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PREFS, clearPrefs, loadPrefs, savePrefs,
  type Prefs,
} from '../lib/prefs'

export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void, () => void] {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs())
  const first = useRef(true)

  useEffect(() => {
    // skip the very first save (nothing changed yet)
    if (first.current) {
      first.current = false
      return
    }
    savePrefs(prefs)
  }, [prefs])

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => ({ ...p, ...patch }))
  }, [])

  const reset = useCallback(() => {
    clearPrefs()
    setPrefs({ ...DEFAULT_PREFS })
  }, [])

  return [prefs, update, reset]
}
