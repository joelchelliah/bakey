import { cx } from '../../util'
import s from './index.module.css'

interface HintProps {
  /** Drops the default inset margins. */
  flush?: boolean
  children: React.ReactNode
}

/** Small muted text, inset by default to line up with row content. */
export function Hint({ flush, children }: HintProps) {
  return <p className={cx(s.hint, flush && s.flush)}>{children}</p>
}
