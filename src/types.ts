// All percentages are stored in percent units (72 means 72%).

export type ScalingMode =
  | 'total' // input: total dough weight
  | 'portions' // input: portions × portion size
  | 'anchor' // input: weight of one ingredient (e.g. eggs)

/**
 * In 'anchor' mode: 'weight' scales percentages from the anchor's weight; 'amount' scales fixed amounts (in any unit)
 * by the anchor's amount over the amount the recipe is written for.
 */
export type AnchorBy = 'weight' | 'amount'

/** Units for fixed amounts, with their abbreviation and label. */
export const units = {
  g: ['g', 'Grams'],
  ml: ['ml', 'Millilitres'],
  dl: ['dl', 'Decilitres'],
  pcs: ['pcs', 'Pieces'],
  tsp: ['tsp', 'Teaspoons'],
  tbs: ['tbs', 'Tablespoons'],
  pinch: ['pinch', 'Pinches'],
} as const

export type Unit = keyof typeof units

export type Group = 'flour' | 'liquid' | 'other'

/** Recipe categories in list order, with their labels. */
export const categories = { bread: 'Bread', savory: 'Savory', sweet: 'Sweet', other: 'Other' } as const

export type Category = keyof typeof categories

export type Amount =
  | { kind: 'percent'; value: number }
  | { kind: 'remainder' } // fills its group up to the target (flour: 100%, liquid: hydration)
  | { kind: 'relative'; of: string; factor: number } // factor (in %) of another ingredient's percentage
  | { kind: 'fixed'; value: number; unit: Unit } // only when scaling by amount
  | { kind: 'toTaste' }

export interface Ingredient {
  id: string
  name: string
  group: Group
  amount: Amount
  modified?: boolean // affected by the recipe modifier
}

export interface Section {
  id: string
  name: string // empty = main / unnamed section
  ingredients: Ingredient[]
}

export interface Variant {
  id: string
  name: string
  hydration?: number // target for 'remainder' liquid ingredients
  // Overrides of the recipe's inputs; undefined = use the recipe's value
  portions?: number
  portionSize?: number
  modifier?: number
  sections: Section[]
}

export interface SetAside {
  id: string
  label: string
  weight: number
}

export interface Recipe {
  id: string
  name: string
  emoji: string
  category: Category
  notes: string
  mode: ScalingMode
  anchorName?: string // ingredient name used as anchor in 'anchor' mode (matched per variant)
  anchorBy: AnchorBy
  // Remembered inputs (updated from the recipe view)
  totalWeight: number
  portions: number
  portionSize: number
  anchorWeight: number
  anchorAmount: number // in the anchor's unit, when anchorBy = 'amount'
  showPortions: boolean // in 'total'/'anchor' mode: show portion size output (never when scaling by amount)
  setAsides: SetAside[]
  modifierEnabled: boolean
  modifier: number // percent, e.g. -15
  variants: Variant[]
  activeVariant?: string
  updatedAt: string
}
