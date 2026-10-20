import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthSession } from '../core/auth/auth.models';
import { AuthService } from '../core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let loginResponse: Subject<AuthSession>;
  let login: ReturnType<typeof vi.fn>;
  let returnUrl: string | null;

  beforeEach(() => {
    returnUrl = null;
    loginResponse = new Subject();
    login = vi.fn(() => loginResponse);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap() {
                return convertToParamMap({ returnUrl });
              },
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fill(email: string, password: string): void {
    component.form.setValue({ email, password });
  }

  function errorText(): string | undefined {
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement)
      .querySelector('[role="alert"] span')
      ?.textContent?.trim();
  }

  it('does not submit an incomplete form', () => {
    fill('not-an-email', '');
    component.submit();

    expect(login).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBe(true);
  });

  it('signs in and goes to the dashboard', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fill('john.doe@email.com', 'Password123!');

    component.submit();
    expect(component.submitting()).toBe(true);
    loginResponse.next({} as AuthSession);
    loginResponse.complete();

    expect(login).toHaveBeenCalledWith({ email: 'john.doe@email.com', password: 'Password123!' });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
    expect(component.submitting()).toBe(false);
  });

  it('returns to the page the customer was headed to', () => {
    returnUrl = '/dashboard?period=7d';
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fill('john.doe@email.com', 'Password123!');

    component.submit();
    loginResponse.next({} as AuthSession);

    expect(navigate).toHaveBeenCalledWith('/dashboard?period=7d');
  });

  it('ignores return URLs that point to another site', () => {
    returnUrl = '//evil.example/phish';
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fill('john.doe@email.com', 'Password123!');

    component.submit();
    loginResponse.next({} as AuthSession);

    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('explains rejected credentials and clears the password', () => {
    fill('john.doe@email.com', 'wrong');

    component.submit();
    loginResponse.error(new HttpErrorResponse({ status: 401 }));

    expect(errorText()).toBe('The email or password is incorrect.');
    expect(component.form.controls.password.value).toBe('');
    expect(component.submitting()).toBe(false);
  });

  it('explains when the server cannot be reached', () => {
    fill('john.doe@email.com', 'Password123!');

    component.submit();
    loginResponse.error(new HttpErrorResponse({ status: 0 }));

    expect(errorText()).toContain("couldn't reach i-bank");
  });
});
