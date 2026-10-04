import { describe, expect, it } from 'vitest'
import {
  anchorMismatches,
  computeVariant,
  fmtAmount,
  fmtPct,
  fmtWeight,
  parseNum,
  showsPortions,
  type VariantResult,
} from './calc'
import { newRecipe } from './model'
import { starterRecipes } from './seed'
import type { Ingredient, Recipe, Variant } from './types'

function starter(name: string): Recipe {
  const r = starterRecipes().find((x) => x.name.startsWith(name))
  if (!r) throw new Error(`No starter recipe "${name}"`)
  return r
}

function compute(r: Recipe, variantName: string) {
  const v = r.variants.find((x) => x.name === variantName)
  if (!v) throw new Error(`No variant "${variantName}" in "${r.name}"`)
  return computeVariant(r, v)
}

const weight = (res: VariantResult, ingredient: string) =>
  res.rows.find((x) => x.ingredient.name === ingredient)?.weight
const section = (res: VariantResult, name: string) => res.sections.find((x) => x.name === name)?.weight

// Expected values come from the original Numbers sheets (see "Original sheets" in CLAUDE.md), which show 2 dp.
describe('reference values from the original sheets', () => {
  it('Pizza – Regular (6 × 210 g, 72% hydration)', () => {
    const res = compute(starter('Pizza'), 'Regular')
    expect(res.totalPct).toBeCloseTo(175.3, 2)
    expect(weight(res, 'Whole wheat flour')).toBeCloseTo(71.87, 1)
    expect(weight(res, 'Water')).toBeCloseTo(503.14, 1)
    expect(res.errors).toEqual([])
  })

  it('Pizza – Poolish (6 × 210 g)', () => {
    const res = compute(starter('Pizza'), 'Poolish')
    expect(res.totalPct).toBeCloseTo(175.15, 2)
    expect(weight(res, 'Poolish flour')).toBeCloseTo(215.82, 1)
    expect(weight(res, 'Poolish water')).toBeCloseTo(215.82, 1)
    expect(weight(res, 'Remaining water')).toBeCloseTo(287.75, 1)
    expect(section(res, 'Poolish')).toBeCloseTo(431.63, 1)
    expect(res.errors).toEqual([])
  })

  it('Seeded (2200 g)', () => {
    const res = compute(starter('Seeded'), 'Standard')
    expect(res.base).toBeCloseTo(1132.56, 1)
    expect(weight(res, 'Spelt')).toBeCloseTo(158.56, 1)
  })

  it('Pan de Coco – regular (1400 g)', () => {
    const res = compute(starter('Pan de Coco'), 'Regular')
    expect(res.totalPct).toBeCloseTo(204.5, 2)
    expect(weight(res, 'Coconut milk')).toBeCloseTo(547.68, 1)
  })

  it('Pan de Coco – tangzhong', () => {
    const res = compute(starter('Pan de Coco'), 'Tangzhong')
    expect(res.totalPct).toBeCloseTo(212.5, 2)
    expect(weight(res, 'Flour')).toBeCloseTo(625.88, 1)
    expect(weight(res, 'Coconut milk')).toBeCloseTo(428.24, 1)
    expect(weight(res, 'Roux liquid')).toBeCloseTo(164.71, 1)
  })

  it('Waffles (332 g eggs), including baking powder in the total', () => {
    const res = compute(starter('Belgian Waffles'), 'Standard')
    expect(weight(res, 'Milk')).toBeCloseTo(398.4, 2)
    expect(weight(res, 'Baking powder')).toBeCloseTo(41.5, 2)
    expect(res.totalWeight).toBeCloseTo(1319.7, 2)
  })

  it('Crêpe (175 g eggs, −15%, 3 portions, 165 g set-aside)', () => {
    const res = compute(starter('Crêpe'), 'Standard')
    expect(weight(res, 'Milk / Stock')).toBeCloseTo(133.875, 3)
    expect(weight(res, 'Flour')).toBeCloseTo(89.25, 2)
    expect(res.totalWeight).toBeCloseTo(398.125, 3)
    expect(res.portionSize).toBeCloseTo(132.71, 2)
    expect(res.remainingPortionSize).toBeCloseTo(77.71, 2)
  })
})

/** A total-weight recipe of 1000 g with one variant made of the given ingredients. */
function recipeWith(ingredients: Omit<Ingredient, 'id'>[], patch: Partial<Recipe> = {}, anchorAmount?: number) {
  const r = newRecipe({ totalWeight: 1000, ...patch })
  const v = r.variants[0]
  const s = v?.sections[0]
  if (!v || !s) throw new Error('newRecipe() has no variant')
  s.ingredients = ingredients.map((i) => ({ ...i, id: i.name }))
  return computeVariant(r, v, anchorAmount)
}

describe('calculation rules', () => {
  it('a flour remainder fills the flour group up to 100%', () => {
    const res = recipeWith([
      { name: 'Rye', group: 'flour', amount: { kind: 'percent', value: 30 } },
      { name: 'Wheat', group: 'flour', amount: { kind: 'remainder' } },
    ])
    expect(res.rows.map((x) => x.pct)).toEqual([30, 70])
  })

  it('a liquid remainder needs a hydration target', () => {
    const res = recipeWith([
      { name: 'Flour', group: 'flour', amount: { kind: 'percent', value: 100 } },
      { name: 'Water', group: 'liquid', amount: { kind: 'remainder' } },
    ])
    expect(res.errors).toEqual(['"Water" needs a hydration target'])
  })

  it('reports a negative remainder, a second remainder and circular references', () => {
    expect(
      recipeWith([
        { name: 'A', group: 'flour', amount: { kind: 'percent', value: 120 } },
        { name: 'B', group: 'flour', amount: { kind: 'remainder' } },
      ]).errors[0],
    ).toMatch(/"B" is negative/)
    expect(
      recipeWith([
        { name: 'A', group: 'flour', amount: { kind: 'remainder' } },
        { name: 'B', group: 'flour', amount: { kind: 'remainder' } },
      ]).errors,
    ).toContain('Only one remainder allowed in the flour group')
    expect(
      recipeWith([
        { name: 'A', group: 'other', amount: { kind: 'relative', of: 'B', factor: 50 } },
        { name: 'B', group: 'other', amount: { kind: 'relative', of: 'A', factor: 50 } },
      ]).errors.some((e) => e.startsWith('Circular reference')),
    ).toBe(true)
  })

  it('the modifier only scales modified ingredients, before the base is computed', () => {
    const res = recipeWith(
      [
        { name: 'Flour', group: 'flour', amount: { kind: 'percent', value: 100 } },
        { name: 'Sugar', group: 'other', amount: { kind: 'percent', value: 100 }, modified: true },
      ],
      { modifierEnabled: true, modifier: -50 },
    )
    expect(res.rows.map((x) => x.effectivePct)).toEqual([100, 50])
    expect(res.totalWeight).toBeCloseTo(1000, 6)
    expect(weight(res, 'Flour')).toBeCloseTo(666.67, 2)
  })

  it('to-taste ingredients have no amount and do not count towards totals', () => {
    const res = recipeWith([
      { name: 'Flour', group: 'flour', amount: { kind: 'percent', value: 100 } },
      { name: 'Pepper', group: 'other', amount: { kind: 'toTaste' } },
    ])
    expect(weight(res, 'Pepper')).toBeNull()
    expect(res.totalPct).toBe(100)
  })
})

const bananaVariant = (name: string, bananas: number): Variant => ({
  id: name,
  name,
  sections: [
    {
      id: 's',
      name: '',
      ingredients: [
        { id: 'b', name: 'bananas', group: 'other', amount: { kind: 'fixed', value: bananas, unit: 'pcs' } },
      ],
    },
  ],
})

describe('scaling by amount', () => {
  const amounts = { mode: 'anchor', anchorBy: 'amount', anchorName: 'Bananas', defaultAmount: 3 } as const
  const bread: Omit<Ingredient, 'id'>[] = [
    { name: 'Bananas', group: 'other', amount: { kind: 'fixed', value: 3, unit: 'pcs' } },
    { name: 'Flour', group: 'other', amount: { kind: 'fixed', value: 240, unit: 'g' } },
    { name: 'Cinnamon', group: 'other', amount: { kind: 'fixed', value: 1.5, unit: 'tsp' }, modified: true },
    { name: 'Salt', group: 'other', amount: { kind: 'toTaste' } },
  ]

  it('opens as written, at the default amount', () => {
    const res = recipeWith(bread, amounts)
    expect(res.errors).toEqual([])
    expect(weight(res, 'Bananas')).toBeCloseTo(3, 6)
    expect(weight(res, 'Flour')).toBeCloseTo(240, 6)
  })

  it('multiplies every amount by the anchor amount over the default amount', () => {
    const res = recipeWith(bread, amounts, 4)
    expect(res.errors).toEqual([])
    expect(weight(res, 'Bananas')).toBeCloseTo(4, 6)
    expect(weight(res, 'Flour')).toBeCloseTo(320, 6)
    expect(weight(res, 'Cinnamon')).toBeCloseTo(2, 6)
    expect(weight(res, 'Salt')).toBeNull()
    expect(res.rows.every((r) => r.pct === null)).toBe(true)
  })

  it('bakes with the given anchor amount instead of the default', () => {
    const res = recipeWith(bread, amounts, 6)
    expect(weight(res, 'Bananas')).toBeCloseTo(6, 6)
    expect(weight(res, 'Flour')).toBeCloseTo(480, 6)
  })

  it('applies the modifier to modified amounts only', () => {
    const res = recipeWith(bread, { ...amounts, modifierEnabled: true, modifier: 50 }, 4)
    expect(weight(res, 'Flour')).toBeCloseTo(320, 6)
    expect(weight(res, 'Cinnamon')).toBeCloseTo(3, 6)
  })

  it('a modified anchor still comes out at the entered amount', () => {
    const [bananas, ...rest] = bread
    if (!bananas) throw new Error('No bananas')
    const ings = [{ ...bananas, modified: true }, ...rest]
    const res = recipeWith(ings, { ...amounts, modifierEnabled: true, modifier: 50 }, 4)
    expect(weight(res, 'Bananas')).toBeCloseTo(4, 6)
    expect(weight(res, 'Flour')).toBeCloseTo(213.33, 2)
  })

  it('warns about ingredients that do not fit the mode, both ways', () => {
    const percent: Omit<Ingredient, 'id'> = { name: 'Water', group: 'liquid', amount: { kind: 'percent', value: 70 } }
    expect(recipeWith([...bread, percent], amounts).errors).toEqual(['"Water" needs an amount'])
    expect(recipeWith([percent, ...bread], { mode: 'anchor', anchorName: 'Water' }).errors).toContain(
      '"Flour" needs a percentage',
    )
  })

  it('finds variants whose anchor does not match the default amount', () => {
    const r = newRecipe({ ...amounts, variants: [bananaVariant('A', 3), bananaVariant('B', 4)] })
    expect(anchorMismatches(r)).toEqual(['"bananas" in B should be 3, the default amount'])
    expect(anchorMismatches(r, [bananaVariant('A', 3)])).toEqual([])
    expect(anchorMismatches({ ...r, anchorBy: 'weight' })).toEqual([])
  })

  it('warns when the default amount is not above 0', () => {
    const res = recipeWith(bread.slice(1), { ...amounts, anchorName: 'Flour', defaultAmount: 0 }, 4)
    expect(res.errors).toContain('The default amount needs to be above 0')
    expect(weight(res, 'Flour')).toBeNaN()
  })

  it('never shows portions', () => {
    expect(showsPortions(newRecipe({ ...amounts, showPortions: true }))).toBe(false)
    expect(showsPortions(newRecipe({ mode: 'anchor', showPortions: true }))).toBe(true)
  })
})

describe('formatting and parsing', () => {
  it('formats amounts: grams like weights, other units with up to 2 decimals', () => {
    expect(fmtAmount(123.4, 'g')).toBe('123')
    expect(fmtAmount(2.666, 'pcs')).toBe('2.67')
    expect(fmtAmount(0.25, 'tsp')).toBe('0.25')
    expect(fmtAmount(3, 'tbs')).toBe('3')
    expect(fmtAmount(null, 'tsp')).toBe('—')
  })

  it('rounds weights to 2 dp below 1 g, 1 dp below 50 g and whole grams above', () => {
    expect(fmtWeight(0.456)).toBe('0.46')
    expect(fmtWeight(12.34)).toBe('12.3')
    expect(fmtWeight(12.04)).toBe('12')
    expect(fmtWeight(503.14)).toBe('503')
    expect(fmtWeight(null)).toBe('—')
    expect(fmtWeight(NaN)).toBe('–')
  })

  it('formats percentages with up to 2 dp', () => {
    expect(fmtPct(72)).toBe('72%')
    expect(fmtPct(0.255)).toBe('0.26%')
  })

  it('accepts a comma or a dot as the decimal separator', () => {
    expect(parseNum('0,5')).toBe(0.5)
    expect(parseNum('1.25 g')).toBe(1.25)
    expect(parseNum('-15')).toBe(-15)
    expect(parseNum('')).toBe(0)
  })
})
