import { fmtPct, fmtWeight, type VariantResult } from '../../calc'
import { Card } from '../../components/Card'
import { Icon } from '../../components/Icon'
import type { Recipe, Variant } from '../../types'
import { cx } from '../../util'
import s from './IngredientTable.module.css'

interface IngredientTableProps {
  recipe: Recipe
  variant: Variant
  res: VariantResult
  checked: string[]
  onToggle: (ingredientId: string) => void
}

/** The baking checklist: tap an ingredient once it's weighed. */
export function IngredientTable({ recipe, variant, res, checked, onToggle }: IngredientTableProps) {
  const namedSections = variant.sections.length > 1 || variant.sections.some((x) => x.name)
  const modifierShown = recipe.modifierEnabled && recipe.modifier !== 0

  return (
    <Card className={s.table}>
      <div className={cx(s.row, s.head)}>
        <span>Ingredient</span>
        <span>Percentage</span>
        <span>Weight</span>
      </div>
      {variant.sections.map((sec) => {
        const rows = res.rows.filter((r) => r.sectionId === sec.id)
        const sres = res.sections.find((x) => x.id === sec.id)
        return (
          <div key={sec.id}>
            {namedSections && (
              <div className={cx(s.row, s.sub)}>
                <span>{sec.name || 'Dough'}</span>
                <span />
                <span>{sres && fmtWeight(sres.weight)}</span>
              </div>
            )}
            {rows.map((r) => {
              const done = checked.includes(r.ingredient.id)
              return (
                <button
                  key={r.ingredient.id}
                  className={cx(s.row, s.ing, done && s.done)}
                  onClick={() => onToggle(r.ingredient.id)}
                  aria-pressed={done}
                >
                  <span className={s.name}>
                    <span className={s.tick}>{done && <Icon name="check" size={14} />}</span>
                    {r.ingredient.name}
                  </span>
                  <span className={s.pct}>
                    {fmtPct(r.pct)}
                    {r.ingredient.modified && modifierShown && <sup>*</sup>}
                  </span>
                  <span className={s.weight}>{fmtWeight(r.weight)}</span>
                </button>
              )
            })}
          </div>
        )
      })}
      <div className={cx(s.row, s.foot)}>
        <span>Total</span>
        <span>{fmtPct(res.totalPct)}</span>
        <span>{fmtWeight(res.totalWeight)}</span>
      </div>
    </Card>
  )
}
