import { describe, expect, it } from 'vitest'
import { computeVariant } from './calc'
import { starterRecipes } from './seed'

const recipes = starterRecipes()
const get = (name: string, variant = 0) => {
  const r = recipes.find((x) => x.name.startsWith(name))!
  return computeVariant(r, r.variants[variant])
}
const w = (res: ReturnType<typeof get>, name: string) => res.rows.find((r) => r.ingredient.name === name)!.weight!

// Expected values come from the original Numbers sheets.
describe('starter recipes match the Numbers sheets', () => {
  it('pizza', () => {
    const r = get('Pizza')
    expect(r.errors).toEqual([])
    expect(r.totalPct).toBeCloseTo(175.3)
    expect(r.totalWeight).toBeCloseTo(1200)
    expect(w(r, 'Whole wheat flour')).toBeCloseTo(68.45, 1)
    expect(w(r, 'Water')).toBeCloseTo(479.18, 1)
  })
  it('pizza poolish', () => {
    const r = get('Pizza – Poolish')
    expect(r.errors).toEqual([])
    expect(r.totalPct).toBeCloseTo(175.15)
    expect(r.totalWeight).toBeCloseTo(1260)
    expect(w(r, 'Poolish flour')).toBeCloseTo(215.82, 1)
    expect(w(r, 'Poolish water')).toBeCloseTo(215.82, 1)
    expect(w(r, 'Remaining water')).toBeCloseTo(287.75, 1)
    expect(r.sections[0].weight).toBeCloseTo(431.63, 1)
  })
  it('seeded', () => {
    const r = get('Seeded')
    expect(r.base).toBeCloseTo(1132.56, 1)
    expect(w(r, 'Spelt')).toBeCloseTo(158.56, 1)
  })
  it('pan de coco regular + tangzhong', () => {
    const reg = get('Pan de Coco', 0)
    expect(reg.totalPct).toBeCloseTo(204.5)
    expect(w(reg, 'Coconut milk')).toBeCloseTo(547.68, 1)
    const tz = get('Pan de Coco', 1)
    expect(tz.errors).toEqual([])
    expect(tz.totalPct).toBeCloseTo(212.5)
    expect(w(tz, 'Flour')).toBeCloseTo(625.88, 1)
    expect(w(tz, 'Coconut milk')).toBeCloseTo(428.24, 1)
    expect(w(tz, 'Roux liquid')).toBeCloseTo(164.71, 1)
  })
  it('waffles (anchor on eggs, baking powder = eggs / 8)', () => {
    const r = get('Belgian')
    expect(w(r, 'Milk')).toBeCloseTo(398.4)
    expect(w(r, 'Baking powder')).toBeCloseTo(41.5)
    // The sheet's total left baking powder out (1278.2); here every ingredient counts.
    expect(r.totalWeight).toBeCloseTo(1319.7)
    expect(r.portionSize).toBeCloseTo(1319.7 / 15)
  })
  it('crêpe (modifier + set-aside portion)', () => {
    const r = get('Crêpe')
    expect(w(r, 'Eggs')).toBeCloseTo(175)
    expect(w(r, 'Milk / Stock')).toBeCloseTo(133.875)
    expect(w(r, 'Flour')).toBeCloseTo(89.25)
    expect(r.totalWeight).toBeCloseTo(398.125)
    expect(r.portionSize).toBeCloseTo(132.71, 1)
    expect(r.remainingPortionSize).toBeCloseTo(77.71, 1)
  })
})
