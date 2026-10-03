import type { Amount, Group, Ingredient, Recipe, Section, Variant } from './types'
import { newRecipe } from './model'
import { uid } from './util'

const pct = (value: number): Amount => ({ kind: 'percent', value })
const rem: Amount = { kind: 'remainder' }
const taste: Amount = { kind: 'toTaste' }

type AmountSpec = Amount | ((keys: Record<string, string>) => Amount)
type IngSpec = [name: string, group: Group, amount: AmountSpec, opts?: { modified?: boolean; key?: string }]

/** Percentage of an earlier ingredient (referenced by its key). */
const of =
  (key: string, factor: number) =>
  (k: Record<string, string>): Amount => ({ kind: 'relative', of: k[key], factor })

function section(name: string, specs: IngSpec[], keys: Record<string, string>): Section {
  return {
    id: uid(),
    name,
    ingredients: specs.map(([n, group, amount, opts]): Ingredient => {
      const id = uid()
      if (opts?.key) keys[opts.key] = id
      return {
        id,
        name: n,
        group,
        amount: typeof amount === 'function' ? amount(keys) : amount,
        modified: opts?.modified,
      }
    }),
  }
}

/** Build a variant; relative amounts reference keys defined earlier via `of(key, factor)`. */
function variant(
  name: string,
  hydration: number | undefined,
  build: (keys: Record<string, string>) => Section[],
): Variant {
  const keys: Record<string, string> = {}
  return { id: uid(), name, hydration, sections: build(keys) }
}

function recipe(r: Partial<Recipe> & Pick<Recipe, 'name' | 'emoji' | 'category' | 'mode' | 'variants'>): Recipe {
  return newRecipe(r)
}

const breadNotes = (times: string) => `Baking times per weight:

${times}

Yeast:
Do 0.5% yeast for overnight BF and room temp proof`

export function starterRecipes(): Recipe[] {
  return [
    recipe({
      name: 'Pizza',
      category: 'savory',
      emoji: '🍕',
      mode: 'portions',
      portions: 6,
      portionSize: 210,
      variants: [
        variant('Regular', 72, (k) => [
          section(
            '',
            [
              ['Wheat flour', 'flour', pct(30)],
              ['Pizza flour', 'flour', pct(60)],
              ['Whole wheat flour', 'flour', rem],
              ['Salt', 'other', pct(2)],
              ['Yeast', 'other', pct(0.3)],
              ['Olive oil', 'liquid', pct(2)],
              ['Water', 'liquid', rem],
              ['Sugar', 'other', pct(1)],
            ],
            k,
          ),
        ]),
        variant('Poolish', 72, (k) => [
          section(
            'Poolish',
            [
              ['Poolish flour', 'flour', pct(30), { key: 'pf' }],
              ['Poolish water', 'liquid', of('pf', 100)],
            ],
            k,
          ),
          section(
            'Dough',
            [
              ['Pizza flour', 'flour', pct(60)],
              ['Whole wheat flour', 'flour', rem],
              ['Salt', 'other', pct(2)],
              ['Yeast', 'other', pct(0.15)],
              ['Olive oil', 'liquid', pct(2)],
              ['Remaining water', 'liquid', rem],
              ['Sugar', 'other', pct(1)],
            ],
            k,
          ),
        ]),
      ],
    }),
    recipe({
      name: 'Seeded – overnight proof',
      category: 'bread',
      emoji: '🥜',
      mode: 'total',
      totalWeight: 2200,
      notes: breadNotes('750 g – 18 / 10\n1000 g – 23 / 10\n1200 g – 26 / 10'),
      variants: [
        variant('Standard', undefined, (k) => [
          section(
            '',
            [
              ['Flour', 'flour', pct(86)],
              ['Spelt', 'flour', rem],
              ['Water', 'liquid', pct(80)],
              ['Seeds', 'other', pct(12)],
              ['Yeast', 'other', pct(0.25)],
              ['Salt', 'other', pct(2)],
            ],
            k,
          ),
        ]),
      ],
    }),
    recipe({
      name: 'Spiced – overnight proof',
      category: 'bread',
      emoji: '🌿',
      mode: 'total',
      totalWeight: 2200,
      notes: breadNotes('750 g – 18 / 10\n1000 g – 24 / 10\n1200 g – 28 / 10\n1400 g – 33 / 10'),
      variants: [
        variant('Standard', undefined, (k) => [
          section(
            '',
            [
              ['Flour', 'flour', pct(86)],
              ['Spelt', 'flour', rem],
              ['Water', 'liquid', pct(80)],
              ['Spices', 'other', pct(5)],
              ['Yeast', 'other', pct(0.3)],
              ['Salt', 'other', pct(2)],
            ],
            k,
          ),
        ]),
      ],
    }),
    recipe({
      name: 'Pan de Coco – overnight BF',
      category: 'bread',
      emoji: '🥥',
      mode: 'total',
      totalWeight: 1400,
      variants: [
        variant('Regular', 80, (k) => [
          section(
            '',
            [
              ['Flour', 'flour', pct(100)],
              ['Coconut milk', 'liquid', rem],
              ['Sugar', 'other', pct(5)],
              ['Salt', 'other', pct(2)],
              ['Yeast', 'other', pct(0.5)],
              ['Butter', 'other', pct(5)],
              ['Coconut flakes', 'other', pct(12)],
            ],
            k,
          ),
        ]),
        variant('Tangzhong', 90, (k) => [
          section(
            'Roux',
            [
              ['Roux flour', 'flour', pct(5)],
              ['Roux liquid', 'liquid', pct(25)],
            ],
            k,
          ),
          section(
            'Dough',
            [
              ['Flour', 'flour', rem],
              ['Coconut milk', 'liquid', rem],
              ['Sugar', 'other', pct(5)],
              ['Salt', 'other', pct(2)],
              ['Yeast', 'other', pct(0.5)],
              ['Butter', 'other', pct(5)],
              ['Coconut flakes', 'other', pct(10)],
            ],
            k,
          ),
        ]),
      ],
    }),
    recipe({
      name: 'Belgian Waffles',
      category: 'sweet',
      emoji: '🧇',
      mode: 'anchor',
      anchorName: 'Eggs',
      anchorWeight: 332,
      portions: 15,
      showPortions: true,
      variants: [
        variant('Standard', undefined, (k) => [
          section(
            '',
            [
              ['Eggs', 'other', pct(100), { key: 'eggs' }],
              ['Milk', 'liquid', pct(120)],
              ['Flour', 'flour', pct(100)],
              ['Butter / oil', 'other', pct(45)],
              ['Sugar', 'other', pct(20)],
              ['Baking powder', 'other', of('eggs', 12.5)],
              ['Salt / vanilla', 'other', taste],
            ],
            k,
          ),
        ]),
      ],
    }),
    recipe({
      name: 'Crêpe',
      category: 'sweet',
      emoji: '🥞',
      mode: 'anchor',
      anchorName: 'Eggs',
      anchorWeight: 175,
      portions: 3,
      showPortions: true,
      setAsides: [{ id: uid(), label: '👶 Baby', weight: 165 }],
      modifierEnabled: true,
      modifier: -15,
      notes: 'Modify to make the portion size:\n\n- Big pan: 85–90\n- Crêpe pan: 75–80',
      variants: [
        variant('Standard', undefined, (k) => [
          section(
            '',
            [
              ['Eggs', 'other', pct(100)],
              ['Milk / Stock', 'liquid', pct(90), { modified: true }],
              ['Flour', 'flour', pct(60), { modified: true }],
              ['Salt / sugar / vanilla', 'other', taste],
            ],
            k,
          ),
        ]),
      ],
    }),
  ]
}
