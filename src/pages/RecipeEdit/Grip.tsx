import type { PointerEvent } from 'react'
import { Icon } from '../../components/Icon'
import { cx } from '../../util'
import s from './Grip.module.css'

interface GripProps {
  size: number
  className?: string
  onPointerDown: (e: PointerEvent) => void
}

/** The ≡ handle that starts a drag. Padded so it's an easy touch target. */
export function Grip({ size, className, onPointerDown }: GripProps) {
  return (
    <span className={cx(s.grip, className)} aria-hidden onPointerDown={onPointerDown}>
      <Icon name="grip" size={size} />
    </span>
  )
}
