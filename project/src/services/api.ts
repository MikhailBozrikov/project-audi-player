import type { Track } from '../types/app.types';

const BASE = '/api';

type RequestOptions = RequestInit & {
  authenticated?: boolean;
};

export class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  loadToken() {
    this.token = localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { authenticated = true, headers: requestHeaders, ...fetchOptions } = options;

    const headers = new Headers(requestHeaders || {});
    headers.set('Content-Type', 'application/json');

    if (authenticated && this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const res = await fetch(`${BASE}${endpoint}`, {
      ...fetchOptions,
      headers
    });

    if (!res.ok) {
      const error = new Error(await res.text()) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    return res.json() as Promise<T>;
  }

  register(username: string, password: string) {
    return this.request<{ message: string; user?: { username: string } }>('/register', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ username, password })
    });
  }

  login(username: string, password: string) {
    return this.request<{ message: string; token: string }>('/login', {
      method: 'POST',
      authenticated: false,
      body: JSON.stringify({ username, password })
    });
  }

  getTracks() {
    return this.request<Track[]>('/tracks');
  }

  getFavorites() {
    return this.request<Track[]>('/favorites');
  }

  addFavorite(trackId: number) {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ trackId })
    });
  }

  removeFavorite(trackId: number) {
    return this.request('/favorites', {
      method: 'DELETE',
      body: JSON.stringify({ trackId })
    });
  }
}
