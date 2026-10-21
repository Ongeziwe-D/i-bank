import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { devInterceptors } from './core/dev-interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // The auth interceptor runs first so the dev-only sample data sees the same requests
    // the real API would. Production builds call the real API.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, ...devInterceptors])),
    // Matches the self-hosted icon font declared in styles.scss.
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
