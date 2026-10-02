import { cx } from '../../util'
import s from './index.module.css'

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  small?: boolean
  /** For margins or flex sizing; the control itself has none. */
  className?: string
}

export function Segmented<T extends string>({ options, value, onChange, small, className }: SegmentedProps<T>) {
  return (
    <div className={cx(s.segmented, small && s.small, className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
