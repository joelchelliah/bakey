import { useCallback, useEffect, useState } from 'react'
import { readJson, writeJson } from './storage'

/** Keeps the screen on while `enabled` and the page is visible. */
export function useWakeLock(enabled: boolean) {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  useEffect(() => {
    if (!enabled || !supported) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        if (document.visibilityState !== 'visible') return
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) lock.release()
      } catch {
        // e.g. low battery mode – ignore
      }
    }
    acquire()
    const onVisible = () => document.visibilityState === 'visible' && acquire()

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [enabled, supported])
  return supported
}

/** useState persisted in localStorage (per device). */
export function useLocalState<T>(key: string, initial: T): [T, (v: T) => void] {
  // oxlint-disable-next-line react/exhaustive-deps -- `initial` is only the fallback, like useState's
  const read = useCallback(() => readJson(key, initial), [key])
  const [value, setValue] = useState<T>(read)

  useEffect(() => setValue(read()), [read])

  const set = useCallback(
    (v: T) => {
      setValue(v)
      writeJson(key, v)
    },
    [key],
  )
  return [value, set]
}
