import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CUSTOMER_ID } from '../core/customer-id';
import { CustomerDashboardComponent } from './customer-dashboard.component';

const BASE = '/api/customers/12345';

describe('CustomerDashboardComponent', () => {
  let component: CustomerDashboardComponent;
  let fixture: ComponentFixture<CustomerDashboardComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUSTOMER_ID, useValue: signal('12345') },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CustomerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** Answers every card's request; `overrides` replaces the response for an endpoint path. */
  function flushAll(overrides: Record<string, () => void> = {}): void {
    TestBed.tick();
    const responses: Record<string, object> = {
      '/filters': { categories: [], dateRangePresets: [] },
      '/profile': {
        customerId: '12345',
        name: 'John Doe',
        email: 'john.doe@email.com',
        joinDate: '2023-01-15',
        accountType: 'premium',
        totalSpent: 15420.5,
        currency: 'ZAR',
      },
      '/spending/summary': {
        period: '30d',
        totalSpent: 4250.75,
        transactionCount: 47,
        averageTransaction: 90.44,
        topCategory: 'Groceries',
        comparedToPrevious: { spentChange: 12.5, transactionChange: -3.2 },
      },
      '/spending/categories': {
        dateRange: { startDate: '2024-08-16', endDate: '2024-09-16' },
        totalAmount: 0,
        categories: [],
      },
      '/spending/trends': { trends: [] },
      '/transactions': {
        transactions: [],
        pagination: { total: 0, limit: 5, offset: 0, hasMore: false },
      },
      '/goals': { goals: [] },
    };
    for (const [path, body] of Object.entries(responses)) {
      const override = overrides[path];
      if (override) {
        override();
      } else {
        httpTesting.expectOne((r) => r.url === `${BASE}${path}`).flush(body);
      }
    }
  }

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  it('shows one card failing without affecting the others', async () => {
    flushAll({
      '/transactions': () =>
        httpTesting
          .expectOne((r) => r.url === `${BASE}/transactions`)
          .flush('Server error', { status: 500, statusText: 'Server Error' }),
    });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('John Doe');
    expect(text).toContain('R4,250.75');
    expect(text).toContain("Couldn't load this card.");
  });

  it('reloads the spending summary and categories when the period changes', async () => {
    flushAll();
    await fixture.whenStable();

    component.selectPeriod('7d');
    TestBed.tick();

    httpTesting.expectOne(`${BASE}/spending/summary?period=7d`).flush({
      period: '7d',
      totalSpent: 900,
      transactionCount: 10,
      averageTransaction: 90,
      topCategory: 'Dining',
      comparedToPrevious: { spentChange: 0, transactionChange: 0 },
    });
    httpTesting.expectOne(`${BASE}/spending/categories?period=7d`).flush({
      dateRange: { startDate: '2024-09-09', endDate: '2024-09-16' },
      totalAmount: 900,
      categories: [],
    });
    httpTesting.verify();
  });
});
