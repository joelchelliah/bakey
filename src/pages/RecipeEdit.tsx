import { useMemo, useState } from 'react'
import { allIngredients, computeVariant, fmtPct } from '../calc'
import { Icon } from '../components/Icon'
import { NumField } from '../components/NumField'
import { go } from '../router'
import { useStore } from '../store'
import type { Amount, Group, Ingredient, Recipe, ScalingMode, Section, Variant } from '../types'
import { clone, uid } from '../util'

export function newRecipe(): Recipe {
  return {
    id: uid(),
    name: '',
    emoji: '🍞',
    notes: '',
    mode: 'total',
    totalWeight: 1000,
    portions: 1,
    portionSize: 250,
    anchorWeight: 100,
    showPortions: false,
    setAsides: [],
    modifierEnabled: false,
    modifier: 0,
    updatedAt: new Date().toISOString(),
    variants: [
      {
        id: uid(),
        name: 'Standard',
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
  }
}

/** Copies a variant with fresh ids, keeping relative references intact. */
function copyVariant(v: Variant): Variant {
  const map = new Map<string, string>()
  const c = clone(v)
  c.id = uid()
  c.name = `${v.name} copy`
  for (const s of c.sections) {
    s.id = uid()
    for (const i of s.ingredients) {
      const id = uid()
      map.set(i.id, id)
      i.id = id
    }
  }
  for (const s of c.sections)
    for (const i of s.ingredients) if (i.amount.kind === 'relative') i.amount = { ...i.amount, of: map.get(i.amount.of) ?? i.amount.of }
  return c
}

const MODES: { mode: ScalingMode; label: string }[] = [
  { mode: 'total', label: 'Total weight' },
  { mode: 'portions', label: 'Portions' },
  { mode: 'anchor', label: 'One ingredient' },
]

export function RecipeEdit({ initial, isNew }: { initial: Recipe; isNew?: boolean }) {
  const { save, remove } = useStore()
  const [r, setR] = useState<Recipe>(() => clone(initial))
  const [vid, setVid] = useState(initial.activeVariant ?? initial.variants[0].id)
  const variant = r.variants.find((v) => v.id === vid) ?? r.variants[0]
  const res = useMemo(() => computeVariant(r, variant), [r, variant])
  const pctById = new Map(res.rows.map((x) => [x.ingredient.id, x.pct]))

  const set = (patch: Partial<Recipe>) => setR((p) => ({ ...p, ...patch }))
  const setVariant = (fn: (v: Variant) => Variant) =>
    setR((p) => ({ ...p, variants: p.variants.map((v) => (v.id === variant.id ? fn(v) : v)) }))
  const setSection = (sid: string, fn: (s: Section) => Section) =>
    setVariant((v) => ({ ...v, sections: v.sections.map((s) => (s.id === sid ? fn(s) : s)) }))
  const setIng = (sid: string, iid: string, patch: Partial<Ingredient>) =>
    setSection(sid, (s) => ({ ...s, ingredients: s.ingredients.map((i) => (i.id === iid ? { ...i, ...patch } : i)) }))

  const moveIng = (sid: string, iid: string, dir: -1 | 1) =>
    setVariant((v) => {
      // Moves within the section, or across into the neighbouring section at the edges.
      const sections = clone(v.sections)
      const si = sections.findIndex((s) => s.id === sid)
      const list = sections[si].ingredients
      const ii = list.findIndex((i) => i.id === iid)
      const [ing] = list.splice(ii, 1)
      const to = ii + dir
      if (to < 0 && si > 0) sections[si - 1].ingredients.push(ing)
      else if (to > list.length && si < sections.length - 1) sections[si + 1].ingredients.unshift(ing)
      else list.splice(Math.max(0, Math.min(list.length, to)), 0, ing)
      return { ...v, sections }
    })

  const allIngs = allIngredients(variant).map((x) => x.ing)
  const anchorOptions = [...new Set(r.variants.flatMap((v) => allIngredients(v).map((x) => x.ing.name)).filter(Boolean))]
  const usesLiquidRemainder = allIngs.some((i) => i.group === 'liquid' && i.amount.kind === 'remainder')

  const onSave = () => {
    const out = { ...r, name: r.name.trim() || 'Untitled', activeVariant: variant.id }
    if (out.mode === 'anchor' && !out.anchorName) out.anchorName = anchorOptions[0]
    save(out)
    go({ name: 'view', id: out.id }, true)
  }
  const onCancel = () => (isNew ? go({ name: 'list' }, true) : go({ name: 'view', id: r.id }, true))

  return (
    <div className="page edit">
      <header className="bar">
        <button className="textbtn" onClick={onCancel}>
          Cancel
        </button>
        <span className="bar-title">{isNew ? 'New recipe' : 'Edit recipe'}</span>
        <button className="textbtn primary" onClick={onSave}>
          Save
        </button>
      </header>

      <section className="card form">
        <div className="namerow">
          <input className="emoji-input" aria-label="Emoji" value={r.emoji} onChange={(e) => set({ emoji: e.target.value })} />
          <input className="grow" placeholder="Recipe name" value={r.name} onChange={(e) => set({ name: e.target.value })} autoFocus={isNew} />
        </div>
      </section>

      <h2 className="sechead">Scale by</h2>
      <section className="card form">
        <div className="segmented small">
          {MODES.map((m) => (
            <button key={m.mode} aria-selected={r.mode === m.mode} onClick={() => set({ mode: m.mode })}>
              {m.label}
            </button>
          ))}
        </div>
        {r.mode === 'anchor' && (
          <label className="row">
            <span className="label">Ingredient</span>
            <select value={r.anchorName ?? ''} onChange={(e) => set({ anchorName: e.target.value })}>
              {!r.anchorName && <option value="">Choose…</option>}
              {anchorOptions.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
        {r.mode !== 'portions' && (
          <label className="row">
            <span className="label">Show portions</span>
            <input type="checkbox" className="switch" checked={r.showPortions} onChange={(e) => set({ showPortions: e.target.checked })} />
          </label>
        )}
        {(r.mode === 'portions' || r.showPortions) && (
          <>
            {r.setAsides.map((a) => (
              <div className="row" key={a.id}>
                <input
                  className="grow"
                  placeholder="Set-aside portion (e.g. 👶 Baby)"
                  value={a.label}
                  onChange={(e) => set({ setAsides: r.setAsides.map((x) => (x.id === a.id ? { ...x, label: e.target.value } : x)) })}
                />
                <NumField
                  value={a.weight}
                  suffix="g"
                  onChange={(n) => set({ setAsides: r.setAsides.map((x) => (x.id === a.id ? { ...x, weight: n } : x)) })}
                />
                <button className="iconbtn danger" aria-label="Remove set-aside" onClick={() => set({ setAsides: r.setAsides.filter((x) => x.id !== a.id) })}>
                  <Icon name="x" size={18} />
                </button>
              </div>
            ))}
            <button className="addbtn" onClick={() => set({ setAsides: [...r.setAsides, { id: uid(), label: '', weight: 100 }] })}>
              <Icon name="plus" size={16} /> Set-aside portion
            </button>
          </>
        )}
        <label className="row">
          <span className="label">
            Modifier
            <small>± % on selected ingredients</small>
          </span>
          <input type="checkbox" className="switch" checked={r.modifierEnabled} onChange={(e) => set({ modifierEnabled: e.target.checked })} />
        </label>
      </section>

      <h2 className="sechead">Ingredients</h2>
      <div className="varianttabs">
        {r.variants.map((v) => (
          <button key={v.id} className={v.id === variant.id ? 'active' : ''} onClick={() => setVid(v.id)}>
            {v.name || 'Untitled'}
          </button>
        ))}
        <button
          aria-label="Add variant"
          onClick={() => {
            const c = copyVariant(variant)
            set({ variants: [...r.variants, c] })
            setVid(c.id)
          }}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>

      <section className="card form">
        <div className="row">
          <input className="grow" placeholder="Variant name" value={variant.name} onChange={(e) => setVariant((v) => ({ ...v, name: e.target.value }))} />
          {r.variants.length > 1 && (
            <button
              className="iconbtn danger"
              aria-label="Delete variant"
              onClick={() => {
                if (!confirm(`Delete variant "${variant.name}"?`)) return
                const rest = r.variants.filter((v) => v.id !== variant.id)
                set({ variants: rest })
                setVid(rest[0].id)
              }}
            >
              <Icon name="trash" size={18} />
            </button>
          )}
        </div>
        <label className="row">
          <span className="label">
            Hydration
            <small>{usesLiquidRemainder ? 'target for the liquid remainder' : 'optional'}</small>
          </span>
          {variant.hydration !== undefined ? (
            <span className="inline">
              <NumField value={variant.hydration} suffix="%" onChange={(n) => setVariant((v) => ({ ...v, hydration: n }))} />
              <button className="iconbtn" aria-label="Remove hydration" onClick={() => setVariant((v) => ({ ...v, hydration: undefined }))}>
                <Icon name="x" size={18} />
              </button>
            </span>
          ) : (
            <button className="textbtn" onClick={() => setVariant((v) => ({ ...v, hydration: 70 }))}>
              Add
            </button>
          )}
        </label>
      </section>

      {variant.sections.map((s, si) => (
        <section className="card form ingredients" key={s.id}>
          {(variant.sections.length > 1 || s.name) && (
            <div className="row sectionname">
              <input
                className="grow"
                placeholder={si === 0 && variant.sections.length > 1 ? 'Section name (e.g. Poolish)' : 'Section name'}
                value={s.name}
                onChange={(e) => setSection(s.id, (x) => ({ ...x, name: e.target.value }))}
              />
              <button
                className="iconbtn danger"
                aria-label="Delete section"
                onClick={() => {
                  if (s.ingredients.length && !confirm('Delete this section and its ingredients?')) return
                  setVariant((v) => ({ ...v, sections: v.sections.filter((x) => x.id !== s.id) }))
                }}
              >
                <Icon name="trash" size={18} />
              </button>
            </div>
          )}
          {s.ingredients.map((ing) => (
            <IngredientEditor
              key={ing.id}
              ing={ing}
              computedPct={pctById.get(ing.id) ?? null}
              others={allIngs.filter((x) => x.id !== ing.id)}
              modifierEnabled={r.modifierEnabled}
              onChange={(patch) => setIng(s.id, ing.id, patch)}
              onMove={(d) => moveIng(s.id, ing.id, d)}
              onDelete={() => setSection(s.id, (x) => ({ ...x, ingredients: x.ingredients.filter((i) => i.id !== ing.id) }))}
            />
          ))}
          <button
            className="addbtn"
            onClick={() =>
              setSection(s.id, (x) => ({
                ...x,
                ingredients: [...x.ingredients, { id: uid(), name: '', group: 'other', amount: { kind: 'percent', value: 0 } }],
              }))
            }
          >
            <Icon name="plus" size={16} /> Ingredient
          </button>
        </section>
      ))}
      <button
        className="addbtn standalone"
        onClick={() => setVariant((v) => ({ ...v, sections: [...v.sections, { id: uid(), name: '', ingredients: [] }] }))}
      >
        <Icon name="plus" size={16} /> Section (e.g. poolish, roux)
      </button>

      {res.errors.length > 0 && (
        <div className="warn">
          {res.errors.map((e) => (
            <div key={e}>⚠️ {e}</div>
          ))}
        </div>
      )}
      <div className="totalline">Total: {fmtPct(res.totalPct)}</div>

      <h2 className="sechead">Notes</h2>
      <section className="card form">
        <textarea rows={6} placeholder="Bake times, temperatures, tips…" value={r.notes} onChange={(e) => set({ notes: e.target.value })} />
      </section>

      {!isNew && (
        <button
          className="dangerbtn"
          onClick={() => {
            if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return
            remove(r.id)
            go({ name: 'list' }, true)
          }}
        >
          Delete recipe
        </button>
      )}
    </div>
  )
}

const KINDS: { kind: Amount['kind']; label: string }[] = [
  { kind: 'percent', label: 'Percent' },
  { kind: 'remainder', label: 'Remainder of group' },
  { kind: 'relative', label: '% of another ingredient' },
  { kind: 'toTaste', label: 'To taste (no amount)' },
]

const GROUPS: { group: Group; label: string }[] = [
  { group: 'flour', label: 'Flour' },
  { group: 'liquid', label: 'Liquid' },
  { group: 'other', label: 'Other' },
]

function IngredientEditor({
  ing,
  computedPct,
  others,
  modifierEnabled,
  onChange,
  onMove,
  onDelete,
}: {
  ing: Ingredient
  computedPct: number | null
  others: Ingredient[]
  modifierEnabled: boolean
  onChange: (p: Partial<Ingredient>) => void
  onMove: (d: -1 | 1) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(!ing.name)
  const a = ing.amount

  const setKind = (kind: Amount['kind']) => {
    if (kind === a.kind) return
    const cur = computedPct ?? 0
    const next: Amount =
      kind === 'percent'
        ? { kind, value: Number.isFinite(cur) ? Math.round(cur * 100) / 100 : 0 }
        : kind === 'relative'
          ? { kind, of: others[0]?.id ?? '', factor: 100 }
          : { kind }
    const patch: Partial<Ingredient> = { amount: next }
    if (kind === 'remainder' && ing.group === 'other') patch.group = 'flour'
    onChange(patch)
  }

  const summary =
    a.kind === 'remainder'
      ? `rest of ${ing.group}`
      : a.kind === 'relative'
        ? `${a.factor}% of ${others.find((o) => o.id === a.of)?.name || '?'}`
        : a.kind === 'toTaste'
          ? 'to taste'
          : ''

  return (
    <div className={`ingedit ${open ? 'open' : ''}`}>
      <div className="row">
        <input className="grow" placeholder="Ingredient" value={ing.name} onChange={(e) => onChange({ name: e.target.value })} />
        {a.kind === 'percent' ? (
          <NumField className="pctfield" value={a.value} suffix="%" onChange={(n) => onChange({ amount: { kind: 'percent', value: n } })} />
        ) : (
          <span className="computed" onClick={() => setOpen(true)}>
            <small>{summary}</small>
            {a.kind !== 'toTaste' && fmtPct(computedPct)}
          </span>
        )}
        <button className="iconbtn" aria-label="More options" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name="more" size={18} />
        </button>
      </div>
      {open && (
        <div className="ingdetails">
          <label className="row">
            <span className="label">Amount</span>
            <select value={a.kind} onChange={(e) => setKind(e.target.value as Amount['kind'])}>
              {KINDS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          {a.kind === 'relative' && (
            <div className="row">
              <NumField value={a.factor} suffix="%" onChange={(n) => onChange({ amount: { ...a, factor: n } })} />
              <span className="label">of</span>
              <select className="grow" value={a.of} onChange={(e) => onChange({ amount: { ...a, of: e.target.value } })}>
                {others.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name || 'Unnamed'}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="row">
            <span className="label">Group</span>
            <div className="segmented small">
              {GROUPS.map((g) => (
                <button key={g.group} aria-selected={ing.group === g.group} onClick={() => onChange({ group: g.group })}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          {a.kind === 'remainder' && (
            <p className="hint">
              {ing.group === 'flour'
                ? 'Fills the flour group up to 100%.'
                : ing.group === 'liquid'
                  ? 'Fills the liquid group up to the hydration target.'
                  : 'Pick Flour or Liquid for a remainder.'}
            </p>
          )}
          {modifierEnabled && (
            <label className="row">
              <span className="label">Affected by modifier</span>
              <input type="checkbox" className="switch" checked={!!ing.modified} onChange={(e) => onChange({ modified: e.target.checked })} />
            </label>
          )}
          <div className="row actions">
            <button className="iconbtn" aria-label="Move up" onClick={() => onMove(-1)}>
              <Icon name="up" size={18} />
            </button>
            <button className="iconbtn" aria-label="Move down" onClick={() => onMove(1)}>
              <Icon name="down" size={18} />
            </button>
            <span className="grow" />
            <button className="iconbtn danger" aria-label="Delete ingredient" onClick={onDelete}>
              <Icon name="trash" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
