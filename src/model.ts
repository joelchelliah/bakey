import {
  categories,
  type AnchorBy,
  type Amount,
  type Group,
  type Ingredient,
  type Recipe,
  type ScalingMode,
  type Unit,
  units,
} from './types'
import { uid } from './util'

/** A new recipe with every field filled in; `r` overrides the defaults. */
export function newRecipe(r: Partial<Recipe> = {}): Recipe {
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
    anchorBy: 'weight',
    anchorWeight: 100,
    defaultAmount: 1,
    showPortions: false,
    setAsides: [],
    modifierEnabled: false,
    modifier: 0,
    updatedAt: new Date().toISOString(),
    variants: [
      {
        id: uid(),
        name: 'Regular',
        sections: [
          {
            id: uid(),
            name: '',
            ingredients: [
              { id: uid(), name: 'Flour', group: 'flour', amount: { kind: 'percent', value: 100 } },
              { id: uid(), name: 'Water', group: 'liquid', amount: { kind: 'percent', value: 70 } },
              { id: uid(), name: 'Salt', group: 'other', amount: { kind: 'percent', value: 2 } },
              { id: uid(), name: 'Yeast', group: 'other', amount: { kind: 'percent', value: 1 } },
            ],
          },
        ],
      },
    ],
    ...r,
  }
}

type Raw = Record<string, unknown>

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback)
const optStr = (v: unknown) => (typeof v === 'string' ? v : undefined)
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const optNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const id = (v: unknown) => (typeof v === 'string' && v ? v : uid())
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T) =>
  options.includes(v as T) ? (v as T) : fallback
/** Normalizes each object in an array and drops anything else. */
const listOf = <T>(v: unknown, fn: (x: Raw) => T): T[] => (Array.isArray(v) ? v.filter(isObj).map(fn) : [])

const MODES: ScalingMode[] = ['total', 'portions', 'anchor']
const ANCHOR_BY: AnchorBy[] = ['weight', 'amount']
const UNITS = Object.keys(units) as Unit[]
const GROUPS: Group[] = ['flour', 'liquid', 'other']

function amount(a: unknown): Amount {
  if (isObj(a) && a.kind === 'relative') return { kind: 'relative', of: str(a.of), factor: num(a.factor, 100) }
  if (isObj(a) && a.kind === 'fixed') return { kind: 'fixed', value: num(a.value, 0), unit: oneOf(a.unit, UNITS, 'g') }
  if (isObj(a) && (a.kind === 'remainder' || a.kind === 'toTaste')) return { kind: a.kind }
  return { kind: 'percent', value: isObj(a) ? num(a.value, 0) : 0 }
}

function ingredient(i: Raw): Ingredient {
  return {
    ...i,
    id: id(i.id),
    name: str(i.name),
    group: oneOf(i.group, GROUPS, 'other'),
    amount: amount(i.amount),
    modified: i.modified === true || undefined,
  }
}

/**
 * Makes stored or imported data safe to render: fills missing or invalid fields with defaults and drops broken
 * list items. Unknown fields are kept, so data written by a newer version survives a save. Returns null without an id.
 */
export function normalizeRecipe(raw: unknown): Recipe | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !raw.id) return null
  const d = newRecipe()
  const variants = listOf(raw.variants, (v) => ({
    ...v,
    id: id(v.id),
    name: str(v.name),
    hydration: optNum(v.hydration),
    portions: optNum(v.portions),
    portionSize: optNum(v.portionSize),
    modifier: optNum(v.modifier),
    sections: listOf(v.sections, (s) => ({
      ...s,
      id: id(s.id),
      name: str(s.name),
      ingredients: listOf(s.ingredients, ingredient),
    })),
  }))
  return {
    ...raw,
    id: raw.id,
    name: str(raw.name),
    emoji: str(raw.emoji, d.emoji),
    category: oneOf(raw.category, Object.keys(categories) as (keyof typeof categories)[], 'other'),
    notes: str(raw.notes),
    mode: oneOf(raw.mode, MODES, d.mode),
    anchorName: optStr(raw.anchorName),
    anchorBy: oneOf(raw.anchorBy, ANCHOR_BY, d.anchorBy),
    totalWeight: num(raw.totalWeight, d.totalWeight),
    portions: num(raw.portions, d.portions),
    portionSize: num(raw.portionSize, d.portionSize),
    anchorWeight: num(raw.anchorWeight, d.anchorWeight),
    defaultAmount: num(raw.defaultAmount, d.defaultAmount),
    showPortions: raw.showPortions === true,
    setAsides: listOf(raw.setAsides, (a) => ({ ...a, id: id(a.id), label: str(a.label), weight: num(a.weight, 0) })),
    modifierEnabled: raw.modifierEnabled === true,
    modifier: num(raw.modifier, d.modifier),
    variants: variants.length ? variants : d.variants,
    activeVariant: optStr(raw.activeVariant),
    // An unknown age never wins over a real edit.
    updatedAt: str(raw.updatedAt, new Date(0).toISOString()),
  }
}

/** Normalizes a list of recipes, dropping entries that can't be repaired. Anything but an array gives []. */
export function normalizeRecipes(raw: unknown): Recipe[] {
  return Array.isArray(raw) ? raw.map(normalizeRecipe).filter((r) => r !== null) : []
}

/** Downloads recipes as a JSON backup. Takes `unknown[]` so unreadable data can still be saved. */
export function exportRecipes(recipes: unknown[]) {
  const blob = new Blob([JSON.stringify({ app: 'bakey', version: 1, recipes }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `bakey-recipes-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Reads a backup made by `exportRecipes` (or a bare array of recipes). Throws when nothing usable is found. */
export function parseBackup(text: string): Recipe[] {
  const parsed: unknown = JSON.parse(text)
  const list = normalizeRecipes(Array.isArray(parsed) ? parsed : isObj(parsed) ? parsed.recipes : null)
  if (!list.length) throw new Error('Not a Bakey export')
  return list
}
