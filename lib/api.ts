/**
 * Client API pour SalaireDirect Frontend
 * Connecté au backend NestJS (http://localhost:3000/api/v1)
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface FetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, params, headers, ...customOptions } = options;

  // Récupérer le token stocké (localStorage côté navigateur) ou le token fourni
  let authToken = token;
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('token') || localStorage.getItem('supabase_token') || undefined;
  }

  // Construction de l'URL avec query parameters
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${API_BASE_URL}${cleanEndpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      headers: defaultHeaders,
      ...customOptions,
    });

    if (!response.ok) {
      let errorMessage = 'Une erreur est survenue lors de la communication avec le serveur.';
      let errorData: any = null;

      try {
        errorData = await response.json();
        if (errorData) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } catch {
        errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
      }

      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Gestion des réponses sans contenu (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Erreur de connexion réseau (ex: serveur non démarré ou coupure mobile)
    throw new ApiError(
      error?.message === 'Failed to fetch'
        ? 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur le port 3000.'
        : error?.message || 'Erreur réseau inattendue',
      0,
    );
  }
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, data?: any, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, data?: any, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { method: 'DELETE', ...options }),

  download: async (endpoint: string, filename: string, options?: FetchOptions) => {
    const { token, headers, ...customOptions } = options || {};

    let authToken = token;
    if (!authToken && typeof window !== 'undefined') {
      authToken = localStorage.getItem('token') || localStorage.getItem('supabase_token') || undefined;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${API_BASE_URL}${cleanEndpoint}`;

    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const defaultHeaders: Record<string, string> = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        headers: defaultHeaders,
        ...customOptions,
      });

      if (!response.ok) {
        throw new ApiError(`Erreur de téléchargement: ${response.statusText}`, response.status);
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error?.message === 'Failed to fetch'
          ? 'Impossible de contacter le serveur.'
          : error?.message || 'Erreur de téléchargement',
        0,
      );
    }
  },
};
