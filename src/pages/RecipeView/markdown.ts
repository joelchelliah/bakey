/**
 * A deliberately small Markdown subset for recipe notes: paragraphs, `#`–`###` headings, `-`/`*`/`+` and `1.` lists,
 * plus inline `**bold**`, `*italic*`, `***both***` and `` `code` ``. A single newline is a line break; a blank line
 * starts a new paragraph. Anything else is shown as plain text.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'bold' | 'italic'; children: Inline[] }
  | { type: 'br' }

export type Block =
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'heading'; level: 1 | 2 | 3; content: Inline[] }
  | { type: 'list'; ordered: boolean; start: number; items: Inline[][] }

const heading = /^(#{1,3})\s+(.*)$/
const bullet = /^\s*[-*+]\s+(.*)$/
const numbered = /^\s*(\d{1,9})[.)]\s+(.*)$/

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let list: Extract<Block, { type: 'list' }> | undefined

  const flush = () => {
    if (para.length) blocks.push({ type: 'paragraph', content: parseLines(para) })
    para = []
    list = undefined
  }
  const addItem = (ordered: boolean, start: number, text: string) => {
    if (list?.ordered !== ordered) {
      flush()
      list = { type: 'list', ordered, start, items: [] }
      blocks.push(list)
    }
    list.items.push(parseInline(text.trim()))
  }

  for (const line of src.replace(/\r\n?/g, '\n').split('\n')) {
    let m: RegExpExecArray | null
    if (!line.trim()) flush()
    else if ((m = heading.exec(line))) {
      flush()
      blocks.push({
        type: 'heading',
        level: (m[1] ?? '#').length as 1 | 2 | 3,
        content: parseInline((m[2] ?? '').trim()),
      })
    } else if ((m = bullet.exec(line))) addItem(false, 1, m[1] ?? '')
    else if ((m = numbered.exec(line))) addItem(true, Number(m[1]), m[2] ?? '')
    else {
      list = undefined
      para.push(line.trimEnd())
    }
  }
  flush()
  return blocks
}

/** Lines of one paragraph, joined by line breaks. Emphasis never spans lines. */
function parseLines(lines: string[]): Inline[] {
  return lines.flatMap((line, i) => (i ? [{ type: 'br' } as const, ...parseInline(line)] : parseInline(line)))
}

// Emphasis must hug its content (`* a *` stays literal), and `_` only counts outside words (snake_case stays literal).
const patterns: { re: RegExp; make: (inner: string) => Inline }[] = [
  { re: /`([^`]+)`/, make: (text) => ({ type: 'code', text }) },
  {
    re: /\*\*\*(?=\S)(.+?)(?<=\S)\*\*\*/,
    make: (inner) => ({ type: 'bold', children: [{ type: 'italic', children: parseInline(inner) }] }),
  },
  { re: /\*\*(?=\S)(.+?)(?<=\S)\*\*/, make: (inner) => ({ type: 'bold', children: parseInline(inner) }) },
  { re: /(?<!\w)__(?=\S)(.+?)(?<=\S)__(?!\w)/, make: (inner) => ({ type: 'bold', children: parseInline(inner) }) },
  { re: /\*(?=\S)(.+?)(?<=\S)\*/, make: (inner) => ({ type: 'italic', children: parseInline(inner) }) },
  { re: /(?<!\w)_(?=\S)(.+?)(?<=\S)_(?!\w)/, make: (inner) => ({ type: 'italic', children: parseInline(inner) }) },
]

export function parseInline(text: string): Inline[] {
  // The earliest match wins; on a tie, the pattern listed first (code, then the longer delimiter).
  let best: { index: number; length: number; node: Inline } | undefined
  for (const { re, make } of patterns) {
    const m = re.exec(text)
    if (m && (!best || m.index < best.index)) best = { index: m.index, length: m[0].length, node: make(m[1] ?? '') }
  }
  if (!best) return text ? [{ type: 'text', text }] : []
  const before = text.slice(0, best.index)
  return [
    ...(before ? [{ type: 'text', text: before } as const] : []),
    best.node,
    ...parseInline(text.slice(best.index + best.length)),
  ]
}
