import { showsPortions } from '../../calc'
import { IconButton, TextButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { Icon } from '../../components/Icon'
import { Input } from '../../components/Input'
import { NumField } from '../../components/NumField'
import { Row } from '../../components/Row'
import type { Recipe, Variant } from '../../types'
import { cx } from '../../util'
import s from './VariantPicker.module.css'

interface OverrideRowProps {
  label: string
  sub: string
  value: number | undefined
  /** Value filled in when the row is added. */
  initial: number
  suffix?: string
  /** Called with undefined when the value is removed. */
  onChange: (n: number | undefined) => void
}

/** An optional per-variant value: a number field with a remove button, or an Add button. */
function OverrideRow({ label, sub, value, initial, suffix, onChange }: OverrideRowProps) {
  return (
    <Row as="label" label={label} sub={sub}>
      {value !== undefined ? (
        <span className={s.inline}>
          <NumField value={value} suffix={suffix} onChange={onChange} />
          <IconButton icon="x" size={18} label={`Remove ${label.toLowerCase()}`} onClick={() => onChange(undefined)} />
        </span>
      ) : (
        <TextButton onClick={() => onChange(initial)}>Add</TextButton>
      )}
    </Row>
  )
}

interface VariantPickerProps {
  recipe: Recipe
  variant: Variant
  usesLiquidRemainder: boolean
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: () => void
  onChange: (fn: (v: Variant) => Variant) => void
}

/** Variant tabs, and the name, hydration and input overrides of the selected variant. */
export function VariantPicker({
  recipe,
  variant,
  usesLiquidRemainder,
  onSelect,
  onAdd,
  onDelete,
  onChange,
}: VariantPickerProps) {
  const { variants } = recipe
  return (
    <>
      <div className={s.tabs}>
        {variants.map((v) => (
          <button key={v.id} className={cx(v.id === variant.id && s.active)} onClick={() => onSelect(v.id)}>
            {v.name || 'Untitled'}
          </button>
        ))}
        <button aria-label="Add variant" onClick={onAdd}>
          <Icon name="plus" size={16} />
        </button>
      </div>

      <Card>
        <Row>
          <Input
            placeholder="Variant name"
            value={variant.name}
            onChange={(e) => onChange((v) => ({ ...v, name: e.target.value }))}
          />
          {variants.length > 1 && (
            <IconButton icon="trash" size={18} danger label="Delete variant" onClick={onDelete} />
          )}
        </Row>
        <OverrideRow
          label="Hydration"
          sub={usesLiquidRemainder ? 'target for the liquid remainder' : 'optional'}
          value={variant.hydration}
          initial={70}
          suffix="%"
          onChange={(n) => onChange((v) => ({ ...v, hydration: n }))}
        />
        {showsPortions(recipe) && (
          <OverrideRow
            label="Portions"
            sub="instead of the recipe's"
            value={variant.portions}
            initial={recipe.portions}
            onChange={(n) => onChange((v) => ({ ...v, portions: n }))}
          />
        )}
        {recipe.mode === 'portions' && (
          <OverrideRow
            label="Portion size"
            sub="instead of the recipe's"
            value={variant.portionSize}
            initial={recipe.portionSize}
            suffix="g"
            onChange={(n) => onChange((v) => ({ ...v, portionSize: n }))}
          />
        )}
        {recipe.modifierEnabled && (
          <OverrideRow
            label="Modifier"
            sub="instead of the recipe's"
            value={variant.modifier}
            initial={recipe.modifier}
            suffix="%"
            onChange={(n) => onChange((v) => ({ ...v, modifier: n }))}
          />
        )}
      </Card>
    </>
  )
}
