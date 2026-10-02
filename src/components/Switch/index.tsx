import s from './index.module.css'

interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
}

export function Switch({ checked, onChange }: SwitchProps) {
  return <input type="checkbox" className={s.switch} checked={checked} onChange={(e) => onChange(e.target.checked)} />
}
