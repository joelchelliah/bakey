import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown } from './markdown'

const text = (t: string) => ({ type: 'text', text: t })
const br = { type: 'br' }

describe('parseInline', () => {
  it('leaves plain text alone', () => {
    expect(parseInline('Bake at 250 °C')).toEqual([text('Bake at 250 °C')])
    expect(parseInline('')).toEqual([])
  })

  it('parses bold, italic and code', () => {
    expect(parseInline('a **b** *c* _d_ __e__ `f`')).toEqual([
      text('a '),
      { type: 'bold', children: [text('b')] },
      text(' '),
      { type: 'italic', children: [text('c')] },
      text(' '),
      { type: 'italic', children: [text('d')] },
      text(' '),
      { type: 'bold', children: [text('e')] },
      text(' '),
      { type: 'code', text: 'f' },
    ])
  })

  it('nests emphasis', () => {
    expect(parseInline('***x***')).toEqual([{ type: 'bold', children: [{ type: 'italic', children: [text('x')] }] }])
    expect(parseInline('**a *b* c**')).toEqual([
      { type: 'bold', children: [text('a '), { type: 'italic', children: [text('b')] }, text(' c')] },
    ])
  })

  it('does not parse inside code', () => {
    expect(parseInline('`**x**`')).toEqual([{ type: 'code', text: '**x**' }])
  })

  it('keeps unpaired or spaced markers literal', () => {
    expect(parseInline('2 * 3 * 4')).toEqual([text('2 * 3 * 4')])
    expect(parseInline('**open')).toEqual([text('**open')])
    expect(parseInline('snake_case_name')).toEqual([text('snake_case_name')])
    expect(parseInline('a ` b')).toEqual([text('a ` b')])
  })
})

describe('parseMarkdown', () => {
  it('joins single newlines with line breaks and splits paragraphs on blank lines', () => {
    expect(parseMarkdown('a\nb\n\n\nc')).toEqual([
      { type: 'paragraph', content: [text('a'), br, text('b')] },
      { type: 'paragraph', content: [text('c')] },
    ])
  })

  it('handles CRLF and surrounding blank lines', () => {
    expect(parseMarkdown('\r\n a\r\nb \r\n\r\n')).toEqual([{ type: 'paragraph', content: [text(' a'), br, text('b')] }])
    expect(parseMarkdown('  \n')).toEqual([])
  })

  it('does not let emphasis span lines', () => {
    expect(parseMarkdown('*a\nb*')).toEqual([{ type: 'paragraph', content: [text('*a'), br, text('b*')] }])
  })

  it('parses three heading levels', () => {
    expect(parseMarkdown('# A\n## *B*\n### C \n#### D\n#E')).toEqual([
      { type: 'heading', level: 1, content: [text('A')] },
      { type: 'heading', level: 2, content: [{ type: 'italic', children: [text('B')] }] },
      { type: 'heading', level: 3, content: [text('C')] },
      { type: 'paragraph', content: [text('#### D'), br, text('#E')] },
    ])
  })

  it('parses bullet lists', () => {
    expect(parseMarkdown('Pans:\n- Big: **85**\n* Crêpe\n+ Small')).toEqual([
      { type: 'paragraph', content: [text('Pans:')] },
      {
        type: 'list',
        ordered: false,
        start: 1,
        items: [[text('Big: '), { type: 'bold', children: [text('85')] }], [text('Crêpe')], [text('Small')]],
      },
    ])
  })

  it('parses numbered lists, keeping the first number', () => {
    expect(parseMarkdown('3. Mix\n4) Knead\n9. Rest')).toEqual([
      { type: 'list', ordered: true, start: 3, items: [[text('Mix')], [text('Knead')], [text('Rest')]] },
    ])
  })

  it('splits lists on a blank line, a change of kind or a plain line', () => {
    expect(parseMarkdown('- a\n\n- b\n1. c\nd\n- e').map((b) => b.type)).toEqual([
      'list',
      'list',
      'list',
      'paragraph',
      'list',
    ])
  })

  it('does not treat markers without a space as lists', () => {
    expect(parseMarkdown('-5 °C\n*hot*\n1.5 kg')).toEqual([
      {
        type: 'paragraph',
        content: [text('-5 °C'), br, { type: 'italic', children: [text('hot')] }, br, text('1.5 kg')],
      },
    ])
  })
})
