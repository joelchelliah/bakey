import { useCallback, useEffect, useState } from 'react'

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
  const read = useCallback(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? (JSON.parse(s) as T) : initial
    } catch {
      return initial
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const [value, setValue] = useState<T>(read)
  useEffect(() => setValue(read()), [read])
  const set = useCallback(
    (v: T) => {
      setValue(v)
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch {
        // ignore
      }
    },
    [key],
  )
  return [value, set]
}
