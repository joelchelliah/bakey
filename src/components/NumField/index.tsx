import { useEffect, useRef, useState } from 'react'
import { parseNum } from '../../calc'
import { cx } from '../../util'
import s from './index.module.css'

interface NumFieldProps {
  value: number
  onChange: (n: number) => void
  suffix?: string
  step?: number
  stepper?: boolean
  min?: number
  /** Narrower input, for percentages in dense rows. */
  narrow?: boolean
  ariaLabel?: string
  placeholder?: string
}

const show = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 10000) / 10000) : '')

/** Number input that tolerates partial input ("0," / "-") while typing and accepts comma decimals. */
export function NumField({ value, onChange, suffix, step = 1, stepper, min, narrow, ariaLabel, placeholder }: NumFieldProps) {
  const [text, setText] = useState(show(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(show(value))
  }, [value])

  const set = (n: number) => {
    const v = min !== undefined ? Math.max(min, n) : n
    setText(show(v))
    onChange(v)
  }

  return (
    <span className={cx(s.field, narrow && s.narrow, stepper && s.stepped)}>
      {stepper && (
        <button type="button" className={s.step} aria-label="Decrease" onClick={() => set(value - step)}>
          −
        </button>
      )}
      <input
        className={s.input}
        inputMode="decimal"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={text}
        onFocus={(e) => {
          focused.current = true
          e.target.select()
        }}
        onBlur={() => {
          focused.current = false
          setText(show(value))
        }}
        onChange={(e) => {
          setText(e.target.value)
          if (/\d/.test(e.target.value)) onChange(parseNum(e.target.value))
        }}
      />
      {suffix && <span className={s.suffix}>{suffix}</span>}
      {stepper && (
        <button type="button" className={s.step} aria-label="Increase" onClick={() => set(value + step)}>
          +
        </button>
      )}
    </span>
  )
}
