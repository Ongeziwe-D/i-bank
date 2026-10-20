import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';

@Component({ template: 'login' })
class LoginStub {}

@Component({ template: 'dashboard' })
class DashboardStub {}

describe('auth guards', () => {
  let signedIn: boolean;

  beforeEach(() => {
    signedIn = false;
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => signedIn } },
        provideRouter([
          { path: 'login', canActivate: [guestGuard], component: LoginStub },
          { path: 'dashboard', canActivate: [authGuard], component: DashboardStub },
        ]),
      ],
    });
  });

  it('sends signed-out visitors to the login page with a return URL', async () => {
    const harness = await RouterTestingHarness.create('/dashboard?period=7d');
    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Fdashboard%3Fperiod%3D7d');
    expect(harness.routeNativeElement?.textContent).toBe('login');
  });

  it('lets signed-in customers through to the dashboard', async () => {
    signedIn = true;
    const harness = await RouterTestingHarness.create('/dashboard');
    expect(harness.routeNativeElement?.textContent).toBe('dashboard');
  });

  it('sends signed-in customers away from the login page', async () => {
    signedIn = true;
    await RouterTestingHarness.create('/login');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
