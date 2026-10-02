import s from './index.module.css'

interface SectionTitleProps {
  children: React.ReactNode
}

export function SectionTitle({ children }: SectionTitleProps) {
  return <h2 className={s.title}>{children}</h2>
}
