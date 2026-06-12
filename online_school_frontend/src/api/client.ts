// ─── Base API client ──────────────────────────────────────────────────────────
// تمام درخواست‌ها از اینجا می‌گذرند.
// توکن JWT از localStorage خوانده می‌شود و به هدر Authorization اضافه می‌شه.

export const API_BASE = 'http://localhost:8000';
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

export function saveToken(token: string) {
  localStorage.setItem('access_token', token);
}

export function clearToken() {
  localStorage.removeItem('access_token');
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number | boolean | null | undefined>;
  noAuth?: boolean;
  isFormData?: boolean;
};

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, noAuth = false, isFormData = false } = options;

  // Build URL with query params
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  
  // فقط برای درخواست‌های غیر FormData هدر Content-Type رو تنظیم کن
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (!noAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    redirect: 'follow',
  };

  if (body != null) {
    if (isFormData && body instanceof URLSearchParams) {
      fetchOptions.body = body;
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  const res = await fetch(url, fetchOptions);

  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail ?? detail;
    } catch { /* ignore */ }
    throw new ApiError(res.status, detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}