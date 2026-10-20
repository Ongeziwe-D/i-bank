import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { API_BASE_URL } from '../api-base-url';
import { AUTH_ENDPOINTS } from './auth.service';
import { LoginCredentials, LoginResponse } from './auth.models';

/** The only account the development backend accepts. */
const DEMO_ACCOUNT = {
  email: 'john.doe@email.com',
  password: 'Password123!',
  customer: { customerId: '12345', name: 'John Doe', email: 'john.doe@email.com' },
};

/**
 * Development-only stand-in for the login endpoint. Accepts the demo account
 * and rejects anything else with 401. Other requests pass through.
 */
export const mockAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'POST' || req.url !== `${inject(API_BASE_URL)}${AUTH_ENDPOINTS.login}`) {
    return next(req);
  }

  const { email, password } = req.body as LoginCredentials;
  const valid =
    email.trim().toLowerCase() === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password;

  return timer(500).pipe(
    switchMap(() =>
      valid
        ? of(
            new HttpResponse<LoginResponse>({
              status: HttpStatusCode.Ok,
              body: {
                token: crypto.randomUUID(),
                expiresIn: 3600,
                customer: DEMO_ACCOUNT.customer,
              },
            }),
          )
        : throwError(
            () =>
              new HttpErrorResponse({
                status: HttpStatusCode.Unauthorized,
                statusText: 'Unauthorized',
                url: req.url,
                error: { message: 'Invalid email or password.' },
              }),
          ),
    ),
  );
};
