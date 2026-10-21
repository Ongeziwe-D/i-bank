import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../api-base-url';
import { LoginResponse } from './auth.models';
import { AuthService } from './auth.service';

const LOGIN_RESPONSE: LoginResponse = {
  token: 'token-1',
  expiresIn: 3600,
  customer: { customerId: 'c-42', name: 'Jane Doe', email: 'jane@example.com' },
};

describe('AuthService', () => {
  let httpTesting: HttpTestingController;

  function createService(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'https://bank.example/api' },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('starts signed out', () => {
    const service = createService();
    expect(service.session()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('posts the credentials and keeps the session', () => {
    const service = createService();
    service.login({ email: 'jane@example.com', password: 'secret' }).subscribe();

    const req = httpTesting.expectOne('https://bank.example/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'jane@example.com', password: 'secret' });
    req.flush(LOGIN_RESPONSE);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.session()?.customer.customerId).toBe('c-42');
    expect(sessionStorage.getItem('i-bank.session')).toContain('token-1');
  });

  it('stays signed out when the credentials are rejected', () => {
    const service = createService();
    service.login({ email: 'jane@example.com', password: 'wrong' }).subscribe({ error: vi.fn() });

    httpTesting
      .expectOne('https://bank.example/api/auth/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(service.isAuthenticated()).toBe(false);
  });

  it('restores an unexpired session from storage', () => {
    sessionStorage.setItem(
      'i-bank.session',
      JSON.stringify({ ...LOGIN_RESPONSE, expiresAt: Date.now() + 60_000 }),
    );
    expect(createService().isAuthenticated()).toBe(true);
  });

  it('ignores an expired session in storage', () => {
    sessionStorage.setItem(
      'i-bank.session',
      JSON.stringify({ ...LOGIN_RESPONSE, expiresAt: Date.now() - 1 }),
    );
    expect(createService().session()).toBeNull();
  });

  it('clears the session on logout', () => {
    const service = createService();
    service.login({ email: 'jane@example.com', password: 'secret' }).subscribe();
    httpTesting.expectOne('https://bank.example/api/auth/login').flush(LOGIN_RESPONSE);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('i-bank.session')).toBeNull();
  });

  describe('when the session expires', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    function signIn(service: AuthService): void {
      service.login({ email: 'jane@example.com', password: 'secret' }).subscribe();
      httpTesting.expectOne('https://bank.example/api/auth/login').flush(LOGIN_RESPONSE);
    }

    it('signs out and sends the customer to the login page', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const service = createService();
      signIn(service);

      vi.advanceTimersByTime(LOGIN_RESPONSE.expiresIn * 1000 - 1);
      expect(service.isAuthenticated()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(service.session()).toBeNull();
      expect(sessionStorage.getItem('i-bank.session')).toBeNull();
      expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
    });

    it('also expires a session restored from storage', () => {
      sessionStorage.setItem(
        'i-bank.session',
        JSON.stringify({ ...LOGIN_RESPONSE, expiresAt: Date.now() + 60_000 }),
      );
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const service = createService();

      vi.advanceTimersByTime(60_000);

      expect(service.session()).toBeNull();
    });

    it('does nothing more once the customer has signed out', () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      const service = createService();
      signIn(service);
      service.logout();

      vi.advanceTimersByTime(LOGIN_RESPONSE.expiresIn * 1000);

      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
