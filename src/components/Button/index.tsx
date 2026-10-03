import type { ComponentProps } from 'react'
import { cx } from '../../util'
import { Icon, type IconName } from '../Icon'
import s from './index.module.css'

interface ButtonProps extends Omit<ComponentProps<'button'>, 'className'> {
  /** Renders a link instead of a button. */
  href?: string
}

interface BaseProps extends ButtonProps {
  className?: string
}

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: IconName
  size?: number
  /** Accessible name, since the button has no text. */
  label: string
  danger?: boolean
}

interface TextButtonProps extends ButtonProps {
  primary?: boolean
  danger?: boolean
}

interface PrimaryButtonProps extends ButtonProps {}

function Base({ href, ...props }: BaseProps) {
  if (href) {
    // `type` and `disabled` don't exist on links; a disabled link loses its href instead.
    const { type: _type, disabled, children, ...rest } = props
    return (
      <a href={disabled ? undefined : href} aria-disabled={disabled || undefined} {...(rest as ComponentProps<'a'>)}>
        {children}
      </a>
    )
  }
  return <button {...props} />
}

export function IconButton({ icon, size = 22, label, danger, ...props }: IconButtonProps) {
  return (
    <Base className={cx(s.icon, danger && s.danger)} aria-label={label} {...props}>
      <Icon name={icon} size={size} />
    </Base>
  )
}

export function TextButton({ primary, danger, ...props }: TextButtonProps) {
  return <Base className={cx(s.text, primary && s.primary, danger && s.danger)} {...props} />
}

export function PrimaryButton(props: PrimaryButtonProps) {
  return <Base className={s.solid} {...props} />
}
