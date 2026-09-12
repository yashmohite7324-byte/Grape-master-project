import type { ApiEnvelope } from './types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
const TOKEN_KEY = 'gm_token'

export const tokenStore = {
  get: (): string | null => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  fields?: { field: string; message: string }[]
  constructor(message: string, status: number, fields?: { field: string; message: string }[]) {
    super(message); this.status = status; this.fields = fields
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  query?: Record<string, string | number | boolean | undefined>
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, auth = true, query } = opts
  const url = new URL(`${BASE_URL}${path}`)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== false) url.searchParams.set(k, String(v))
    })
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) { const t = tokenStore.get(); if (t) headers.Authorization = `Bearer ${t}` }

  let res: Response
  try {
    res = await fetch(url.toString(), { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError('Cannot reach the server. Is the API running?', 0)
  }
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>
  if (!res.ok || json.success === false) throw new ApiError(json.message ?? 'Request failed', res.status, json.errors)
  return json
}

export const api = {
  get:    <T>(path: string, query?: RequestOptions['query'], auth = true) => request<T>(path, { method: 'GET', query, auth }),
  post:   <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
