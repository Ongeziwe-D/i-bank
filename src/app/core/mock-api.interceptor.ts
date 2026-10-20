import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { API_BASE_URL } from './api-base-url';
import { DASHBOARD_ENDPOINTS } from '../customer-dashboard/dashboard.service';
import {
  CustomerProfile,
  DashboardFilters,
  SpendingByCategory,
  SpendingGoals,
  SpendingPeriod,
  SpendingSummary,
  SpendingTrends,
  Transaction,
  TransactionPage,
} from '../customer-dashboard/dashboard.models';

// Sample responses taken from the client's API spec (CustomerSpendingInsightsEndpoints.md).

const profile: CustomerProfile = {
  customerId: '12345',
  name: 'John Doe',
  email: 'john.doe@email.com',
  joinDate: '2023-01-15',
  accountType: 'premium',
  totalSpent: 15420.5,
  currency: 'ZAR',
};

const spendingSummary: SpendingSummary = {
  period: '30d',
  totalSpent: 4250.75,
  transactionCount: 47,
  averageTransaction: 90.44,
  topCategory: 'Groceries',
  comparedToPrevious: { spentChange: 12.5, transactionChange: -3.2 },
};

const spendingByCategory: SpendingByCategory = {
  dateRange: { startDate: '2024-08-16', endDate: '2024-09-16' },
  totalAmount: 4250.75,
  categories: [
    {
      name: 'Groceries',
      amount: 1250.3,
      percentage: 29.4,
      transactionCount: 15,
      color: '#FF6B6B',
      icon: 'shopping-cart',
    },
    {
      name: 'Entertainment',
      amount: 890.2,
      percentage: 20.9,
      transactionCount: 8,
      color: '#4ECDC4',
      icon: 'film',
    },
    {
      name: 'Transportation',
      amount: 680.45,
      percentage: 16.0,
      transactionCount: 12,
      color: '#45B7D1',
      icon: 'car',
    },
    {
      name: 'Dining',
      amount: 520.3,
      percentage: 12.2,
      transactionCount: 9,
      color: '#F7DC6F',
      icon: 'utensils',
    },
    {
      name: 'Shopping',
      amount: 450.8,
      percentage: 10.6,
      transactionCount: 6,
      color: '#BB8FCE',
      icon: 'shopping-bag',
    },
    {
      name: 'Utilities',
      amount: 458.7,
      percentage: 10.8,
      transactionCount: 3,
      color: '#85C1E9',
      icon: 'zap',
    },
  ],
};

const spendingTrends: SpendingTrends = {
  trends: [
    { month: '2024-01', totalSpent: 3890.25, transactionCount: 42, averageTransaction: 92.62 },
    { month: '2024-02', totalSpent: 4150.8, transactionCount: 38, averageTransaction: 109.23 },
    { month: '2024-03', totalSpent: 3750.6, transactionCount: 45, averageTransaction: 83.35 },
    { month: '2024-04', totalSpent: 4200.45, transactionCount: 39, averageTransaction: 107.7 },
    { month: '2024-05', totalSpent: 3980.3, transactionCount: 44, averageTransaction: 90.46 },
    { month: '2024-06', totalSpent: 4250.75, transactionCount: 47, averageTransaction: 90.44 },
  ],
};

const transactions: Transaction[] = [
  {
    id: 'txn_123456',
    date: '2024-09-16T14:30:00Z',
    merchant: 'Pick n Pay',
    category: 'Groceries',
    amount: 245.8,
    description: 'Weekly groceries',
    paymentMethod: 'Credit Card',
    icon: 'shopping-cart',
    categoryColor: '#FF6B6B',
  },
  {
    id: 'txn_123457',
    date: '2024-09-15T10:15:00Z',
    merchant: 'Netflix',
    category: 'Entertainment',
    amount: 199.0,
    description: 'Monthly subscription',
    paymentMethod: 'Debit Order',
    icon: 'film',
    categoryColor: '#4ECDC4',
  },
];

const goals: SpendingGoals = {
  goals: [
    {
      id: 'goal_001',
      category: 'Entertainment',
      monthlyBudget: 1000.0,
      currentSpent: 650.3,
      percentageUsed: 65.03,
      daysRemaining: 12,
      status: 'on_track',
    },
    {
      id: 'goal_002',
      category: 'Groceries',
      monthlyBudget: 1500.0,
      currentSpent: 1450.8,
      percentageUsed: 96.72,
      daysRemaining: 12,
      status: 'warning',
    },
  ],
};

const filters: DashboardFilters = {
  categories: spendingByCategory.categories.map(({ name, color, icon }) => ({ name, color, icon })),
  dateRangePresets: [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'Last year', value: '1y' },
  ],
};

const responders: Record<string, (req: HttpRequest<unknown>) => unknown> = {
  [DASHBOARD_ENDPOINTS.profile]: () => profile,
  [DASHBOARD_ENDPOINTS.spendingSummary]: (req) => ({
    ...spendingSummary,
    period: (req.params.get('period') as SpendingPeriod | null) ?? '30d',
  }),
  [DASHBOARD_ENDPOINTS.spendingByCategory]: () => spendingByCategory,
  [DASHBOARD_ENDPOINTS.spendingTrends]: (req) => ({
    trends: spendingTrends.trends.slice(-Number(req.params.get('months') ?? 12)),
  }),
  [DASHBOARD_ENDPOINTS.transactions]: (req): TransactionPage => {
    const limit = Number(req.params.get('limit') ?? 20);
    const offset = Number(req.params.get('offset') ?? 0);
    const category = req.params.get('category');
    const matching = category ? transactions.filter((t) => t.category === category) : transactions;
    return {
      transactions: matching.slice(offset, offset + limit),
      pagination: {
        total: matching.length,
        limit,
        offset,
        hasMore: offset + limit < matching.length,
      },
    };
  },
  [DASHBOARD_ENDPOINTS.goals]: () => goals,
  [DASHBOARD_ENDPOINTS.filters]: () => filters,
};

/**
 * Development-only stand-in for the backend: answers GET requests to the
 * spending insights endpoints with sample data. Other requests pass through.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const match = req.url.startsWith(baseUrl)
    ? /^\/customers\/[^/]+(\/.*)$/.exec(req.url.slice(baseUrl.length))
    : null;
  const respond = match ? responders[match[1]] : undefined;
  if (req.method !== 'GET' || !respond) {
    return next(req);
  }

  return of(new HttpResponse({ status: 200, body: structuredClone(respond(req)) })).pipe(
    delay(500),
  );
};
