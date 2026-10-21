import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../api-base-url';
import { AuthService } from './auth.service';

/**
 * Adds the session token to API requests. If the API rejects the token,
 * the customer is signed out and sent back to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(inject(API_BASE_URL))) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.session()?.token;
  const authorized = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      // Only the first rejected request for this token signs out; parallel ones skip it.
      if (
        error instanceof HttpErrorResponse &&
        error.status === HttpStatusCode.Unauthorized &&
        token &&
        auth.session()?.token === token
      ) {
        auth.expire();
      }
      return throwError(() => error);
    }),
  );
};
