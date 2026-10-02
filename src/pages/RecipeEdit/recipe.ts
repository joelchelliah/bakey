import type { Recipe, Variant } from '../../types'
import { clone, uid } from '../../util'

export function newRecipe(): Recipe {
  return {
    id: uid(),
    name: '',
    emoji: '🍞',
    category: 'bread',
    notes: '',
    mode: 'total',
    totalWeight: 1000,
    portions: 1,
    portionSize: 250,
    anchorWeight: 100,
    showPortions: false,
    setAsides: [],
    modifierEnabled: false,
    modifier: 0,
    updatedAt: new Date().toISOString(),
    variants: [
      {
        id: uid(),
        name: 'Standard',
        sections: [
          {
            id: uid(),
            name: '',
            ingredients: [
              {
                id: uid(),
                name: 'Flour',
                group: 'flour',
                amount: { kind: 'percent', value: 100 },
              },
              {
                id: uid(),
                name: 'Water',
                group: 'liquid',
                amount: { kind: 'percent', value: 70 },
              },
              {
                id: uid(),
                name: 'Salt',
                group: 'other',
                amount: { kind: 'percent', value: 2 },
              },
              {
                id: uid(),
                name: 'Yeast',
                group: 'other',
                amount: { kind: 'percent', value: 1 },
              },
            ],
          },
        ],
      },
    ],
  }
}

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
export function moveIngredient(v: Variant, sid: string, iid: string, dir: -1 | 1): Variant {
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
export function moveSection(v: Variant, sid: string, dir: -1 | 1): Variant {
  const sections = [...v.sections]
  const si = sections.findIndex((s) => s.id === sid)
  const to = si + dir

  if (si < 0 || to < 0 || to >= sections.length) return v
  ;[sections[si], sections[to]] = [sections[to], sections[si]]
  return { ...v, sections }
}
