export type CacheEntry<T> = {
  value: T
  ts: number
}

export function getCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as CacheEntry<T>
  } catch {
    return null
  }
}

export function setCache<T>(key: string, value: T) {
  try {
    const entry: CacheEntry<T> = { value, ts: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {}
}

export function invalidateCache(key: string) {
  try { localStorage.removeItem(key) } catch {}
}

export function isStale(key: string, maxAgeMs: number) {
  const e = getCache<unknown>(key)
  if (!e) return true
  return Date.now() - e.ts > maxAgeMs
}
