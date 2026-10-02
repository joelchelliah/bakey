import type { ComponentProps } from 'react'
import { cx } from '../../util'
import { Icon, type IconName } from '../Icon'
import s from './index.module.css'

interface ButtonProps extends Omit<ComponentProps<'button'>, 'className'> {
  /** Renders a link instead of a button. */
  href?: string
}

interface BaseProps extends ButtonProps {
  className: string
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

function Base({ href, className, ...props }: BaseProps) {
  if (href)
    return (
      <a href={href} className={className} aria-label={props['aria-label']}>
        {props.children}
      </a>
    )
  return <button className={className} {...props} />
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
