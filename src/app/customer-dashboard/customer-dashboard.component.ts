import { Component, ResourceRef, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from './dashboard.service';
import { DateRangePreset, SpendingPeriod } from './dashboard.models';
import { toMaterialIcon } from './category-icon';

type CardId = 'profile' | 'summary' | 'trends' | 'categories' | 'goals' | 'transactions';

interface DashboardCard {
  id: CardId;
  title: string;
  cols: number;
  rows: number;
}

/** Used until the filters endpoint responds, or if it fails. */
const DEFAULT_PRESETS: DateRangePreset[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
];

const TREND_MONTHS = 12;
const RECENT_TRANSACTION_COUNT = 5;

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.scss',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
})
export class CustomerDashboardComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dashboardService = inject(DashboardService);

  protected readonly toMaterialIcon = toMaterialIcon;

  /** Period applied to the spending summary and category breakdown. */
  readonly period = signal<SpendingPeriod>('30d');

  // Each card loads from its own endpoint, so one slow or failing card doesn't block the others.
  readonly filters = rxResource({ stream: () => this.dashboardService.getFilters() });
  readonly profile = rxResource({ stream: () => this.dashboardService.getProfile() });
  readonly summary = rxResource({
    params: () => this.period(),
    stream: ({ params: period }) => this.dashboardService.getSpendingSummary(period),
  });
  readonly categories = rxResource({
    params: () => this.period(),
    stream: ({ params: period }) => this.dashboardService.getSpendingByCategory({ period }),
  });
  readonly trends = rxResource({
    stream: () => this.dashboardService.getSpendingTrends(TREND_MONTHS),
  });
  readonly transactions = rxResource({
    stream: () =>
      this.dashboardService.getTransactions({
        limit: RECENT_TRANSACTION_COUNT,
        sortBy: 'date_desc',
      }),
  });
  readonly goals = rxResource({ stream: () => this.dashboardService.getGoals() });

  readonly resources: Record<CardId, ResourceRef<unknown>> = {
    profile: this.profile,
    summary: this.summary,
    trends: this.trends,
    categories: this.categories,
    goals: this.goals,
    transactions: this.transactions,
  };

  readonly presets = computed(() =>
    this.filters.hasValue() ? this.filters.value().dateRangePresets : DEFAULT_PRESETS,
  );
  readonly periodLabel = computed(
    () => this.presets().find((p) => p.value === this.period())?.label ?? this.period(),
  );

  /** Amounts in the other responses carry no currency, so use the customer's. */
  readonly currency = computed(() =>
    this.profile.hasValue() ? this.profile.value().currency : 'ZAR',
  );

  readonly sortedCategories = computed(() =>
    this.categories.hasValue()
      ? [...this.categories.value().categories].sort((a, b) => b.amount - a.amount)
      : [],
  );
  readonly maxCategoryAmount = computed(() =>
    Math.max(0, ...this.sortedCategories().map((c) => c.amount)),
  );

  readonly trendBars = computed(() => {
    const trends = this.trends.hasValue() ? this.trends.value().trends : [];
    const max = Math.max(0, ...trends.map((t) => t.totalSpent));
    return trends.map((t) => {
      const [year, month] = t.month.split('-').map(Number);
      return {
        ...t,
        date: new Date(year, month - 1, 1),
        heightPercent: max ? (t.totalSpent / max) * 100 : 0,
      };
    });
  });
  /** Month whose values are spelled out under the trend chart; defaults to the latest. */
  readonly selectedTrendMonth = signal<string | null>(null);
  readonly selectedTrend = computed(() => {
    const bars = this.trendBars();
    return bars.find((b) => b.month === this.selectedTrendMonth()) ?? bars.at(-1);
  });

  private readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(map(({ matches }) => matches)),
    { initialValue: false },
  );

  /** Two columns on larger screens, one card per row on phones. */
  readonly columns = computed(() => (this.isHandset() ? 1 : 2));

  readonly cards = computed((): DashboardCard[] => {
    const wide = this.columns();
    return [
      { id: 'profile', title: 'Profile', cols: 1, rows: 1 },
      { id: 'summary', title: 'Spending summary', cols: 1, rows: 1 },
      { id: 'trends', title: 'Monthly spending', cols: wide, rows: 1 },
      { id: 'categories', title: 'Spending by category', cols: 1, rows: 2 },
      { id: 'goals', title: 'Spending goals', cols: 1, rows: 1 },
      { id: 'transactions', title: 'Recent transactions', cols: 1, rows: 1 },
    ];
  });

  selectPeriod(period: SpendingPeriod): void {
    this.period.set(period);
  }
}
