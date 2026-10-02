import { useMemo } from 'react'
import { computeVariant, findAnchor, fmtWeight } from '../../calc'
import { IconButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { NumField } from '../../components/NumField'
import { Page } from '../../components/Page'
import { Row, RowValue } from '../../components/Row'
import { Segmented } from '../../components/Segmented'
import { TopBar } from '../../components/TopBar'
import { Warning } from '../../components/Warning'
import { useLocalState, useWakeLock } from '../../hooks'
import { go, href } from '../../router'
import { useStore } from '../../storeContext'
import type { Recipe } from '../../types'
import { IngredientTable } from './IngredientTable'
import s from './index.module.css'

interface RecipeViewProps {
  recipe: Recipe
}

export function RecipeView({ recipe }: RecipeViewProps) {
  const { saveSoon } = useStore()
  useWakeLock(true)
  const [checked, setChecked] = useLocalState<string[]>(`bakey.checked.${recipe.id}`, [])

  const variant = recipe.variants.find((v) => v.id === recipe.activeVariant) ?? recipe.variants[0]
  const res = useMemo(() => computeVariant(recipe, variant), [recipe, variant])
  const anchor = recipe.mode === 'anchor' ? findAnchor(recipe, variant) : undefined
  const update = (patch: Partial<Recipe>) => saveSoon({ ...recipe, ...patch })
  const setHydration = (h: number) =>
    update({
      variants: recipe.variants.map((v) => (v.id === variant.id ? { ...v, hydration: h } : v)),
    })

  const toggle = (id: string) => setChecked(checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id])
  const showPortions = recipe.mode === 'portions' || recipe.showPortions

  return (
    <Page>
      <TopBar
        start={<IconButton icon="back" label="Back" href={href({ name: 'list' })} />}
        end={<IconButton icon="edit" label="Edit recipe" onClick={() => go({ name: 'edit', id: recipe.id })} />}
      />

      <h1 className={s.title}>
        {recipe.emoji} {recipe.name}
      </h1>

      {recipe.variants.length > 1 && (
        <Segmented
          className={s.variants}
          options={recipe.variants.map((v) => ({
            value: v.id,
            label: v.name || 'Untitled',
          }))}
          value={variant.id}
          onChange={(id) => update({ activeVariant: id })}
        />
      )}

      <Card>
        {recipe.mode === 'total' && (
          <Row as="label" label="Total dough weight">
            <NumField
              value={recipe.totalWeight}
              onChange={(n) => update({ totalWeight: n })}
              suffix="g"
              step={50}
              min={0}
            />
          </Row>
        )}
        {recipe.mode === 'anchor' && (
          <Row as="label" label={`Weight of ${anchor?.name.toLowerCase() ?? 'anchor'}`}>
            <NumField value={recipe.anchorWeight} onChange={(n) => update({ anchorWeight: n })} suffix="g" min={0} />
          </Row>
        )}
        {showPortions && (
          <Row as="label" label="Portions">
            <NumField value={recipe.portions} onChange={(n) => update({ portions: n })} stepper min={1} />
          </Row>
        )}
        {recipe.mode === 'portions' && (
          <Row as="label" label="Portion size">
            <NumField
              value={recipe.portionSize}
              onChange={(n) => update({ portionSize: n })}
              suffix="g"
              step={10}
              min={0}
            />
          </Row>
        )}
        {variant.hydration !== undefined && (
          <Row as="label" label="Hydration">
            <NumField value={variant.hydration} onChange={setHydration} suffix="%" />
          </Row>
        )}
        {recipe.modifierEnabled && (
          <Row as="label" label="Modifier">
            <NumField value={recipe.modifier} onChange={(n) => update({ modifier: n })} suffix="%" step={5} stepper />
          </Row>
        )}
        {recipe.mode === 'portions' && (
          <Row label="Total dough weight">
            <RowValue>{fmtWeight(res.totalWeight)} g</RowValue>
          </Row>
        )}
      </Card>

      {res.errors.length > 0 && (
        <Warning>
          {res.errors.map((e) => (
            <div key={e}>⚠️ {e}</div>
          ))}
        </Warning>
      )}

      <IngredientTable recipe={recipe} variant={variant} res={res} checked={checked} onToggle={toggle} />
      <div className={s.tableNote}>
        {recipe.modifierEnabled && recipe.modifier !== 0 && (
          <span>
            * {recipe.modifier > 0 ? '+' : ''}
            {recipe.modifier}% modifier applied
          </span>
        )}
        {checked.length > 0 && (
          <button className={s.clear} onClick={() => setChecked([])}>
            Clear ticks
          </button>
        )}
      </div>

      {showPortions && res.portionSize !== undefined && (recipe.mode !== 'portions' || recipe.setAsides.length > 0) && (
        <Card>
          <Row label="Portion size">
            <RowValue>{fmtWeight(res.portionSize)} g</RowValue>
          </Row>
          {recipe.setAsides.map((a) => (
            <Row as="label" key={a.id} label={a.label || 'Set aside'}>
              <NumField
                value={a.weight}
                onChange={(n) =>
                  update({
                    setAsides: recipe.setAsides.map((x) => (x.id === a.id ? { ...x, weight: n } : x)),
                  })
                }
                suffix="g"
                min={0}
              />
            </Row>
          ))}
          {res.remainingPortionSize !== undefined && (
            <Row label="Portion size after set-aside">
              <RowValue>{fmtWeight(res.remainingPortionSize)} g</RowValue>
            </Row>
          )}
        </Card>
      )}

      {recipe.notes.trim() && (
        <Card className={s.notes}>
          <h2>Notes</h2>
          <p>{recipe.notes}</p>
        </Card>
      )}
    </Page>
  )
}
