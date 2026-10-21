import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../api-base-url';
import { AuthSession, LoginCredentials, LoginResponse } from './auth.models';

/** Endpoint paths relative to `API_BASE_URL`. */
export const AUTH_ENDPOINTS = {
  login: '/auth/login',
} as const;

const STORAGE_KEY = 'i-bank.session';

// setTimeout fires immediately for delays above 2^31 - 1 ms (about 24.8 days).
const MAX_TIMER_DELAY = 2_147_483_647;

/** Signs the customer in and out, and keeps the session for the lifetime of the browser tab. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly currentSession = signal<AuthSession | null>(null);
  readonly session = this.currentSession.asReadonly();
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.setSession(restoreSession());
  }

  isAuthenticated(): boolean {
    const session = this.session();
    return session !== null && session.expiresAt > Date.now();
  }

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}${AUTH_ENDPOINTS.login}`, credentials)
      .pipe(
        map(({ token, expiresIn, customer }): AuthSession => ({
          token,
          expiresAt: Date.now() + expiresIn * 1000,
          customer,
        })),
        tap((session) => this.setSession(session)),
      );
  }

  logout(): void {
    this.setSession(null);
  }

  /**
   * Ends a session that is no longer valid (it expired, or the API rejected the token) and sends
   * the customer to the login page, returning them to where they were once they sign in again.
   */
  expire(): void {
    this.logout();
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private setSession(session: AuthSession | null): void {
    this.currentSession.set(session);
    writeStorage(session && JSON.stringify(session));

    // Sign out when the token expires, so account details don't stay on screen afterwards.
    clearTimeout(this.expiryTimer);
    this.expiryTimer = session
      ? setTimeout(() => this.expire(), Math.min(session.expiresAt - Date.now(), MAX_TIMER_DELAY))
      : undefined;
  }
}

function restoreSession(): AuthSession | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const session = stored ? (JSON.parse(stored) as AuthSession) : null;
    return session && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

// Session storage is cleared when the tab closes, so a shared computer doesn't stay signed in.
function writeStorage(value: string | null): void {
  try {
    if (value === null) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // Storage can be unavailable (e.g. private browsing); the session then lasts until reload.
  }
}
