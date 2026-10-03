import { useMemo, useState } from 'react'
import { allIngredients, computeVariant, fmtPct, variantOf } from '../../calc'
import { TextButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input, Select, TextArea } from '../../components/Input'
import { Page } from '../../components/Page'
import { SectionTitle } from '../../components/SectionTitle'
import { TopBar } from '../../components/TopBar'
import { WarningList } from '../../components/Warning'
import { go } from '../../router'
import { useStore } from '../../storeContext'
import { categories } from '../../types'
import type { Category, Recipe, Section, Variant } from '../../types'
import { clone, uid, updateById } from '../../util'
import { AddButton } from './AddButton'
import { copyVariant, moveIngredient, moveSection } from './recipe'
import { ScalingCard } from './ScalingCard'
import { SectionCard } from './SectionCard'
import { VariantPicker } from './VariantPicker'
import s from './index.module.css'

interface RecipeEditProps {
  initial: Recipe
  isNew?: boolean
}

export function RecipeEdit({ initial, isNew }: RecipeEditProps) {
  const { save, remove } = useStore()
  const [r, setR] = useState<Recipe>(() => clone(initial))
  const [vid, setVid] = useState(() => variantOf(initial).id)
  // Snapshot from mount: for a new recipe the `initial` prop is rebuilt on every render.
  const [pristine] = useState(() => JSON.stringify(initial))
  const variant = variantOf(r, vid)
  const res = useMemo(() => computeVariant(r, variant), [r, variant])
  const pctById = new Map(res.rows.map((x) => [x.ingredient.id, x.pct]))

  const set = (patch: Partial<Recipe>) => setR((p) => ({ ...p, ...patch }))
  const setVariant = (fn: (v: Variant) => Variant) =>
    setR((p) => ({ ...p, variants: updateById(p.variants, variant.id, fn) }))
  const setSection = (sid: string, fn: (s: Section) => Section) =>
    setVariant((v) => ({ ...v, sections: updateById(v.sections, sid, fn) }))

  const allIngs = allIngredients(variant).map((x) => x.ing)
  const anchorOptions = [
    ...new Set(r.variants.flatMap((v) => allIngredients(v).map((x) => x.ing.name)).filter(Boolean)),
  ]
  const usesLiquidRemainder = allIngs.some((i) => i.group === 'liquid' && i.amount.kind === 'remainder')
  const multiSection = variant.sections.length > 1

  const onSave = () => {
    const out = {
      ...r,
      name: r.name.trim() || 'Untitled',
      activeVariant: variant.id,
    }
    if (out.mode === 'anchor' && !out.anchorName) out.anchorName = anchorOptions[0]
    save(out)
    go({ name: 'view', id: out.id }, true)
  }

  const onCancel = () => {
    if (JSON.stringify(r) !== pristine && !confirm('Discard your changes?')) return
    go(isNew ? { name: 'list' } : { name: 'view', id: r.id }, true)
  }

  const onAddVariant = () => {
    const c = copyVariant(variant)

    set({ variants: [...r.variants, c] })
    setVid(c.id)
  }

  const onDeleteVariant = () => {
    if (!confirm(`Delete variant "${variant.name}"?`)) return

    const rest = r.variants.filter((v) => v.id !== variant.id)

    // vid now points at a deleted variant, so variantOf() falls back to the first one
    set({ variants: rest })
  }

  return (
    <Page>
      <TopBar
        start={<TextButton onClick={onCancel}>Cancel</TextButton>}
        title={isNew ? 'New recipe' : 'Edit recipe'}
        end={
          <TextButton primary onClick={onSave}>
            Save
          </TextButton>
        }
      />

      <Card>
        <div className={s.nameRow}>
          <Input
            className={s.emoji}
            aria-label="Emoji"
            value={r.emoji}
            onChange={(e) => set({ emoji: e.target.value })}
          />
          <Input
            className={s.name}
            placeholder="Recipe name"
            value={r.name}
            onChange={(e) => set({ name: e.target.value })}
            autoFocus={isNew}
          />
        </div>
        <Select
          className={s.category}
          aria-label="Category"
          value={r.category}
          onChange={(e) => set({ category: e.target.value as Category })}
        >
          {Object.entries(categories).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Card>

      <SectionTitle>Scale by</SectionTitle>
      <ScalingCard r={r} set={set} anchorOptions={anchorOptions} />

      <SectionTitle>Ingredients</SectionTitle>
      <VariantPicker
        recipe={r}
        variant={variant}
        usesLiquidRemainder={usesLiquidRemainder}
        onSelect={setVid}
        onAdd={onAddVariant}
        onDelete={onDeleteVariant}
        onChange={setVariant}
      />

      {variant.sections.map((sec, si) => (
        <SectionCard
          key={sec.id}
          section={sec}
          showName={multiSection || !!sec.name}
          namePlaceholder={si === 0 && multiSection ? 'Section name (e.g. Poolish)' : 'Section name'}
          pctById={pctById}
          allIngredients={allIngs}
          modifierEnabled={r.modifierEnabled}
          onChange={(fn) => setSection(sec.id, fn)}
          onMoveIngredient={(iid, dir) => setVariant((v) => moveIngredient(v, sec.id, iid, dir))}
          onMove={(dir) => setVariant((v) => moveSection(v, sec.id, dir))}
          canMoveUp={si > 0}
          canMoveDown={si < variant.sections.length - 1}
          onDelete={() =>
            setVariant((v) => ({
              ...v,
              sections: v.sections.filter((x) => x.id !== sec.id),
            }))
          }
        />
      ))}
      <AddButton
        standalone
        onClick={() =>
          setVariant((v) => ({
            ...v,
            sections: [...v.sections, { id: uid(), name: '', ingredients: [] }],
          }))
        }
      >
        Section (e.g. poolish, roux)
      </AddButton>

      <WarningList messages={res.errors} />
      <div className={s.total}>Total: {fmtPct(res.totalPct)}</div>

      <SectionTitle>Notes</SectionTitle>
      <Card>
        <TextArea
          rows={6}
          placeholder="Bake times, temperatures, tips…"
          value={r.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Card>

      {!isNew && (
        <button
          className={s.delete}
          onClick={() => {
            if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return
            remove(r.id)
            go({ name: 'list' }, true)
          }}
        >
          Delete recipe
        </button>
      )}
    </Page>
  )
}
