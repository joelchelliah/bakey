import { describe, expect, it } from 'vitest'
import { newRecipe } from '../../model'
import type { Ingredient, Recipe, Variant } from '../../types'
import { placeIngredient, syncAnchor } from './recipe'

const ing = (id: string): Ingredient => ({ id, name: id, group: 'other', amount: { kind: 'percent', value: 1 } })
const variant: Variant = {
  id: 'v',
  name: 'V',
  sections: [
    { id: 's1', name: '', ingredients: [ing('a'), ing('b')] },
    { id: 's2', name: '', ingredients: [ing('c')] },
    { id: 's3', name: '', ingredients: [] },
  ],
}
const layout = (v: Variant) => v.sections.map((s) => s.ingredients.map((i) => i.id).join('')).join('|')

describe('placeIngredient', () => {
  it('reorders within a section', () => {
    expect(layout(placeIngredient(variant, 'a', 's1', 1))).toBe('ba|c|')
  })

  it('moves into another section, including an empty one', () => {
    expect(layout(placeIngredient(variant, 'b', 's2', 0))).toBe('a|bc|')
    expect(layout(placeIngredient(variant, 'c', 's1', 2))).toBe('abc||')
    expect(layout(placeIngredient(variant, 'a', 's3', 0))).toBe('b|c|a')
    expect(layout(variant)).toBe('ab|c|')
  })

  it('ignores an unknown ingredient or section', () => {
    expect(placeIngredient(variant, 'x', 's1', 0)).toBe(variant)
    expect(placeIngredient(variant, 'a', 'sx', 0)).toBe(variant)
  })
})

const fixed = (id: string, name: string, value: number): Ingredient => ({
  id,
  name,
  group: 'other',
  amount: { kind: 'fixed', value, unit: 'pcs' },
})
const fixedValue = (i: Ingredient) => (i.amount.kind === 'fixed' ? i.amount.value : undefined)

const bananaVariant = (id: string, bananas: number): Variant => ({
  id,
  name: id,
  sections: [{ id: 's', name: '', ingredients: [fixed(`${id}b`, 'Bananas', bananas), fixed(`${id}f`, 'Flour', 200)] }],
})
const values = (r: Recipe) =>
  r.variants.flatMap((x) => x.sections.flatMap((s) => s.ingredients.map((i) => fixedValue(i))))
const setAnchor = (r: Recipe, variantId: string, value: number): Recipe => ({
  ...r,
  variants: r.variants.map((x) => (x.id === variantId ? { ...x, ...bananaVariant(variantId, value) } : x)),
})

describe('syncAnchor', () => {
  const base = newRecipe({
    mode: 'anchor',
    anchorBy: 'amount',
    anchorName: 'Bananas',
    defaultAmount: 4,
    variants: [bananaVariant('A', 4), bananaVariant('B', 4)],
  })

  it('a new default sets the anchor in every variant', () => {
    const r = syncAnchor(base, { ...base, defaultAmount: 2 })
    expect(values(r)).toEqual([2, 200, 2, 200])
  })

  it('an edited anchor amount sets the default and the other variants', () => {
    const r = syncAnchor(base, setAnchor(base, 'B', 3))
    expect(r.defaultAmount).toBe(3)
    expect(values(r)).toEqual([3, 200, 3, 200])
  })

  it('picking an anchor or switching to scaling by amount takes the anchor amount', () => {
    const flour = syncAnchor(base, { ...base, anchorName: 'flour' })
    expect(flour.defaultAmount).toBe(200)
    const weight = { ...base, anchorBy: 'weight' as const, defaultAmount: 1 }
    expect(syncAnchor(weight, { ...weight, anchorBy: 'amount' }).defaultAmount).toBe(4)
  })

  it('leaves other edits and other modes alone', () => {
    const renamed = { ...base, name: 'Banana bread' }
    expect(syncAnchor(base, renamed)).toBe(renamed)
    const weight = { ...base, anchorBy: 'weight' as const }
    const edited = { ...weight, defaultAmount: 2 }
    expect(syncAnchor(weight, edited)).toBe(edited)
  })
})
