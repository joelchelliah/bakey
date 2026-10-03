import { createContext, useContext } from 'react'
import type { Recipe } from './types'

/** localStorage key of the recipe cache. */
export const RECIPES_KEY = 'bakey.recipes.v1'

export type SyncState = 'local' | 'synced' | 'syncing' | 'pending'
export type AuthState = 'loading' | 'signedOut' | 'signedIn'

export interface Store {
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

export const StoreContext = createContext<Store | null>(null)

export function useStore() {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useStore outside provider')
  return s
}
