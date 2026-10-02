import type { ComponentProps } from 'react'
import { cx } from '../../util'
import { Icon } from '../Icon'
import s from './index.module.css'

interface InputProps extends ComponentProps<'input'> {}
interface SelectProps extends ComponentProps<'select'> {}
interface TextAreaProps extends ComponentProps<'textarea'> {}

/** Text input. It grows to fill a row by default. */
export function Input({ className, ...props }: InputProps) {
  return <input className={cx(s.field, s.input, className)} {...props} />
}

/** Select with its own chevron. `className` goes on the wrapper, so use it for layout (width, flex, margins). */
export function Select({ className, ...props }: SelectProps) {
  return (
    <span className={cx(s.selectWrap, className)}>
      <select className={cx(s.field, s.select)} {...props} />
      <Icon name="down" size={18} />
    </span>
  )
}

export function TextArea({ className, ...props }: TextAreaProps) {
  return <textarea className={cx(s.field, s.textarea, className)} {...props} />
}
