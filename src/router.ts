import { useEffect, useState } from 'react'

export type Route =
  | { name: 'list' }
  | { name: 'view'; id: string }
  | { name: 'edit'; id: string }
  | { name: 'new' }
  | { name: 'settings' }

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'r' && parts[1])
    return parts[2] === 'edit' ? { name: 'edit', id: parts[1] } : { name: 'view', id: parts[1] }
  if (parts[0] === 'new') return { name: 'new' }
  if (parts[0] === 'settings') return { name: 'settings' }
  return { name: 'list' }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'list':
      return '#/'
    case 'view':
      return `#/r/${r.id}`
    case 'edit':
      return `#/r/${r.id}/edit`
    case 'new':
      return '#/new'
    case 'settings':
      return '#/settings'
  }
}

export function go(r: Route, replace = false) {
  if (replace) location.replace(href(r))
  else location.hash = href(r)
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parse(location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
