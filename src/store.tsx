import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Recipe } from './types'

const CACHE_KEY = 'bakey.recipes.v1'
const PENDING_KEY = 'bakey.pending.v1'

type PendingOp = 'upsert' | 'delete'
export type SyncState = 'local' | 'synced' | 'syncing' | 'pending'
export type AuthState = 'loading' | 'signedOut' | 'signedIn'

interface Store {
  auth: AuthState
  email?: string
  recipes: Recipe[]
  sync: SyncState
  save: (r: Recipe) => void
  /** Debounced save, for frequently changing inputs on the recipe view. */
  saveSoon: (r: Recipe) => void
  remove: (id: string) => void
  addMany: (list: Recipe[]) => void
  signOut: () => Promise<void>
  refresh: () => void
}

const Ctx = createContext<Store | null>(null)

function readJson<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    return s ? (JSON.parse(s) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode / quota) – keep working in memory
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(() => readJson<Recipe[]>(CACHE_KEY, []))
  const [session, setSession] = useState<Session | null>(null)
  const [auth, setAuth] = useState<AuthState>(supabase ? 'loading' : 'signedIn')
  const [sync, setSync] = useState<SyncState>(supabase ? 'synced' : 'local')
  const pending = useRef<Record<string, PendingOp>>(readJson(PENDING_KEY, {}))
  const recipesRef = useRef(recipes)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const flushing = useRef(false)

  const commit = useCallback((next: Recipe[]) => {
    recipesRef.current = next
    setRecipes(next)
    writeJson(CACHE_KEY, next)
  }, [])

  const flush = useCallback(async () => {
    if (!supabase || !session || flushing.current) return
    const ids = Object.keys(pending.current)
    if (!ids.length) return setSync('synced')
    flushing.current = true
    setSync('syncing')
    try {
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
        writeJson(PENDING_KEY, pending.current)
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
    const server = new Map(data.map((row) => [row.id as string, row.data as Recipe]))
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuth(data.session ? 'signedIn' : 'signedOut')
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setAuth(s ? 'signedIn' : 'signedOut')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Pull on sign-in, when coming back online and when the app regains focus
  useEffect(() => {
    if (!session) return
    pull()
    const onVisible = () => document.visibilityState === 'visible' && pull()
    window.addEventListener('online', pull)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', pull)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [session, pull])

  const queue = useCallback(
    (id: string, op: PendingOp) => {
      if (!supabase) return
      pending.current[id] = op
      writeJson(PENDING_KEY, pending.current)
      setSync('pending')
      flush()
    },
    [flush],
  )

  const save = useCallback(
    (r: Recipe) => {
      clearTimeout(timers.current[r.id])
      const updated = { ...r, updatedAt: new Date().toISOString() }
      const list = recipesRef.current
      const exists = list.some((x) => x.id === r.id)
      commit(exists ? list.map((x) => (x.id === r.id ? updated : x)) : [...list, updated])
      queue(r.id, 'upsert')
    },
    [commit, queue],
  )

  const saveSoon = useCallback(
    (r: Recipe) => {
      const list = recipesRef.current
      commit(list.map((x) => (x.id === r.id ? r : x)))
      clearTimeout(timers.current[r.id])
      timers.current[r.id] = setTimeout(() => save(recipesRef.current.find((x) => x.id === r.id) ?? r), 800)
    },
    [commit, save],
  )

  const remove = useCallback(
    (id: string) => {
      clearTimeout(timers.current[id])
      commit(recipesRef.current.filter((x) => x.id !== id))
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
    writeJson(PENDING_KEY, {})
  }, [commit])

  const sorted = useMemo(() => [...recipes].sort((a, b) => a.name.localeCompare(b.name)), [recipes])

  const value: Store = {
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
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside provider')
  return s
}
