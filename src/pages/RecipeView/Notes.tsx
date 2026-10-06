import { Fragment } from 'react'
import { parseMarkdown, type Inline } from './markdown'
import s from './Notes.module.css'

interface NotesProps {
  /** The recipe's notes, as Markdown. */
  text: string
}

// The headings sit under the card's own h2, so `#` renders as h3.
const headings = { 1: 'h3', 2: 'h4', 3: 'h5' } as const

/** Recipe notes rendered from the small Markdown subset in `markdown.ts`. */
export function Notes({ text }: NotesProps) {
  // The parsed nodes have no ids and never reorder, so their position is the key throughout.
  return parseMarkdown(text).map((block, i) => {
    if (block.type === 'paragraph')
      return (
        // oxlint-disable-next-line react/no-array-index-key -- static parsed content
        <p key={i} className={s.p}>
          <Inlines nodes={block.content} />
        </p>
      )
    if (block.type === 'heading') {
      const H = headings[block.level]
      return (
        // oxlint-disable-next-line react/no-array-index-key -- static parsed content
        <H key={i} className={s[H]}>
          <Inlines nodes={block.content} />
        </H>
      )
    }
    const items = block.items.map((item, j) => (
      // oxlint-disable-next-line react/no-array-index-key -- static parsed content
      <li key={j}>
        <Inlines nodes={item} />
      </li>
    ))
    return block.ordered ? (
      // oxlint-disable-next-line react/no-array-index-key -- static parsed content
      <ol key={i} className={s.list} start={block.start}>
        {items}
      </ol>
    ) : (
      // oxlint-disable-next-line react/no-array-index-key -- static parsed content
      <ul key={i} className={s.list}>
        {items}
      </ul>
    )
  })
}

interface InlinesProps {
  nodes: Inline[]
}

function Inlines({ nodes }: InlinesProps) {
  return nodes.map((node, i) => (
    // oxlint-disable-next-line react/no-array-index-key -- static parsed content
    <Fragment key={i}>
      {node.type === 'text' ? (
        node.text
      ) : node.type === 'br' ? (
        <br />
      ) : node.type === 'code' ? (
        <code className={s.code}>{node.text}</code>
      ) : node.type === 'bold' ? (
        <strong className={s.em}>
          <Inlines nodes={node.children} />
        </strong>
      ) : (
        <em className={s.em}>
          <Inlines nodes={node.children} />
        </em>
      )}
    </Fragment>
  ))
}
