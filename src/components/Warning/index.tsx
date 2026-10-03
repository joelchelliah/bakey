import s from './index.module.css'

interface WarningProps {
  children: React.ReactNode
}

export function Warning({ children }: WarningProps) {
  return <div className={s.warning}>{children}</div>
}

interface WarningListProps {
  messages: string[]
}

/** One warning box with a line per message; renders nothing when there are none. */
export function WarningList({ messages }: WarningListProps) {
  if (!messages.length) return null
  return (
    <Warning>
      {messages.map((m) => (
        <div key={m}>⚠️ {m}</div>
      ))}
    </Warning>
  )
}
