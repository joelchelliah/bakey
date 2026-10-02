import { cx } from '../../util'
import s from './index.module.css'

interface PageProps {
  /** Centres the content on screen (loading and not-found states). */
  center?: boolean
  children: React.ReactNode
}

export function Page({ center, children }: PageProps) {
  return <div className={cx(s.page, center && s.center)}>{children}</div>
}
