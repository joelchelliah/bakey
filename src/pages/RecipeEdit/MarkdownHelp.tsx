import { useRef } from 'react'
import { IconButton } from '../../components/Button'
import { Icon } from '../../components/Icon'
import s from './MarkdownHelp.module.css'

// What `RecipeView/markdown.ts` supports: the syntax as typed, and how it looks.
const rows: { syntax: string; result: React.ReactNode }[] = [
  { syntax: '# Heading', result: <span className={s.h1}>Heading</span> },
  { syntax: '## Smaller', result: <span className={s.h2}>Smaller</span> },
  { syntax: '### Smallest', result: <span className={s.h3}>Smallest</span> },
  { syntax: '**bold**', result: <strong className={s.em}>bold</strong> },
  { syntax: '*italic*', result: <em className={s.em}>italic</em> },
  {
    syntax: '***both***',
    result: (
      <strong className={s.em}>
        <em>both</em>
      </strong>
    ),
  },
  { syntax: '`code`', result: <code className={s.code}>code</code> },
  { syntax: '- item', result: <span>• item</span> },
  { syntax: '1. item', result: <span>1. item</span> },
]

/** A ? button that explains the Markdown the notes support. */
export function MarkdownHelp() {
  const ref = useRef<HTMLDialogElement>(null)
  const close = () => ref.current?.close()

  return (
    <>
      <button type="button" className={s.open} aria-label="Formatting help" onClick={() => ref.current?.showModal()}>
        <Icon name="help" size={14} />
      </button>
      {/* A tap on the backdrop lands on the dialog itself, so it closes. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- Escape already closes a dialog */}
      <dialog ref={ref} className={s.dialog} onClick={(e) => e.target === e.currentTarget && close()}>
        <div className={s.body}>
          <div className={s.head}>
            <h3>Formatting</h3>
            <IconButton icon="x" size={20} label="Close" onClick={close} />
          </div>
          <dl className={s.rows}>
            {rows.map(({ syntax, result }) => (
              <div key={syntax} className={s.row}>
                <dt className={s.syntax}>{syntax}</dt>
                <dd>{result}</dd>
              </div>
            ))}
          </dl>
          <p className={s.foot}>
            A new line is a line break.
            <br />A blank line starts a new paragraph.
          </p>
        </div>
      </dialog>
    </>
  )
}
