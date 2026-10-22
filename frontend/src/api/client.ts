const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  code: string;
  details?: Array<{ field: string; message: string }>;
  status: number;
  data?: any;

  constructor(message: string, status: number, code: string = 'API_ERROR', details?: any, data?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.data = data;
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = data.error || {};
      throw new ApiError(
        err.message || `Request failed with status ${res.status}`,
        res.status,
        err.code || 'UNKNOWN_ERROR',
        err.details,
        data
      );
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network connection failed. Please check your backend connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}
