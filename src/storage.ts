const CHECKED_PREFIX = 'bakey.checked.'
const AMOUNT_PREFIX = 'bakey.amount.'

/** Every localStorage key the app uses. All are per device. */
export const keys = {
  /** Cache of all recipes; the UI reads from it. */
  recipes: 'bakey.recipes.v1',
  /** Writes not yet sent to Supabase. */
  pending: 'bakey.pending.v1',
  /** Ticked ingredients on a recipe's checklist. */
  checked: (recipeId: string) => `${CHECKED_PREFIX}${recipeId}`,
  /** Last anchor amount used on a recipe that scales by amount. */
  amount: (recipeId: string) => `${AMOUNT_PREFIX}${recipeId}`,
  /** Last email used to sign in. Stored as a plain string, not JSON. */
  email: 'bakey.email',
  /** Temporary auth debug log (see authLog.ts). */
  authLog: 'bakey.authlog',
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    return s ? (JSON.parse(s) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode / quota) – keep working in memory
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // storage unavailable – nothing to remove
  }
}

/** Removes the per-recipe state (checklist ticks, last amounts) of every recipe. */
export function clearRecipeState() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CHECKED_PREFIX) || k.startsWith(AMOUNT_PREFIX))
      .forEach(removeKey)
  } catch {
    // storage unavailable – nothing to remove
  }
}
