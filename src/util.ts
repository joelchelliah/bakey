export function uid(): string {
  return crypto.randomUUID()
}

export function clone<T>(x: T): T {
  return structuredClone(x)
}

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}

/** A copy of `list` where the item with `id` is merged with `change`, or replaced by `change(item)`. */
export function updateById<T extends { id: string }>(list: T[], id: string, change: Partial<T> | ((x: T) => T)): T[] {
  return list.map((x) => (x.id !== id ? x : typeof change === 'function' ? change(x) : { ...x, ...change }))
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
