const paths = {
  back: 'M15 18l-6-6 6-6',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  check: 'M20 6L9 17l-5-5',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  x: 'M18 6L6 18M6 6l12 12',
} as const

export type IconName = keyof typeof paths

interface IconProps {
  name: IconName
  size?: number
}

export function Icon({ name, size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  )
}
