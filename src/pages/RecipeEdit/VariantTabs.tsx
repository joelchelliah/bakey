import { Icon } from '../../components/Icon'
import type { Variant } from '../../types'
import { cx } from '../../util'
import { Grip } from './Grip'
import { useDragSort } from './useDragSort'
import s from './VariantTabs.module.css'

interface VariantTabsProps {
  variants: Variant[]
  activeId: string
  onSelect: (id: string) => void
  onAdd: () => void
  /** Moves a variant to `index`, counted among the others. Must update from the latest state. */
  onPlace: (id: string, index: number) => void
}

/** Variant pills with an Add button. With more than one variant, each pill's grip drags it left or right. */
export function VariantTabs({ variants, activeId, onSelect, onAdd, onPlace }: VariantTabsProps) {
  const drag = useDragSort('x', [{ id: 'variants', items: variants.map((v) => v.id) }], (id, _, index) =>
    onPlace(id, index),
  )

  return (
    <div className={s.tabs}>
      {variants.map((v) => (
        <button
          key={v.id}
          ref={drag.item(v.id)}
          className={cx(v.id === activeId && s.active, drag.dragging === v.id && s.dragging)}
          onClick={() => onSelect(v.id)}
        >
          {v.name || 'Untitled'}
          {variants.length > 1 && <Grip size={14} className={s.grip} onPointerDown={(e) => drag.start(e, v.id)} />}
        </button>
      ))}
      <button aria-label="Add variant" onClick={onAdd}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
