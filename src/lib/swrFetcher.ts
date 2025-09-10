import { fetchJsonWithTimeout } from './fetchWithTimeout'

export default async function swrFetcher(url: string) {
  return fetchJsonWithTimeout(url, { timeout: 8000, retries: 2 })
}
