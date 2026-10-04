import { fmtAmount, fmtPct, fmtWeight, inputsOf, unitOf, usesAmounts, type VariantResult } from '../../calc'
import { Card } from '../../components/Card'
import { Icon } from '../../components/Icon'
import { units, type Recipe, type Variant } from '../../types'
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
  const modifierShown = recipe.modifierEnabled && inputsOf(recipe, variant).modifier !== 0
  // Amounts can be in different units, so there are no percentages or totals.
  const amounts = usesAmounts(recipe)
  const mark = (r: VariantResult['rows'][number]) => r.ingredient.modified && modifierShown && <sup>*</sup>

  return (
    <Card className={cx(s.table, amounts && s.amounts)}>
      <div className={cx(s.row, s.head)}>
        <span>Ingredient</span>
        {!amounts && <span>Percentage</span>}
        <span>{amounts ? 'Amount' : 'Weight'}</span>
      </div>
      {variant.sections.map((sec) => {
        const rows = res.rows.filter((r) => r.sectionId === sec.id)
        const sres = res.sections.find((x) => x.id === sec.id)
        return (
          <div key={sec.id}>
            {namedSections && (
              <div className={cx(s.row, s.sub)}>
                <span>{sec.name || 'Dough'}</span>
                {!amounts && <span />}
                {!amounts && <span>{sres && fmtWeight(sres.weight)}</span>}
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
                  {amounts ? (
                    <span className={s.weight}>
                      {mark(r)}
                      {fmtAmount(r.weight, unitOf(r.ingredient))}
                      {r.weight !== null && <small>{units[unitOf(r.ingredient)][0]}</small>}
                    </span>
                  ) : (
                    <>
                      <span className={s.pct}>
                        {fmtPct(r.pct)}
                        {mark(r)}
                      </span>
                      <span className={s.weight}>{fmtWeight(r.weight)}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        )
      })}
      {!amounts && (
        <div className={cx(s.row, s.foot)}>
          <span>Total</span>
          <span>{fmtPct(res.totalPct)}</span>
          <span>{fmtWeight(res.totalWeight)}</span>
        </div>
      )}
    </Card>
  )
}
