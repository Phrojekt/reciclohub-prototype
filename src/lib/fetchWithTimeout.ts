// Small wrapper around fetch that supports timeout, retries and JSON parsing
export type FetchOptions = RequestInit & { timeout?: number, retries?: number }

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchWithTimeout(input: RequestInfo, init?: FetchOptions): Promise<Response> {
  const timeout = init?.timeout ?? 8000
  const retries = init?.retries ?? 1
  let lastError: unknown
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const res = await fetch(input, { ...init, signal: controller.signal })
      clearTimeout(id)
      if (!res.ok) throw res
      return res
    } catch (err) {
      lastError = err
      clearTimeout(id)
      // If aborted due to timeout or network error, retry after small backoff
      if (attempt < retries - 1) await delay(200 * (attempt + 1))
    }
  }
  throw lastError
}

export async function fetchJsonWithTimeout<T = unknown>(input: RequestInfo, init?: FetchOptions): Promise<T> {
  const res = await fetchWithTimeout(input, init)
  return res.json() as Promise<T>
}
