import { useEffect, useRef, useState } from 'react'
import { parseNum } from '../calc'

interface Props {
  value: number
  onChange: (n: number) => void
  suffix?: string
  step?: number
  stepper?: boolean
  min?: number
  className?: string
  ariaLabel?: string
  placeholder?: string
}

const show = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 10000) / 10000) : '')

/** Number input that tolerates partial input ("0," / "-") while typing and accepts comma decimals. */
export function NumField({ value, onChange, suffix, step = 1, stepper, min, className, ariaLabel, placeholder }: Props) {
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
    <span className={`numfield ${className ?? ''}`}>
      {stepper && (
        <button type="button" className="step" aria-label="Decrease" onClick={() => set(value - step)}>
          −
        </button>
      )}
      <input
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
      {suffix && <span className="suffix">{suffix}</span>}
      {stepper && (
        <button type="button" className="step" aria-label="Increase" onClick={() => set(value + step)}>
          +
        </button>
      )}
    </span>
  )
}
