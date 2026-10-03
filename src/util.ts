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
