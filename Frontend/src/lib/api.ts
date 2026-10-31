const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export function getToken() { return localStorage.getItem('campuslink_token') }
export function saveToken(token: string) { localStorage.setItem('campuslink_token', token) }
export function clearToken() { localStorage.removeItem('campuslink_token') }

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`)
    ;(error as any).status = response.status
    ;(error as any).data = data
    throw error
  }
  return data as T
}
