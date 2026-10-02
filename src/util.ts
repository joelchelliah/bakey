export function uid(): string {
  return crypto.randomUUID()
}

export function clone<T>(x: T): T {
  return structuredClone(x)
}

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}
