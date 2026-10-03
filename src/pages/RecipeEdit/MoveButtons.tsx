import { IconButton } from '../../components/Button'
import type { Dir } from './recipe'

interface MoveButtonsProps {
  /** Named in the labels, e.g. "Move section up". */
  what?: string
  onMove: (dir: Dir) => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}

/** Up and down buttons for reordering a row. */
export function MoveButtons({ what, onMove, canMoveUp = true, canMoveDown = true }: MoveButtonsProps) {
  const name = what ? ` ${what}` : ''
  return (
    <>
      <IconButton icon="up" size={18} label={`Move${name} up`} disabled={!canMoveUp} onClick={() => onMove(-1)} />
      <IconButton icon="down" size={18} label={`Move${name} down`} disabled={!canMoveDown} onClick={() => onMove(1)} />
    </>
  )
}
