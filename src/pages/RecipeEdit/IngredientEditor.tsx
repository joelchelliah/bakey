import { useState } from 'react'
import type { PointerEvent, RefCallback } from 'react'
import { fmtAmount, fmtPct } from '../../calc'
import { IconButton } from '../../components/Button'
import { Hint } from '../../components/Hint'
import { Input, Select } from '../../components/Input'
import { NumField } from '../../components/NumField'
import { Row } from '../../components/Row'
import { Segmented } from '../../components/Segmented'
import { Switch } from '../../components/Switch'
import { units, type Amount, type Group, type Ingredient, type Unit } from '../../types'
import { cx } from '../../util'
import { Grip } from './Grip'
import s from './IngredientEditor.module.css'

const KINDS: { kind: Amount['kind']; label: string; amounts: boolean }[] = [
  { kind: 'percent', label: 'Percent', amounts: false },
  { kind: 'remainder', label: 'Remainder of group', amounts: false },
  { kind: 'relative', label: '% of another ingredient', amounts: false },
  { kind: 'fixed', label: 'Fixed', amounts: true },
  { kind: 'toTaste', label: 'To taste (no amount)', amounts: true },
]

const GROUPS: { value: Group; label: string }[] = [
  { value: 'flour', label: 'Flour' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'other', label: 'Other' },
]

interface IngredientEditorProps {
  ing: Ingredient
  computedPct: number | null
  others: Ingredient[]
  modifierEnabled: boolean
  /** The recipe scales by amount: offer fixed amounts and units instead of percentages and groups. */
  amounts: boolean
  /** The anchor when scaling by amount: its amount is the default amount, so it's shown, not edited. */
  isAnchor: boolean
  onChange: (p: Partial<Ingredient>) => void
  dragRef: RefCallback<HTMLElement>
  dragging: boolean
  /** Starts a drag from the grip. No grip is shown without it. */
  onGrab?: (e: PointerEvent) => void
  onDelete: () => void
}

export function IngredientEditor({
  ing,
  computedPct,
  others,
  modifierEnabled,
  amounts,
  isAnchor,
  onChange,
  dragRef,
  dragging,
  onGrab,
  onDelete,
}: IngredientEditorProps) {
  const [open, setOpen] = useState(false)
  const a = ing.amount

  const setKind = (kind: Amount['kind']) => {
    if (kind === a.kind) return
    const cur = computedPct ?? 0
    const next: Amount =
      kind === 'percent'
        ? {
            kind,
            value: Number.isFinite(cur) ? Math.round(cur * 100) / 100 : 0,
          }
        : kind === 'relative'
          ? { kind, of: others[0]?.id ?? '', factor: 100 }
          : kind === 'fixed'
            ? { kind, value: 0, unit: 'g' }
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
    <div ref={dragRef} className={cx(s.editor, open && s.open, dragging && s.dragging)}>
      <Row className={s.head}>
        {onGrab && <Grip size={18} className={s.grip} onPointerDown={onGrab} />}
        <Input placeholder="Ingredient" value={ing.name} onChange={(e) => onChange({ name: e.target.value })} />
        {a.kind === 'percent' ? (
          <NumField
            narrow
            value={a.value}
            suffix="%"
            onChange={(n) => onChange({ amount: { kind: 'percent', value: n } })}
          />
        ) : a.kind === 'fixed' && isAnchor ? (
          <button type="button" className={s.computed} onClick={() => setOpen(true)}>
            <small>default</small>
            {fmtAmount(a.value, a.unit)} {units[a.unit][0]}
          </button>
        ) : a.kind === 'fixed' ? (
          <NumField
            narrow
            value={a.value}
            suffix={units[a.unit][0]}
            onChange={(n) => onChange({ amount: { ...a, value: n } })}
          />
        ) : (
          <button type="button" className={s.computed} onClick={() => setOpen(true)}>
            <small>{summary}</small>
            {a.kind !== 'toTaste' && fmtPct(computedPct)}
          </button>
        )}
        <IconButton icon="trash" size={18} danger label="Delete ingredient" onClick={onDelete} />
        <IconButton icon="more" size={18} label="More options" aria-expanded={open} onClick={() => setOpen(!open)} />
      </Row>
      {open && (
        <div className={s.details}>
          <Row as="label" label="Amount" className={s.detail}>
            <Select className={s.select} value={a.kind} onChange={(e) => setKind(e.target.value as Amount['kind'])}>
              {KINDS.filter((k) => k.amounts === amounts || k.kind === a.kind).map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Row>
          {a.kind === 'relative' && (
            <Row className={s.detail}>
              <NumField value={a.factor} suffix="%" onChange={(n) => onChange({ amount: { ...a, factor: n } })} />
              <span>of</span>
              <Select
                className={s.grow}
                value={a.of}
                onChange={(e) => onChange({ amount: { ...a, of: e.target.value } })}
              >
                {others.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name || 'Unnamed'}
                  </option>
                ))}
              </Select>
            </Row>
          )}
          {a.kind === 'fixed' && (
            <Row as="label" label="Unit" className={s.detail}>
              <Select
                className={s.select}
                value={a.unit}
                onChange={(e) => onChange({ amount: { ...a, unit: e.target.value as Unit } })}
              >
                {Object.entries(units).map(([value, [, label]]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Row>
          )}
          {!amounts && (
            <Row label="Group" className={s.detail}>
              <Segmented
                small
                className={s.grow}
                options={GROUPS}
                value={ing.group}
                onChange={(group) => onChange({ group })}
              />
            </Row>
          )}
          {a.kind === 'remainder' && !amounts && (
            <Hint>
              {ing.group === 'flour'
                ? 'Fills the flour group up to 100%.'
                : ing.group === 'liquid'
                  ? 'Fills the liquid group up to the hydration target.'
                  : 'Pick Flour or Liquid for a remainder.'}
            </Hint>
          )}
          {modifierEnabled && (
            <Row as="label" label="Affected by modifier" className={s.detail}>
              <Switch checked={!!ing.modified} onChange={(modified) => onChange({ modified })} />
            </Row>
          )}
        </div>
      )}
    </div>
  )
}
