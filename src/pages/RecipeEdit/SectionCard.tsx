import { IconButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Row } from '../../components/Row'
import type { Ingredient, Section } from '../../types'
import { uid, updateById } from '../../util'
import { AddButton } from './AddButton'
import { IngredientEditor } from './IngredientEditor'
import { MoveButtons } from './MoveButtons'
import type { Dir } from './recipe'
import type { DragSort } from './useDragSort'
import s from './SectionCard.module.css'

interface SectionCardProps {
  section: Section
  /** Show the name row (always when there are several sections). */
  showName: boolean
  namePlaceholder: string
  pctById: Map<string, number | null>
  allIngredients: Ingredient[]
  modifierEnabled: boolean
  /** The recipe scales by amount (see `usesAmounts`). */
  amounts: boolean
  /** The anchor ingredient whose amount is the recipe's default amount (scaling by amount only). */
  anchorId?: string
  onChange: (fn: (s: Section) => Section) => void
  /** Drag-to-reorder for the ingredients of all sections. */
  drag: DragSort
  /** Show the ingredient grips (when there's anywhere to move to). */
  canDrag: boolean
  /** Moves the whole section up or down. */
  onMove: (dir: Dir) => void
  canMoveUp: boolean
  canMoveDown: boolean
  onDelete: () => void
}

export function SectionCard({
  section,
  showName,
  namePlaceholder,
  pctById,
  allIngredients,
  modifierEnabled,
  amounts,
  anchorId,
  onChange,
  drag,
  canDrag,
  onMove,
  canMoveUp,
  canMoveDown,
  onDelete,
}: SectionCardProps) {
  const setIng = (iid: string, patch: Partial<Ingredient>) =>
    onChange((x) => ({ ...x, ingredients: updateById(x.ingredients, iid, patch) }))

  return (
    <Card ref={drag.list(section.id)} unclipped={!!drag.dragging}>
      {showName && (
        <Row className={s.name}>
          <Input
            placeholder={namePlaceholder}
            value={section.name}
            onChange={(e) => onChange((x) => ({ ...x, name: e.target.value }))}
          />
          <MoveButtons what="section" onMove={onMove} canMoveUp={canMoveUp} canMoveDown={canMoveDown} />
          <IconButton
            icon="trash"
            size={18}
            danger
            label="Delete section"
            onClick={() =>
              (!section.ingredients.length || confirm('Delete this section and its ingredients?')) && onDelete()
            }
          />
        </Row>
      )}
      {section.ingredients.map((ing) => (
        <IngredientEditor
          key={ing.id}
          ing={ing}
          computedPct={pctById.get(ing.id) ?? null}
          others={allIngredients.filter((x) => x.id !== ing.id)}
          modifierEnabled={modifierEnabled}
          amounts={amounts}
          isAnchor={ing.id === anchorId}
          onChange={(patch) => setIng(ing.id, patch)}
          dragRef={drag.item(ing.id)}
          dragging={drag.dragging === ing.id}
          onGrab={canDrag ? (e) => drag.start(e, ing.id) : undefined}
          onDelete={() =>
            onChange((x) => ({
              ...x,
              ingredients: x.ingredients.filter((i) => i.id !== ing.id),
            }))
          }
        />
      ))}
      <AddButton
        onClick={() =>
          onChange((x) => ({
            ...x,
            ingredients: [
              ...x.ingredients,
              {
                id: uid(),
                name: '',
                group: 'other',
                amount: amounts ? { kind: 'fixed', value: 0, unit: 'g' } : { kind: 'percent', value: 0 },
              },
            ],
          }))
        }
      >
        Ingredient
      </AddButton>
    </Card>
  )
}
