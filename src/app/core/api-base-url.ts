import { InjectionToken } from '@angular/core';

/** Base URL that all backend endpoints are resolved against. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
