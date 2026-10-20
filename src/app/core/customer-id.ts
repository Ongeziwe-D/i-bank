import { InjectionToken, Signal, computed, inject } from '@angular/core';
import { AuthService } from './auth/auth.service';

/** The signed-in customer whose dashboard is shown, or null when nobody is signed in. */
export const CUSTOMER_ID = new InjectionToken<Signal<string | null>>('CUSTOMER_ID', {
  providedIn: 'root',
  factory: () => {
    const auth = inject(AuthService);
    return computed(() => auth.session()?.customer.customerId ?? null);
  },
});
