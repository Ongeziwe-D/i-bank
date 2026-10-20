import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { DashboardNavigationComponent } from './dashboard-navigation/dashboard-navigation.component';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in | i-bank',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    // Everything inside the navigation shell requires a signed-in customer.
    path: '',
    component: DashboardNavigationComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard | i-bank',
        loadComponent: () =>
          import('./customer-dashboard/customer-dashboard.component').then(
            (m) => m.CustomerDashboardComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
