import { useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefCallback } from 'react'
import { flushSync } from 'react-dom'

export interface DragList {
  id: string
  /** Item ids in display order. */
  items: string[]
}

export interface DragSort {
  /** Id of the item being dragged. */
  dragging: string | null
  /** Ref for an item's element. */
  item: (id: string) => RefCallback<HTMLElement>
  /** Ref for a list's container. Its leading edge is where a dragged item crosses into that list. */
  list: (id: string) => RefCallback<HTMLElement>
  /** Pointer-down handler for an item's grip. */
  start: (e: ReactPointerEvent, id: string) => void
}

/** Distance from the top or bottom of the screen where a vertical drag scrolls the page, and its speed per frame. */
const EDGE = 60
const SPEED = 10

/** A ref that keeps `map[id]` pointing at the element. */
const register =
  (map: Map<string, HTMLElement>, id: string): RefCallback<HTMLElement> =>
  (el) => {
    if (!el) return
    map.set(id, el)
    return () => {
      if (map.get(id) === el) map.delete(id)
    }
  }

/**
 * Drag to reorder along one axis, within and between lists. The dragged item follows the pointer, and `onPlace` is
 * called with the list and index (among the other items) to move it to whenever its centre passes another item's.
 */
export function useDragSort(
  axis: 'x' | 'y',
  lists: DragList[],
  onPlace: (id: string, list: string, index: number) => void,
): DragSort {
  const items = useRef(new Map<string, HTMLElement>())
  const boxes = useRef(new Map<string, HTMLElement>())
  const latest = useRef({ lists, onPlace })
  const [dragging, setDragging] = useState<string | null>(null)

  // Runs inside flushSync too, so the next step of a drag sees the order it just caused.
  useLayoutEffect(() => {
    latest.current = { lists, onPlace }
  })

  const start = (e: ReactPointerEvent, id: string) => {
    let el = items.current.get(id)
    if (!el) return
    e.preventDefault()

    const pos = (ev: { clientX: number; clientY: number }) => (axis === 'x' ? ev.clientX : ev.clientY)
    const lead = (r: DOMRect) => (axis === 'x' ? r.left : r.top)
    const mid = (r: DOMRect) => (axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2)
    const grip = e.currentTarget
    const grab = pos(e) - lead(el.getBoundingClientRect())
    const origin = pos(e)
    let pointer = origin
    let frame = 0

    const slot = (centre: number) => {
      const all = latest.current.lists
      for (const [li, list] of all.entries()) {
        const others = list.items.filter((x) => x !== id)
        for (const [index, other] of others.entries()) {
          const o = items.current.get(other)
          if (o && centre < mid(o.getBoundingClientRect())) return { list: list.id, index }
        }
        const next = all[li + 1]
        const box = next && boxes.current.get(next.id)
        if (!next || (box && centre < lead(box.getBoundingClientRect()))) return { list: list.id, index: others.length }
      }
      return null
    }

    const update = () => {
      if (!el) return
      el.style.transform = ''
      const at = pointer - grab
      const to = slot(at + (axis === 'x' ? el.offsetWidth : el.offsetHeight) / 2)
      const from = latest.current.lists.find((l) => l.items.includes(id))
      if (to && from && (to.list !== from.id || to.index !== from.items.indexOf(id))) {
        flushSync(() => latest.current.onPlace(id, to.list, to.index))
        // Moving to another list remounts the item
        el = items.current.get(id) ?? el
      }
      el.style.transform = `translate${axis.toUpperCase()}(${at - lead(el.getBoundingClientRect())}px)`
    }

    const tick = () => {
      // Only towards an edge, so grabbing an item close to one doesn't scroll straight away
      const dy =
        pointer < EDGE && pointer < origin ? -SPEED : pointer > innerHeight - EDGE && pointer > origin ? SPEED : 0
      if (dy) {
        scrollBy(0, dy)
        update()
      }
      frame = requestAnimationFrame(tick)
    }

    const move = (ev: Event) => {
      pointer = pos(ev as PointerEvent)
      update()
    }
    // Also listen on the grip itself: iOS keeps sending a touch to its original node, even once that is detached.
    const targets = [window, grip]
    const end = () => {
      cancelAnimationFrame(frame)
      for (const t of targets) {
        t.removeEventListener('pointermove', move)
        t.removeEventListener('pointerup', end)
        t.removeEventListener('pointercancel', end)
      }
      if (el) el.style.transform = ''
      setDragging(null)
    }

    for (const t of targets) {
      t.addEventListener('pointermove', move)
      t.addEventListener('pointerup', end)
      t.addEventListener('pointercancel', end)
    }
    if (axis === 'y') frame = requestAnimationFrame(tick)
    setDragging(id)
  }

  return {
    dragging,
    item: (id) => register(items.current, id),
    list: (id) => register(boxes.current, id),
    start,
  }
}
