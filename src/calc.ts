import type { Ingredient, Recipe, Unit, Variant } from './types'

export interface IngredientResult {
  ingredient: Ingredient
  sectionId: string
  pct: number | null // base percentage (before modifier); null = to taste, or scaling by amount
  effectivePct: number | null // after modifier
  weight: number | null // grams; in the ingredient's own unit when scaling by amount
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
  base: number // grams per 100%; the scale factor when scaling by amount
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

/** Whether the recipe is written in fixed amounts (scaled by one ingredient's amount) instead of percentages. */
export function usesAmounts(recipe: Recipe): boolean {
  return recipe.mode === 'anchor' && recipe.anchorBy === 'amount'
}

/** The unit an ingredient is measured in: its own for a fixed amount, otherwise grams. */
export function unitOf(ing: Ingredient): Unit {
  return ing.amount.kind === 'fixed' ? ing.amount.unit : 'g'
}

/** The variant with `id`, falling back to the first one. */
export function variantOf(recipe: Recipe, id = recipe.activeVariant): Variant {
  const v = recipe.variants.find((x) => x.id === id) ?? recipe.variants[0]
  // normalizeRecipe() guarantees at least one variant
  if (!v) throw new Error(`"${recipe.name}" has no variants`)
  return v
}

/** Whether portion inputs and outputs apply: always in portions mode, otherwise when switched on (never with amounts). */
export function showsPortions(recipe: Recipe): boolean {
  return recipe.mode === 'portions' || (recipe.showPortions && !usesAmounts(recipe))
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
  if (usesAmounts(recipe)) return computeAmounts(recipe, v)
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
      case 'fixed':
        errors.push(`"${ing.name}" needs a percentage`)
        p = NaN
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

/**
 * Scaling by amount: every amount is multiplied by the anchor amount over the anchor's written amount. There are no
 * percentages, totals or portions, since the units can differ.
 */
function computeAmounts(recipe: Recipe, v: Variant): VariantResult {
  const items = allIngredients(v)
  const errors: string[] = []
  const mod = recipe.modifierEnabled ? 1 + inputsOf(recipe, v).modifier / 100 : 1
  const amounts = items.map(({ ing }) => {
    const a = ing.amount
    if (a.kind === 'toTaste') return null
    if (a.kind !== 'fixed') {
      errors.push(`"${ing.name}" needs an amount`)
      return NaN
    }
    return ing.modified ? a.value * mod : a.value
  })

  const anchor = findAnchor(recipe, v)
  const written = anchor ? amounts[items.findIndex((x) => x.ing.id === anchor.id)] : undefined
  if (!anchor) errors.push('No anchor ingredient')
  else if (anchor.amount.kind === 'fixed' && !written) errors.push(`"${anchor.name}" needs an amount to scale from`)
  const factor = written ? recipe.anchorAmount / written : NaN

  const rows: IngredientResult[] = items.map(({ ing, sectionId }, i) => {
    const amount = amounts[i] ?? null
    return {
      ingredient: ing,
      sectionId,
      pct: null,
      effectivePct: null,
      weight: amount === null ? null : amount * factor,
    }
  })
  return {
    rows,
    sections: v.sections.map((s) => ({ id: s.id, name: s.name, weight: NaN })),
    totalPct: NaN,
    totalWeight: NaN,
    base: factor,
    errors: [...new Set(errors)],
  }
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

/** An amount in `unit`: grams as in `fmtWeight`, other units (spoons, pieces) with up to 2 decimals. */
export function fmtAmount(n: number | null, unit: Unit): string {
  if (unit === 'g' || n === null || !Number.isFinite(n)) return fmtWeight(n)
  return String(round(n, 2))
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
