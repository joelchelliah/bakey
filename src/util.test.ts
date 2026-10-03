import { describe, expect, it } from 'vitest'
import { placeById, swapById } from './util'

const ids = (l: { id: string }[]) => l.map((x) => x.id).join('')

describe('swapById', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('swaps with the neighbour in either direction', () => {
    expect(ids(swapById(list, 'a', 1))).toBe('bac')
    expect(ids(swapById(list, 'c', -1))).toBe('acb')
    expect(ids(list)).toBe('abc')
  })

  it('leaves the list alone at the edges or for an unknown id', () => {
    expect(swapById(list, 'a', -1)).toBe(list)
    expect(swapById(list, 'c', 1)).toBe(list)
    expect(swapById(list, 'x', 1)).toBe(list)
  })
})

describe('placeById', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('moves an item to an index counted among the others', () => {
    expect(ids(placeById(list, 'a', 2))).toBe('bca')
    expect(ids(placeById(list, 'c', 0))).toBe('cab')
    expect(ids(placeById(list, 'b', 1))).toBe('abc')
    expect(ids(list)).toBe('abc')
  })

  it('leaves the list alone for an unknown id', () => {
    expect(placeById(list, 'x', 0)).toBe(list)
  })
})
