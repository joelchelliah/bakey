import type { Variant } from '../../types'
import { clone, uid } from '../../util'

export type Dir = -1 | 1

/** Copies a variant with fresh ids, keeping relative references intact. */
export function copyVariant(v: Variant): Variant {
  const map = new Map<string, string>()
  const c = clone(v)

  c.id = uid()
  c.name = `${v.name} copy`

  for (const s of c.sections) {
    s.id = uid()

    for (const i of s.ingredients) {
      const id = uid()

      map.set(i.id, id)
      i.id = id
    }
  }
  for (const s of c.sections)
    for (const i of s.ingredients)
      if (i.amount.kind === 'relative') i.amount = { ...i.amount, of: map.get(i.amount.of) ?? i.amount.of }
  return c
}

/** Moves an ingredient within its section, or across into the neighbouring section at the edges. */
export function moveIngredient(v: Variant, sid: string, iid: string, dir: Dir): Variant {
  const sections = clone(v.sections)
  const si = sections.findIndex((s) => s.id === sid)
  const list = sections[si].ingredients
  const ii = list.findIndex((i) => i.id === iid)
  const [ing] = list.splice(ii, 1)
  const to = ii + dir

  if (to < 0 && si > 0) sections[si - 1].ingredients.push(ing)
  else if (to > list.length && si < sections.length - 1) sections[si + 1].ingredients.unshift(ing)
  else list.splice(Math.max(0, Math.min(list.length, to)), 0, ing)

  return { ...v, sections }
}

/** Swaps a section with its neighbour. */
export function moveSection(v: Variant, sid: string, dir: Dir): Variant {
  const sections = [...v.sections]
  const si = sections.findIndex((s) => s.id === sid)
  const to = si + dir

  if (si < 0 || to < 0 || to >= sections.length) return v
  ;[sections[si], sections[to]] = [sections[to], sections[si]]
  return { ...v, sections }
}
