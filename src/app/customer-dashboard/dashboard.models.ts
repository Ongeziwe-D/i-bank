/** Quick period selection accepted by the spending endpoints. */
export type SpendingPeriod = '7d' | '30d' | '90d' | '1y';

export type TransactionSortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export interface CustomerProfile {
  customerId: string;
  name: string;
  email: string;
  joinDate: string;
  accountType: string;
  totalSpent: number;
  currency: string;
}

export interface SpendingSummary {
  period: SpendingPeriod;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  topCategory: string;
  comparedToPrevious: {
    /** Percentage change in amount spent versus the previous period. */
    spentChange: number;
    /** Percentage change in number of transactions versus the previous period. */
    transactionChange: number;
  };
}

export interface CategorySpending {
  name: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  color: string;
  icon: string;
}

export interface SpendingByCategory {
  dateRange: { startDate: string; endDate: string };
  totalAmount: number;
  categories: CategorySpending[];
}

export interface CategoryFilterQuery {
  period?: SpendingPeriod;
  /** YYYY-MM-DD */
  startDate?: string;
  /** YYYY-MM-DD */
  endDate?: string;
}

export interface MonthlyTrend {
  /** YYYY-MM */
  month: string;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface SpendingTrends {
  trends: MonthlyTrend[];
}

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  icon: string;
  categoryColor: string;
}

export interface TransactionPage {
  transactions: Transaction[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

export interface TransactionQuery {
  /** Default 20, max 100. */
  limit?: number;
  offset?: number;
  category?: string;
  /** YYYY-MM-DD */
  startDate?: string;
  /** YYYY-MM-DD */
  endDate?: string;
  sortBy?: TransactionSortBy;
}

export type GoalStatus = 'on_track' | 'warning' | (string & {});

export interface SpendingGoal {
  id: string;
  category: string;
  monthlyBudget: number;
  currentSpent: number;
  percentageUsed: number;
  daysRemaining: number;
  status: GoalStatus;
}

export interface SpendingGoals {
  goals: SpendingGoal[];
}

export interface FilterCategory {
  name: string;
  color: string;
  icon: string;
}

export interface DateRangePreset {
  label: string;
  value: SpendingPeriod;
}

export interface DashboardFilters {
  categories: FilterCategory[];
  dateRangePresets: DateRangePreset[];
}
