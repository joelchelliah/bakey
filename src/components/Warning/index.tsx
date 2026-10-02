import s from './index.module.css'

interface WarningProps {
  children: React.ReactNode
}

export function Warning({ children }: WarningProps) {
  return <div className={s.warning}>{children}</div>
}
