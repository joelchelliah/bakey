import s from './index.module.css'

interface TopBarProps {
  start: React.ReactNode
  title?: string
  /** Without it, a spacer keeps the title in place. */
  end?: React.ReactNode
}

/** Sticky header: a floating bar, inset from the screen edges. */
export function TopBar({ start, title, end }: TopBarProps) {
  return (
    <header className={s.bar}>
      <div className={s.inner}>
        {start}
        {title && <span className={s.title}>{title}</span>}
        {end ? <div className={s.end}>{end}</div> : <span className={s.spacer} />}
      </div>
    </header>
  )
}
