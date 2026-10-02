import { useMemo } from 'react'
import { computeVariant, findAnchor, fmtPct, fmtWeight } from '../calc'
import { NumField } from '../components/NumField'
import { Icon } from '../components/Icon'
import { useLocalState, useWakeLock } from '../hooks'
import { go, href } from '../router'
import { useStore } from '../store'
import type { Recipe } from '../types'

export function RecipeView({ recipe }: { recipe: Recipe }) {
  const { saveSoon } = useStore()
  useWakeLock(true)
  const [checked, setChecked] = useLocalState<string[]>(`bakey.checked.${recipe.id}`, [])

  const variant = recipe.variants.find((v) => v.id === recipe.activeVariant) ?? recipe.variants[0]
  const res = useMemo(() => computeVariant(recipe, variant), [recipe, variant])
  const anchor = recipe.mode === 'anchor' ? findAnchor(recipe, variant) : undefined
  const update = (patch: Partial<Recipe>) => saveSoon({ ...recipe, ...patch })
  const setHydration = (h: number) =>
    update({ variants: recipe.variants.map((v) => (v.id === variant.id ? { ...v, hydration: h } : v)) })

  const toggle = (id: string) => setChecked(checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id])
  const showPortions = recipe.mode === 'portions' || recipe.showPortions
  const namedSections = variant.sections.length > 1 || variant.sections.some((s) => s.name)

  return (
    <div className="page">
      <header className="bar">
        <a className="iconbtn" href={href({ name: 'list' })} aria-label="Back">
          <Icon name="back" />
        </a>
        <div className="bar-actions">
          <button className="iconbtn" aria-label="Edit recipe" onClick={() => go({ name: 'edit', id: recipe.id })}>
            <Icon name="edit" />
          </button>
        </div>
      </header>

      <h1 className="title">
        <span className="emoji">{recipe.emoji}</span> {recipe.name}
      </h1>

      {recipe.variants.length > 1 && (
        <div className="segmented" role="tablist">
          {recipe.variants.map((v) => (
            <button key={v.id} role="tab" aria-selected={v.id === variant.id} onClick={() => update({ activeVariant: v.id })}>
              {v.name || 'Untitled'}
            </button>
          ))}
        </div>
      )}

      <section className="card inputs">
        {recipe.mode === 'total' && (
          <Row label="Total dough weight">
            <NumField value={recipe.totalWeight} onChange={(n) => update({ totalWeight: n })} suffix="g" step={50} min={0} />
          </Row>
        )}
        {recipe.mode === 'anchor' && (
          <Row label={`Weight of ${anchor?.name.toLowerCase() ?? 'anchor'}`}>
            <NumField value={recipe.anchorWeight} onChange={(n) => update({ anchorWeight: n })} suffix="g" min={0} />
          </Row>
        )}
        {showPortions && (
          <Row label="Portions">
            <NumField value={recipe.portions} onChange={(n) => update({ portions: n })} stepper min={1} />
          </Row>
        )}
        {recipe.mode === 'portions' && (
          <Row label="Portion size">
            <NumField value={recipe.portionSize} onChange={(n) => update({ portionSize: n })} suffix="g" step={10} min={0} />
          </Row>
        )}
        {variant.hydration !== undefined && (
          <Row label="Hydration">
            <NumField value={variant.hydration} onChange={setHydration} suffix="%" />
          </Row>
        )}
        {recipe.modifierEnabled && (
          <Row label="Modifier">
            <NumField value={recipe.modifier} onChange={(n) => update({ modifier: n })} suffix="%" step={5} stepper />
          </Row>
        )}
        {recipe.mode === 'portions' && (
          <Row label="Total dough weight">
            <span className="out">{fmtWeight(res.totalWeight)} g</span>
          </Row>
        )}
      </section>

      {res.errors.length > 0 && (
        <div className="warn">
          {res.errors.map((e) => (
            <div key={e}>⚠️ {e}</div>
          ))}
        </div>
      )}

      <section className="card table">
        <div className="trow thead">
          <span>Ingredient</span>
          <span>Percentage</span>
          <span>Weight</span>
        </div>
        {variant.sections.map((s) => {
          const rows = res.rows.filter((r) => r.sectionId === s.id)
          const sres = res.sections.find((x) => x.id === s.id)!
          return (
            <div key={s.id} className="tsection">
              {namedSections && (
                <div className="trow tsub">
                  <span>{s.name || 'Dough'}</span>
                  <span />
                  <span>{fmtWeight(sres.weight)}</span>
                </div>
              )}
              {rows.map((r) => {
                const done = checked.includes(r.ingredient.id)
                const mod = r.ingredient.modified && recipe.modifierEnabled && recipe.modifier !== 0
                return (
                  <button key={r.ingredient.id} className={`trow ing ${done ? 'done' : ''}`} onClick={() => toggle(r.ingredient.id)} aria-pressed={done}>
                    <span className="name">
                      <span className="tick">{done && <Icon name="check" size={14} />}</span>
                      {r.ingredient.name}
                    </span>
                    <span className="pct">
                      {fmtPct(r.pct)}
                      {mod && <sup>*</sup>}
                    </span>
                    <span className="w">{fmtWeight(r.weight)}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
        <div className="trow tfoot">
          <span>Total</span>
          <span>{fmtPct(res.totalPct)}</span>
          <span>{fmtWeight(res.totalWeight)}</span>
        </div>
      </section>
      <div className="tablenote">
        {recipe.modifierEnabled && recipe.modifier !== 0 && <span>* {recipe.modifier > 0 ? '+' : ''}{recipe.modifier}% modifier applied</span>}
        {checked.length > 0 && (
          <button className="link" onClick={() => setChecked([])}>
            Clear ticks
          </button>
        )}
      </div>

      {showPortions && res.portionSize !== undefined && (recipe.mode !== 'portions' || recipe.setAsides.length > 0) && (
        <section className="card">
          <Row label="Portion size">
            <span className="out">{fmtWeight(res.portionSize)} g</span>
          </Row>
          {recipe.setAsides.map((a) => (
            <Row key={a.id} label={a.label || 'Set aside'}>
              <NumField
                value={a.weight}
                onChange={(n) => update({ setAsides: recipe.setAsides.map((x) => (x.id === a.id ? { ...x, weight: n } : x)) })}
                suffix="g"
                min={0}
              />
            </Row>
          ))}
          {res.remainingPortionSize !== undefined && (
            <Row label="Portion size after set-aside">
              <span className="out">{fmtWeight(res.remainingPortionSize)} g</span>
            </Row>
          )}
        </section>
      )}

      {recipe.notes.trim() && (
        <section className="card notes">
          <h2>Notes</h2>
          <p>{recipe.notes}</p>
        </section>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="row">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}
