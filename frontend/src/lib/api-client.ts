import { ApiError, AuthTokens } from '@/types';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

export function setTokens(tokens: AuthTokens) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', tokens.refreshToken);
    Cookies.set('refreshToken', tokens.refreshToken, { expires: 7 });
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refreshToken');
    Cookies.remove('refreshToken');
  }
}

export function getAccessToken() {
  return accessToken;
}

export function loadRefreshToken() {
  if (typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('refreshToken');
  }
}

async function attemptRefresh(): Promise<string> {
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  setTokens(data);
  return data.accessToken;
}

async function getValidToken(): Promise<string> {
  if (accessToken) return accessToken;

  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const token = await attemptRefresh();
    refreshQueue.forEach((resolve) => resolve(token));
    refreshQueue = [];
    return token;
  } finally {
    isRefreshing = false;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await getValidToken().catch(() => null);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const isLoginRequest = endpoint === '/auth/login';

  if (res.status === 401 && retry && !isLoginRequest) {
    accessToken = null;
    await getValidToken().catch(() => null);
    return request<T>(endpoint, options, false);
  }

  if (res.status === 403) {
    window.location.href = '/unauthorized';
    throw new Error('Forbidden');
  }

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      statusCode: res.status,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: endpoint,
    }));
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return request<T>(url);
  },
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  upload: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, { method: 'POST', body: formData }),
  download: async (endpoint: string, onProgress?: (progress: number) => void): Promise<Blob> => {
    // We cannot use the standard request() wrapper because it enforces res.json()
    // We manually fetch the token and return the blob directly.
    const token = await getValidToken().catch(() => null);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${endpoint}`, { headers });
    if (!res.ok) throw new Error('Failed to download file');

    if (onProgress && res.body) {
      const contentLength = res.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedLength += value.length;
          if (total) {
            onProgress(Math.round((receivedLength / total) * 100));
          }
        }
      }
      return new Blob(chunks as BlobPart[], { type: res.headers.get('content-type') || 'application/octet-stream' });
    }

    return res.blob();
  },
};
