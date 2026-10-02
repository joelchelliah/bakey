import { useState } from 'react'
import { fmtPct } from '../../calc'
import { IconButton } from '../../components/Button'
import { Hint } from '../../components/Hint'
import { Input, Select } from '../../components/Input'
import { NumField } from '../../components/NumField'
import { Row } from '../../components/Row'
import { Segmented } from '../../components/Segmented'
import { Switch } from '../../components/Switch'
import type { Amount, Group, Ingredient } from '../../types'
import { cx } from '../../util'
import s from './IngredientEditor.module.css'

const KINDS: { kind: Amount['kind']; label: string }[] = [
  { kind: 'percent', label: 'Percent' },
  { kind: 'remainder', label: 'Remainder of group' },
  { kind: 'relative', label: '% of another ingredient' },
  { kind: 'toTaste', label: 'To taste (no amount)' },
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
  onChange: (p: Partial<Ingredient>) => void
  onMove: (d: -1 | 1) => void
  onDelete: () => void
}

export function IngredientEditor({
  ing,
  computedPct,
  others,
  modifierEnabled,
  onChange,
  onMove,
  onDelete,
}: IngredientEditorProps) {
  const [open, setOpen] = useState(!ing.name)
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
    <div className={cx(s.editor, open && s.open)}>
      <Row className={s.head}>
        <Input placeholder="Ingredient" value={ing.name} onChange={(e) => onChange({ name: e.target.value })} />
        {a.kind === 'percent' ? (
          <NumField
            narrow
            value={a.value}
            suffix="%"
            onChange={(n) => onChange({ amount: { kind: 'percent', value: n } })}
          />
        ) : (
          <button type="button" className={s.computed} onClick={() => setOpen(true)}>
            <small>{summary}</small>
            {a.kind !== 'toTaste' && fmtPct(computedPct)}
          </button>
        )}
        <IconButton icon="more" size={18} label="More options" aria-expanded={open} onClick={() => setOpen(!open)} />
      </Row>
      {open && (
        <div className={s.details}>
          <Row as="label" label="Amount" className={s.detail}>
            <Select className={s.select} value={a.kind} onChange={(e) => setKind(e.target.value as Amount['kind'])}>
              {KINDS.map((k) => (
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
          <Row label="Group" className={s.detail}>
            <Segmented
              small
              className={s.grow}
              options={GROUPS}
              value={ing.group}
              onChange={(group) => onChange({ group })}
            />
          </Row>
          {a.kind === 'remainder' && (
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
          <Row className={cx(s.detail, s.actions)}>
            <IconButton icon="up" size={18} label="Move up" onClick={() => onMove(-1)} />
            <IconButton icon="down" size={18} label="Move down" onClick={() => onMove(1)} />
            <span className={s.grow} />
            <IconButton icon="trash" size={18} danger label="Delete ingredient" onClick={onDelete} />
          </Row>
        </div>
      )}
    </div>
  )
}
