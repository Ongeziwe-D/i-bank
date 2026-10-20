import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api-base-url';
import { CUSTOMER_ID } from '../core/customer-id';
import {
  CategoryFilterQuery,
  CustomerProfile,
  DashboardFilters,
  SpendingByCategory,
  SpendingGoals,
  SpendingPeriod,
  SpendingSummary,
  SpendingTrends,
  TransactionPage,
  TransactionQuery,
} from './dashboard.models';

/** Endpoint paths relative to `{API_BASE_URL}/customers/{customerId}`. */
export const DASHBOARD_ENDPOINTS = {
  profile: '/profile',
  spendingSummary: '/spending/summary',
  spendingByCategory: '/spending/categories',
  spendingTrends: '/spending/trends',
  transactions: '/transactions',
  goals: '/goals',
  filters: '/filters',
} as const;

/** Client for the Customer Spending Insights API. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly customerId = inject(CUSTOMER_ID);

  getProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(this.url(DASHBOARD_ENDPOINTS.profile));
  }

  getSpendingSummary(period: SpendingPeriod = '30d'): Observable<SpendingSummary> {
    return this.http.get<SpendingSummary>(this.url(DASHBOARD_ENDPOINTS.spendingSummary), {
      params: toParams({ period }),
    });
  }

  getSpendingByCategory(query: CategoryFilterQuery = {}): Observable<SpendingByCategory> {
    return this.http.get<SpendingByCategory>(this.url(DASHBOARD_ENDPOINTS.spendingByCategory), {
      params: toParams({ ...query }),
    });
  }

  /** @param months Number of months to retrieve (max 24). */
  getSpendingTrends(months = 12): Observable<SpendingTrends> {
    return this.http.get<SpendingTrends>(this.url(DASHBOARD_ENDPOINTS.spendingTrends), {
      params: toParams({ months }),
    });
  }

  getTransactions(query: TransactionQuery = {}): Observable<TransactionPage> {
    return this.http.get<TransactionPage>(this.url(DASHBOARD_ENDPOINTS.transactions), {
      params: toParams({ ...query }),
    });
  }

  getGoals(): Observable<SpendingGoals> {
    return this.http.get<SpendingGoals>(this.url(DASHBOARD_ENDPOINTS.goals));
  }

  getFilters(): Observable<DashboardFilters> {
    return this.http.get<DashboardFilters>(this.url(DASHBOARD_ENDPOINTS.filters));
  }

  private url(path: string): string {
    const customerId = this.customerId();
    if (!customerId) {
      throw new Error('Customer data was requested while nobody is signed in.');
    }
    return `${this.baseUrl}/customers/${encodeURIComponent(customerId)}${path}`;
  }
}

/** Builds query params, leaving out values that weren't supplied. */
function toParams(values: Record<string, string | number | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') {
      params = params.set(key, value);
    }
  }
  return params;
}
