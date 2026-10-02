import { IconButton } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input, Select } from '../../components/Input'
import { NumField } from '../../components/NumField'
import { Row } from '../../components/Row'
import { Segmented } from '../../components/Segmented'
import { Switch } from '../../components/Switch'
import type { Recipe, ScalingMode } from '../../types'
import { uid } from '../../util'
import { AddButton } from './AddButton'
import s from './ScalingCard.module.css'

const MODES: { value: ScalingMode; label: string }[] = [
  { value: 'total', label: 'Total weight' },
  { value: 'portions', label: 'Portions' },
  { value: 'anchor', label: 'One ingredient' },
]

interface ScalingCardProps {
  r: Recipe
  set: (patch: Partial<Recipe>) => void
  /** Ingredient names across all variants, for the anchor picker. */
  anchorOptions: string[]
}

/** How the recipe scales, plus portions, set-asides and the modifier switch. */
export function ScalingCard({ r, set, anchorOptions }: ScalingCardProps) {
  const setAsides = r.setAsides
  return (
    <Card>
      <Segmented small className={s.modes} options={MODES} value={r.mode} onChange={(mode) => set({ mode })} />
      {r.mode === 'anchor' && (
        <Row as="label" label="Ingredient">
          <Select value={r.anchorName ?? ''} onChange={(e) => set({ anchorName: e.target.value })}>
            {!r.anchorName && <option value="">Choose…</option>}
            {anchorOptions.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </Select>
        </Row>
      )}
      {r.mode !== 'portions' && (
        <Row as="label" label="Show portions">
          <Switch checked={r.showPortions} onChange={(showPortions) => set({ showPortions })} />
        </Row>
      )}
      {(r.mode === 'portions' || r.showPortions) && (
        <>
          {setAsides.map((a) => (
            <Row key={a.id}>
              <Input
                placeholder="Set-aside portion (e.g. 👶 Baby)"
                value={a.label}
                onChange={(e) => set({ setAsides: setAsides.map((x) => (x.id === a.id ? { ...x, label: e.target.value } : x)) })}
              />
              <NumField value={a.weight} suffix="g" onChange={(n) => set({ setAsides: setAsides.map((x) => (x.id === a.id ? { ...x, weight: n } : x)) })} />
              <IconButton icon="x" size={18} danger label="Remove set-aside" onClick={() => set({ setAsides: setAsides.filter((x) => x.id !== a.id) })} />
            </Row>
          ))}
          <AddButton onClick={() => set({ setAsides: [...setAsides, { id: uid(), label: '', weight: 100 }] })}>Set-aside portion</AddButton>
        </>
      )}
      <Row as="label" label="Modifier" sub="± % on selected ingredients">
        <Switch checked={r.modifierEnabled} onChange={(modifierEnabled) => set({ modifierEnabled })} />
      </Row>
    </Card>
  )
}
