export function uid(): string {
  return crypto.randomUUID()
}

export function clone<T>(x: T): T {
  return structuredClone(x)
}
