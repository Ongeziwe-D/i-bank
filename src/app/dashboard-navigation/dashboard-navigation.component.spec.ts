import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthSession } from '../core/auth/auth.models';
import { AuthService } from '../core/auth/auth.service';
import { DashboardNavigationComponent } from './dashboard-navigation.component';

describe('DashboardNavigationComponent', () => {
  let component: DashboardNavigationComponent;
  let fixture: ComponentFixture<DashboardNavigationComponent>;

  beforeEach(() => {
    const session = signal<AuthSession | null>({
      token: 'token-1',
      expiresAt: Date.now() + 60_000,
      customer: { customerId: '12345', name: 'John Doe', email: 'john.doe@email.com' },
    });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { session } }],
    });
    fixture = TestBed.createComponent(DashboardNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  it('shows the signed-in customer and their ID', () => {
    const toolbar = (fixture.nativeElement as HTMLElement).querySelector('.customer-details');
    expect(toolbar?.textContent).toContain('John Doe');
    expect(toolbar?.textContent).toContain('Customer ID: 12345');
  });
});
