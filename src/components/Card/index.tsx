import type { Ref } from 'react'
import { cx } from '../../util'
import s from './index.module.css'

interface CardProps {
  ref?: Ref<HTMLElement>
  /** Lets a dragged child show outside the card's edges. */
  unclipped?: boolean
  className?: string
  children: React.ReactNode
}

export function Card({ ref, unclipped, className, children }: CardProps) {
  return (
    <section ref={ref} className={cx(s.card, unclipped && s.unclipped, className)}>
      {children}
    </section>
  )
}
