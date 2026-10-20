import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../core/api-base-url';
import { CUSTOMER_ID } from '../core/customer-id';
import { DashboardService } from './dashboard.service';

const BASE = 'https://bank.example/api/customers/c-42';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://bank.example/api' },
        { provide: CUSTOMER_ID, useValue: signal('c-42') },
      ],
    });
    service = TestBed.inject(DashboardService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('requests each card from its own customer endpoint', () => {
    service.getProfile().subscribe();
    service.getGoals().subscribe();
    service.getFilters().subscribe();

    for (const path of ['/profile', '/goals', '/filters']) {
      const req = httpTesting.expectOne(`${BASE}${path}`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    }
  });

  it('sends the period to the spending summary, defaulting to 30d', () => {
    service.getSpendingSummary().subscribe();
    service.getSpendingSummary('7d').subscribe();

    httpTesting.expectOne(`${BASE}/spending/summary?period=30d`).flush({});
    httpTesting.expectOne(`${BASE}/spending/summary?period=7d`).flush({});
  });

  it('sends only the category filters that were supplied', () => {
    service.getSpendingByCategory({ startDate: '2024-08-16', endDate: '2024-09-16' }).subscribe();

    httpTesting
      .expectOne(`${BASE}/spending/categories?startDate=2024-08-16&endDate=2024-09-16`)
      .flush({});
  });

  it('sends the number of months for trends', () => {
    service.getSpendingTrends(6).subscribe();

    httpTesting.expectOne(`${BASE}/spending/trends?months=6`).flush({ trends: [] });
  });

  it('sends transaction paging, filtering and sorting', () => {
    service
      .getTransactions({ limit: 5, offset: 10, category: 'Dining', sortBy: 'amount_desc' })
      .subscribe();

    const req = httpTesting.expectOne((r) => r.url === `${BASE}/transactions`);
    expect(req.request.params.get('limit')).toBe('5');
    expect(req.request.params.get('offset')).toBe('10');
    expect(req.request.params.get('category')).toBe('Dining');
    expect(req.request.params.get('sortBy')).toBe('amount_desc');
    expect(req.request.params.has('startDate')).toBe(false);
    req.flush({ transactions: [], pagination: { total: 0, limit: 5, offset: 10, hasMore: false } });
  });
});
