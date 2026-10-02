import type { ComponentProps } from 'react'
import { cx } from '../../util'
import s from './index.module.css'

interface InputProps extends ComponentProps<'input'> {}
interface SelectProps extends ComponentProps<'select'> {}
interface TextAreaProps extends ComponentProps<'textarea'> {}

/** Text input. It grows to fill a row by default. */
export function Input({ className, ...props }: InputProps) {
  return <input className={cx(s.field, s.input, className)} {...props} />
}

export function Select({ className, ...props }: SelectProps) {
  return <select className={cx(s.field, className)} {...props} />
}

export function TextArea({ className, ...props }: TextAreaProps) {
  return <textarea className={cx(s.field, s.textarea, className)} {...props} />
}
