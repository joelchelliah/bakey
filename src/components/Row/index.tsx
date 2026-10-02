import { cx } from '../../util'
import s from './index.module.css'

interface RowProps {
  label?: React.ReactNode
  sub?: React.ReactNode
  /** Use 'label' when the row wraps a single control, so tapping the row focuses it. */
  as?: 'div' | 'label'
  className?: string
  children?: React.ReactNode
}

/** A card line: optional label (with small sub-label) followed by a control or value. */
export function Row({ label, sub, as: Tag = 'div', className, children }: RowProps) {
  return (
    <Tag className={cx(s.row, className)}>
      {label !== undefined && (
        <span className={s.label}>
          {label}
          {sub && <small>{sub}</small>}
        </span>
      )}
      {children}
    </Tag>
  )
}

interface RowValueProps {
  muted?: boolean
  children: React.ReactNode
}

/** A read-only number or text shown at the end of a row. */
export function RowValue({ muted, children }: RowValueProps) {
  return <span className={cx(s.value, muted && s.muted)}>{children}</span>
}
