import { cx } from '../../util'
import s from './index.module.css'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return <section className={cx(s.card, className)}>{children}</section>
}
