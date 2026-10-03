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

/** A copy of `list` where the item with `id` has swapped places with its neighbour in direction `dir`. */
export function swapById<T extends { id: string }>(list: T[], id: string, dir: -1 | 1): T[] {
  const out = [...list]
  const i = out.findIndex((x) => x.id === id)
  const a = out[i]
  const b = out[i + dir]

  if (i < 0 || !a || !b) return list
  out[i] = b
  out[i + dir] = a
  return out
}

/** A copy of `list` with the item with `id` moved to `index`, counted among the other items. */
export function placeById<T extends { id: string }>(list: T[], id: string, index: number): T[] {
  const item = list.find((x) => x.id === id)
  if (!item) return list

  const out = list.filter((x) => x !== item)
  out.splice(index, 0, item)
  return out
}
