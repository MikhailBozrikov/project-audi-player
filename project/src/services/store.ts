import { ApiService } from './api';
import type { Track, User } from '../types/app.types';

type Listener = () => void;

export class Store {
  private static instance: Store;
  private api = new ApiService();
  private listeners: Listener[] = [];

  allTracks: Track[] = [];
  visibleTracks: Track[] = [];
  visibleCount = 50;
  limit = 50;
  favorites = new Set<number>();
  user: User | null = null;
  currentTrack: Track | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;

  private searchQuery = '';
  private activeSearchQuery = '';

  private constructor() {
    this.api.loadToken();
    this.restoreUserFromStorage();
  }

  static getInstance() {
    if (!Store.instance) Store.instance = new Store();
    return Store.instance;
  }

  subscribe(l: Listener) {
    this.listeners.push(l);
    return () => {
      this.listeners = this.listeners.filter(f => f !== l);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private clearAuthState() {
    this.api.clearToken();
    localStorage.removeItem('username');
    this.user = null;
    this.favorites.clear();
  }

  private isTokenValid(token: string | null): boolean {
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length < 2) return false;

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded)) as { exp?: number; username?: string };

      if (typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now()) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private restoreUserFromStorage() {
    const token = localStorage.getItem('token');

    if (!this.isTokenValid(token)) {
      this.clearAuthState();
      return;
    }

    const usernameFromStorage = localStorage.getItem('username');
    if (usernameFromStorage && token) {
      this.user = { username: usernameFromStorage, token };
      return;
    }

    if (!token) return;

    const usernameFromToken = this.extractUsernameFromToken(token);
    if (usernameFromToken) {
      this.user = { username: usernameFromToken, token };
    }
  }

  private extractUsernameFromToken(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;

      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = JSON.parse(atob(padded));

      return typeof decoded.username === 'string' ? decoded.username : null;
    } catch {
      return null;
    }
  }

  hasToken() {
    const token = localStorage.getItem('token');
    if (!this.isTokenValid(token)) {
      this.clearAuthState();
      return false;
    }
    return true;
  }

  getSearchQuery() {
    return this.searchQuery;
  }

  getActiveSearchQuery() {
    return this.activeSearchQuery;
  }

  private hasMatchForQuery(query: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;

    return this.allTracks.some(track =>
      track.title.toLowerCase().startsWith(normalized)
    );
  }

  setSearchQuery(query: string) {
    const normalized = query.trim().toLowerCase();

    this.searchQuery = query;

    if (!normalized) {
      this.activeSearchQuery = '';
      this.visibleCount = this.limit;
      this.updateVisible();
      this.notify();
      return;
    }

    if (this.hasMatchForQuery(normalized)) {
      this.activeSearchQuery = normalized;
      this.visibleCount = this.limit;
      this.updateVisible();
      this.notify();
      return;
    }

    this.notify();
  }

  clearSearch() {
    this.searchQuery = '';
    this.activeSearchQuery = '';
    this.visibleCount = this.limit;
    this.updateVisible();
    this.notify();
  }

  filterTracks<T extends Track>(tracks: T[]) {
    const query = this.activeSearchQuery.trim().toLowerCase();

    if (!query) return tracks;

    return tracks.filter(track =>
      track.title.toLowerCase().startsWith(query)
    );
  }

  async login(username: string, password: string) {
    const { token } = await this.api.login(username, password);
    this.api.setToken(token);
    localStorage.setItem('username', username);
    this.user = { username, token };
    this.notify();
    await this.loadFavorites();
  }

  async register(username: string, password: string) {
    return this.api.register(username, password);
  }

  logout() {
    this.api.clearToken();
    localStorage.removeItem('username');
    this.user = null;
    this.favorites.clear();
    this.currentTrack = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 0;
    this.notify();
  }

  async loadTracks() {
    const tracks = await this.api.getTracks();
    this.allTracks = tracks.map(t => ({ ...t, id: Number(t.id) }));
    this.visibleCount = this.limit;
    this.updateVisible();
    this.notify();
  }

  private updateVisible() {
    const query = this.activeSearchQuery.trim().toLowerCase();

    if (query) {
      this.visibleTracks = this.allTracks.filter(track =>
        track.title.toLowerCase().startsWith(query)
      );
      return;
    }

    this.visibleTracks = this.allTracks.slice(0, this.visibleCount);
  }

  loadMore() {
    if (this.activeSearchQuery.trim()) return;

    if (this.visibleCount < this.allTracks.length) {
      this.visibleCount = Math.min(this.visibleCount + this.limit, this.allTracks.length);
      this.updateVisible();
      this.notify();
    }
  }

  async loadFavorites() {
    if (!this.hasToken()) return;

    try {
      const favs = await this.api.getFavorites();
      this.favorites = new Set(favs.map(t => Number(t.id)));
      this.notify();
    } catch (error) {
      const status = (error as Error & { status?: number }).status;

      if (status === 400 || status === 401 || status === 403) {
        this.clearAuthState();
        this.notify();
        return;
      }

      throw error;
    }
  }

  async toggleFavorite(id: number) {
    if (!this.hasToken()) return;

    if (this.favorites.has(id)) {
      await this.api.removeFavorite(id);
    } else {
      await this.api.addFavorite(id);
    }

    await this.loadFavorites();
  }

  setCurrentTrack(track: Track | null) {
    this.currentTrack = track;
    this.notify();
  }

  updatePlayback(playing: boolean, time: number, duration: number) {
    this.isPlaying = playing;
    this.currentTime = time;
    this.duration = duration;
    this.notify();
  }
}
