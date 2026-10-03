import type { Variant } from '../../types'
import { clone, swapById, uid } from '../../util'

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

/** Moves an ingredient to `index` in section `sid` (counted without it), which may be another section. */
export function placeIngredient(v: Variant, iid: string, sid: string, index: number): Variant {
  const ing = v.sections.flatMap((s) => s.ingredients).find((i) => i.id === iid)
  if (!ing || !v.sections.some((s) => s.id === sid)) return v

  const sections = v.sections.map((s) => {
    const ingredients = s.ingredients.filter((i) => i !== ing)
    if (s.id === sid) ingredients.splice(index, 0, ing)
    return { ...s, ingredients }
  })
  return { ...v, sections }
}

/** Swaps a section with its neighbour. */
export function moveSection(v: Variant, sid: string, dir: Dir): Variant {
  return { ...v, sections: swapById(v.sections, sid, dir) }
}
