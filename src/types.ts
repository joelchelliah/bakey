// All percentages are stored in percent units (72 means 72%).

export type ScalingMode =
  | 'total' // input: total dough weight
  | 'portions' // input: portions × portion size
  | 'anchor' // input: weight of one ingredient (e.g. eggs)

export type Group = 'flour' | 'liquid' | 'other'

export type Amount =
  | { kind: 'percent'; value: number }
  | { kind: 'remainder' } // fills its group up to the target (flour: 100%, liquid: hydration)
  | { kind: 'relative'; of: string; factor: number } // factor (in %) of another ingredient's percentage
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
  notes: string
  mode: ScalingMode
  anchorName?: string // ingredient name used as anchor in 'anchor' mode (matched per variant)
  // Remembered inputs (updated from the recipe view)
  totalWeight: number
  portions: number
  portionSize: number
  anchorWeight: number
  showPortions: boolean // in 'total'/'anchor' mode: show portion size output
  setAsides: SetAside[]
  modifierEnabled: boolean
  modifier: number // percent, e.g. -15
  variants: Variant[]
  activeVariant?: string
  updatedAt: string
}
