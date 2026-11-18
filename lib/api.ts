/**
 * Client API de SalaireDirect (backend NestJS hébergé sur Render).
 * Le jeton d'accès Supabase de la session en cours est envoyé à chaque requête.
 */
import { supabase } from '@/lib/supabase'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, '')

/** Render (offre gratuite) peut mettre ~1 minute à se réveiller après une période d'inactivité. */
const REQUEST_TIMEOUT_MS = 60_000

type QueryParams = Record<string, string | number | boolean | undefined | null>

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  token?: string
  params?: QueryParams
}

export class ApiError extends Error {
  statusCode: number
  data: unknown

  constructor(message: string, statusCode = 500, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.data = data
  }
}

async function getAccessToken(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit
  if (typeof window === 'undefined') return undefined
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
}

function buildUrl(endpoint: string, params?: QueryParams): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, String(value))
  })
  const query = search.toString()
  return `${API_BASE_URL}${path}${query ? `?${query}` : ''}`
}

function networkError(error: unknown): ApiError {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError(
      'Le serveur met plus de temps que prévu à répondre (il est peut-être en cours de démarrage). Réessayez dans quelques instants.',
      0
    )
  }
  const hint =
    process.env.NODE_ENV === 'development'
      ? ` (API : ${API_BASE_URL})`
      : ''
  return new ApiError(`Impossible de contacter le serveur. Vérifiez votre connexion internet puis réessayez.${hint}`, 0)
}

async function request(endpoint: string, options: FetchOptions & { body?: BodyInit | null } = {}): Promise<Response> {
  const { token, params, headers, ...init } = options
  const accessToken = await getAccessToken(token)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(buildUrl(endpoint, params), {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(headers as Record<string, string> | undefined),
      },
    })
  } catch (error) {
    throw networkError(error)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    let message = `Erreur ${response.status}. Veuillez réessayer.`
    let data: unknown = null
    try {
      data = await response.json()
      const body = data as { message?: string | string[]; error?: string } | null
      if (Array.isArray(body?.message)) message = body.message.join(', ')
      else if (body?.message) message = body.message
      else if (body?.error) message = body.error
    } catch {
      /* corps non JSON : on garde le message générique */
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      message = 'Votre session a expiré. Veuillez vous reconnecter.'
      await supabase.auth.signOut()
      const redirect = encodeURIComponent(window.location.pathname)
      // Rechargement complet volontaire : réinitialise tout l'état de l'application après expiration de session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/auth/login?redirect=${redirect}`)
    }
    throw new ApiError(message, response.status, data)
  }

  return response
}

async function fetchApi<T>(endpoint: string, options: FetchOptions & { body?: BodyInit | null } = {}): Promise<T> {
  const response = await request(endpoint, options)
  if (response.status === 204) return {} as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) => fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) => fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),

  /** Télécharge un fichier (ex. PDF) renvoyé par l'API. */
  download: async (endpoint: string, filename: string, options?: FetchOptions) => {
    const response = await request(endpoint, { ...options, method: 'GET', headers: { Accept: '*/*', ...(options?.headers as Record<string, string> | undefined) } })
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
}
