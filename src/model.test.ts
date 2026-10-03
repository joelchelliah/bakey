import { describe, expect, it } from 'vitest'
import { normalizeRecipe, normalizeRecipes, parseBackup } from './model'
import { starterRecipes } from './seed'

describe('normalizeRecipe', () => {
  it('leaves valid recipes unchanged', () => {
    for (const r of starterRecipes()) expect(normalizeRecipe(structuredClone(r))).toEqual(r)
  })

  it('rejects anything without an id', () => {
    expect(normalizeRecipe(null)).toBeNull()
    expect(normalizeRecipe('junk')).toBeNull()
    expect(normalizeRecipe({ name: 'No id' })).toBeNull()
  })

  it('fills missing fields and gives a recipe without variants the default one', () => {
    const r = normalizeRecipe({ id: 'a' })
    expect(r).toMatchObject({ id: 'a', name: '', category: 'other', mode: 'total', setAsides: [], notes: '' })
    expect(r?.variants).toHaveLength(1)
    expect(r?.updatedAt).toBe(new Date(0).toISOString())
  })

  it('replaces invalid values and drops broken list items', () => {
    const r = normalizeRecipe({
      id: 'a',
      mode: 'nope',
      category: 'cake',
      totalWeight: 'heavy',
      setAsides: [null, { label: 'Baby', weight: 165 }],
      variants: [
        {
          id: 'v',
          sections: [{ id: 's', ingredients: [null, { name: 'Water', group: 'gas', amount: 'bad' }] }],
        },
      ],
    })
    expect(r).toMatchObject({ mode: 'total', category: 'other', totalWeight: 1000 })
    expect(r?.setAsides).toEqual([{ id: expect.any(String), label: 'Baby', weight: 165 }])
    expect(r?.variants[0]?.sections[0]?.ingredients).toEqual([
      { id: expect.any(String), name: 'Water', group: 'other', amount: { kind: 'percent', value: 0 } },
    ])
  })

  it('keeps unknown fields, so data from a newer version survives a save', () => {
    expect(normalizeRecipe({ id: 'a', futureField: 1 })).toMatchObject({ futureField: 1 })
  })
})

describe('backups', () => {
  it('keeps the usable recipes and drops the rest', () => {
    expect(normalizeRecipes([{ id: 'a' }, 42, { name: 'no id' }]).map((r) => r.id)).toEqual(['a'])
    expect(normalizeRecipes('not a list')).toEqual([])
  })

  it('reads an export or a bare array, and rejects files without recipes', () => {
    expect(parseBackup(JSON.stringify({ app: 'bakey', recipes: [{ id: 'a' }] }))).toHaveLength(1)
    expect(parseBackup(JSON.stringify([{ id: 'a' }]))).toHaveLength(1)
    expect(() => parseBackup('{"hello": 1}')).toThrow('Not a Bakey export')
    expect(() => parseBackup('not json')).toThrow(/JSON/)
  })
})
