import { describe, expect, it } from 'vitest'
import type { Ingredient, Variant } from '../../types'
import { placeIngredient } from './recipe'

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
