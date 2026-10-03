import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authLog } from './authLog'
import { supabase } from './supabase'
import { normalizeRecipe, normalizeRecipes } from './model'
import { clearAllChecked, keys, readJson, removeKey, writeJson } from './storage'
import { StoreContext, type AuthState, type Store, type SyncState } from './storeContext'
import type { Recipe } from './types'
import { updateById } from './util'

type PendingOp = 'upsert' | 'delete'

interface StoreProviderProps {
  children: ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(() => normalizeRecipes(readJson(keys.recipes, [])))
  const [session, setSession] = useState<Session | null>(null)
  const [auth, setAuth] = useState<AuthState>(supabase ? 'loading' : 'signedIn')
  const [sync, setSync] = useState<SyncState>(supabase ? 'synced' : 'local')
  const pending = useRef<Record<string, PendingOp>>(readJson(keys.pending, {}))
  const recipesRef = useRef(recipes)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const flushing = useRef(false)

  const commit = useCallback((next: Recipe[]) => {
    recipesRef.current = next
    setRecipes(next)
    writeJson(keys.recipes, next)
  }, [])

  const flush = useCallback(async () => {
    if (!supabase || !session || flushing.current) return
    if (!Object.keys(pending.current).length) return setSync('synced')
    flushing.current = true
    setSync('syncing')
    try {
      // re-read each round so ops queued while flushing are sent too
      let ids: string[]
      while ((ids = Object.keys(pending.current)).length) {
        for (const id of ids) {
          const op = pending.current[id]
          if (op === 'delete') {
            const { error } = await supabase.from('recipes').delete().eq('id', id)
            if (error) throw error
          } else {
            const r = recipesRef.current.find((x) => x.id === id)
            if (r) {
              const { error } = await supabase
                .from('recipes')
                .upsert({ id, user_id: session.user.id, data: r, updated_at: r.updatedAt })
              if (error) throw error
            }
          }
          // only clear if nothing newer was queued meanwhile
          if (pending.current[id] === op) delete pending.current[id]
          writeJson(keys.pending, pending.current)
        }
      }
      setSync(Object.keys(pending.current).length ? 'pending' : 'synced')
    } catch (e) {
      console.warn('Sync failed, will retry', e)
      setSync('pending')
    } finally {
      flushing.current = false
    }
  }, [session])

  const pull = useCallback(async () => {
    if (!supabase || !session) return
    const { data, error } = await supabase.from('recipes').select('id, data')
    if (error) {
      console.warn('Fetch failed', error)
      return
    }
    const server = new Map<string, Recipe>()
    for (const row of data) {
      const r = normalizeRecipe(row.data)
      if (r) server.set(r.id, r)
    }
    // Local changes not yet synced win over the server copy.
    for (const [id, op] of Object.entries(pending.current)) {
      if (op === 'delete') server.delete(id)
      else {
        const local = recipesRef.current.find((x) => x.id === id)
        if (local) server.set(id, local)
      }
    }
    commit([...server.values()])
    flush()
  }, [session, commit, flush])

  // Auth
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data, error }) => {
      authLog(`APP getSession -> ${data.session ? 'session' : 'null'}`, error?.message ?? '')
      setSession(data.session)
      setAuth(data.session ? 'signedIn' : 'signedOut')
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      authLog(`APP event ${event} -> ${s ? 'session' : 'null'}`)
      setSession(s)
      setAuth(s ? 'signedIn' : 'signedOut')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Pull on sign-in, when coming back online and when the app regains focus
  useEffect(() => {
    if (!session) return
    // oxlint-disable-next-line react/set-state-in-effect -- pull() is async and only sets state after the fetch resolves
    pull()
    const onVisible = () => document.visibilityState === 'visible' && pull()
    window.addEventListener('online', pull)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', pull)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [session, pull])

  // Marked before the change reaches the server, so a pull in between keeps the local copy.
  const markPending = useCallback((id: string, op: PendingOp) => {
    if (!supabase) return
    pending.current[id] = op
    writeJson(keys.pending, pending.current)
  }, [])

  const queue = useCallback(
    (id: string, op: PendingOp) => {
      if (!supabase) return
      markPending(id, op)
      setSync('pending')
      flush()
    },
    [markPending, flush],
  )

  const save = useCallback(
    (r: Recipe) => {
      clearTimeout(timers.current[r.id])
      const updated = { ...r, updatedAt: new Date().toISOString() }
      const list = recipesRef.current
      const exists = list.some((x) => x.id === r.id)
      commit(exists ? updateById(list, r.id, () => updated) : [...list, updated])
      queue(r.id, 'upsert')
    },
    [commit, queue],
  )

  const saveSoon = useCallback(
    (r: Recipe) => {
      const list = recipesRef.current
      commit(updateById(list, r.id, () => r))
      markPending(r.id, 'upsert')
      clearTimeout(timers.current[r.id])
      timers.current[r.id] = setTimeout(() => save(recipesRef.current.find((x) => x.id === r.id) ?? r), 800)
    },
    [commit, markPending, save],
  )

  const remove = useCallback(
    (id: string) => {
      clearTimeout(timers.current[id])
      commit(recipesRef.current.filter((x) => x.id !== id))
      removeKey(keys.checked(id))
      queue(id, 'delete')
    },
    [commit, queue],
  )

  const addMany = useCallback(
    (list: Recipe[]) => {
      const ids = new Set(list.map((r) => r.id))
      commit([...recipesRef.current.filter((r) => !ids.has(r.id)), ...list])
      list.forEach((r) => queue(r.id, 'upsert'))
    },
    [commit, queue],
  )

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
    commit([])
    pending.current = {}
    writeJson(keys.pending, {})
    clearAllChecked()
  }, [commit])

  const sorted = useMemo(() => recipes.toSorted((a, b) => a.name.localeCompare(b.name)), [recipes])

  const value = useMemo<Store>(
    () => ({
      auth,
      email: session?.user.email,
      recipes: sorted,
      sync,
      save,
      saveSoon,
      remove,
      addMany,
      signOut,
      refresh: pull,
    }),
    [auth, session, sorted, sync, save, saveSoon, remove, addMany, signOut, pull],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
