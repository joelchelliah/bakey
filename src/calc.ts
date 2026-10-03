import type { Ingredient, Recipe, Variant } from './types'

export interface IngredientResult {
  ingredient: Ingredient
  sectionId: string
  pct: number | null // base percentage (before modifier); null = to taste
  effectivePct: number | null // after modifier
  weight: number | null
  error?: string
}

export interface SectionResult {
  id: string
  name: string
  weight: number
}

export interface VariantResult {
  rows: IngredientResult[]
  sections: SectionResult[]
  totalPct: number
  totalWeight: number
  base: number
  portionSize?: number
  remainingPortionSize?: number // after set-aside portions
  errors: string[]
}

export function allIngredients(v: Variant): { ing: Ingredient; sectionId: string }[] {
  return v.sections.flatMap((s) => s.ingredients.map((ing) => ({ ing, sectionId: s.id })))
}

export function findAnchor(recipe: Recipe, v: Variant): Ingredient | undefined {
  const name = recipe.anchorName?.trim().toLowerCase()
  const list = allIngredients(v).map((x) => x.ing)
  return list.find((i) => i.name.trim().toLowerCase() === name) ?? list.find((i) => i.amount.kind !== 'toTaste')
}

/** The variant with `id`, falling back to the first one. */
export function variantOf(recipe: Recipe, id = recipe.activeVariant): Variant {
  return recipe.variants.find((v) => v.id === id) ?? recipe.variants[0]
}

/** Whether portion inputs and outputs apply: always in portions mode, otherwise when switched on. */
export function showsPortions(recipe: Recipe): boolean {
  return recipe.mode === 'portions' || recipe.showPortions
}

const sum = (ns: (number | null)[]) => ns.reduce<number>((s, n) => s + (n ?? 0), 0)

export type OverridableInput = 'portions' | 'portionSize' | 'modifier'

/** The recipe's portions, portion size and modifier, with the variant's overrides applied. */
export function inputsOf(recipe: Recipe, v: Variant): Record<OverridableInput, number> {
  return {
    portions: v.portions ?? recipe.portions,
    portionSize: v.portionSize ?? recipe.portionSize,
    modifier: v.modifier ?? recipe.modifier,
  }
}

export function computeVariant(recipe: Recipe, v: Variant): VariantResult {
  const inputs = inputsOf(recipe, v)
  const items = allIngredients(v)
  const byId = new Map(items.map((x) => [x.ing.id, x.ing]))
  const errors: string[] = []
  const pctCache = new Map<string, number | null>()
  const visiting = new Set<string>()

  const target = (ing: Ingredient) =>
    ing.group === 'flour' ? 100 : ing.group === 'liquid' ? (v.hydration ?? NaN) : NaN

  const pctOf = (ing: Ingredient): number | null => {
    const cached = pctCache.get(ing.id)
    if (cached !== undefined) return cached
    if (visiting.has(ing.id)) {
      errors.push(`Circular reference involving "${ing.name}"`)
      return NaN
    }
    visiting.add(ing.id)
    let p: number | null
    const a = ing.amount
    switch (a.kind) {
      case 'percent':
        p = a.value
        break
      case 'toTaste':
        p = null
        break
      case 'relative': {
        const ref = byId.get(a.of)
        const rp = ref ? pctOf(ref) : NaN
        if (!ref) errors.push(`"${ing.name}" refers to a missing ingredient`)
        p = (rp ?? 0) * (a.factor / 100)
        break
      }
      case 'remainder': {
        const t = target(ing)
        if (Number.isNaN(t)) {
          errors.push(
            ing.group === 'other'
              ? `"${ing.name}" is a remainder but is not in the flour or liquid group`
              : `"${ing.name}" needs a hydration target`,
          )
          p = NaN
          break
        }
        let filled = 0
        for (const { ing: o } of items) {
          if (o.id === ing.id || o.group !== ing.group) continue
          if (o.amount.kind === 'remainder') {
            errors.push(`Only one remainder allowed in the ${ing.group} group`)
            continue
          }
          filled += pctOf(o) ?? 0
        }
        p = t - filled
        if (p < 0)
          errors.push(`"${ing.name}" is negative (${round(p, 2)}%) — the ${ing.group} group exceeds its target`)
        break
      }
    }
    visiting.delete(ing.id)
    pctCache.set(ing.id, p)
    return p
  }

  const mod = recipe.modifierEnabled ? 1 + inputs.modifier / 100 : 1
  const pcts = items.map(({ ing, sectionId }) => {
    const pct = pctOf(ing)
    const effectivePct = pct === null ? null : ing.modified ? pct * mod : pct
    return { ing, sectionId, pct, effectivePct }
  })

  const totalPct = sum(pcts.map((x) => x.effectivePct))

  let base: number
  if (recipe.mode === 'anchor') {
    const anchor = findAnchor(recipe, v)
    const ap = anchor ? pcts.find((x) => x.ing.id === anchor.id)?.effectivePct : null
    base = ap ? (recipe.anchorWeight / ap) * 100 : NaN
    if (!anchor) errors.push('No anchor ingredient')
  } else {
    const total = recipe.mode === 'portions' ? inputs.portions * inputs.portionSize : recipe.totalWeight
    base = totalPct > 0 ? (total / totalPct) * 100 : NaN
  }

  const rows: IngredientResult[] = pcts.map((x) => ({
    ingredient: x.ing,
    sectionId: x.sectionId,
    pct: x.pct,
    effectivePct: x.effectivePct,
    weight: x.effectivePct === null ? null : (x.effectivePct / 100) * base,
  }))

  const totalWeight = sum(rows.map((r) => r.weight))
  const sections = v.sections.map((s) => ({
    id: s.id,
    name: s.name,
    weight: sum(rows.filter((r) => r.sectionId === s.id).map((r) => r.weight)),
  }))

  const result: VariantResult = {
    rows,
    sections,
    totalPct,
    totalWeight,
    base,
    errors: [...new Set(errors)],
  }
  if (showsPortions(recipe) && inputs.portions > 0) {
    result.portionSize = totalWeight / inputs.portions
    if (recipe.setAsides.length) {
      const reserved = sum(recipe.setAsides.map((a) => a.weight || 0))
      result.remainingPortionSize = (totalWeight - reserved) / inputs.portions
    }
  }
  return result
}

export function round(n: number, dp: number) {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

/** Grams: one decimal below 50 g (two below 1 g), whole grams above. */
export function fmtWeight(g: number | null): string {
  if (g === null) return '—'
  if (!Number.isFinite(g)) return '–'
  const a = Math.abs(g)
  const dp = a < 1 ? 2 : a < 50 ? 1 : 0
  return round(g, dp).toFixed(dp).replace(/\.0+$/, '')
}

export function fmtPct(p: number | null): string {
  if (p === null) return '—'
  if (!Number.isFinite(p)) return '–'
  return `${round(p, 2)}%`
}

/** Parses user input, accepting both comma and dot as decimal separator. */
export function parseNum(s: string): number {
  const n = parseFloat(s.replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}
