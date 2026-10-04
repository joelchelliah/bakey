import { allIngredients, isAnchor, usesAmounts } from '../../calc'
import type { Ingredient, Recipe, Variant } from '../../types'
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

/** The anchor ingredients (by name, in every variant) that have a fixed amount. */
const fixedAnchors = (r: Recipe) =>
  r.variants
    .flatMap((v) => allIngredients(v).map((x) => x.ing))
    .filter((i) => isAnchor(r, i) && i.amount.kind === 'fixed')

const fixedValue = (i: Ingredient) => (i.amount.kind === 'fixed' ? i.amount.value : undefined)

/**
 * When scaling by amount, keeps the default amount and the anchor's amount in every variant equal, after an edit from
 * `prev` to `next`: a new default sets the anchors; a new anchor (picked, or switched to scaling by amount) or an edited
 * anchor amount sets the default and the other anchors.
 */
export function syncAnchor(prev: Recipe, next: Recipe): Recipe {
  if (!usesAmounts(next)) return next
  const anchors = fixedAnchors(next)
  const before = new Map(fixedAnchors(prev).map((i) => [i.id, fixedValue(i)]))
  const picked = !usesAmounts(prev) || next.anchorName !== prev.anchorName
  const edited = picked ? anchors[0] : anchors.find((i) => before.get(i.id) !== fixedValue(i))
  const value = next.defaultAmount !== prev.defaultAmount ? next.defaultAmount : edited && fixedValue(edited)
  if (value === undefined) return next
  return {
    ...next,
    defaultAmount: value,
    variants: next.variants.map((v) => ({
      ...v,
      sections: v.sections.map((s) => ({
        ...s,
        ingredients: s.ingredients.map((i) =>
          isAnchor(next, i) && i.amount.kind === 'fixed' ? { ...i, amount: { ...i.amount, value } } : i,
        ),
      })),
    })),
  }
}
