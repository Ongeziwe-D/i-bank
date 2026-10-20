import { HttpInterceptorFn } from '@angular/common/http';
import { mockApiInterceptor } from './mock-api.interceptor';
import { mockAuthInterceptor } from './auth/mock-auth.interceptor';

/**
 * Interceptors used only during development. Production builds replace this file with
 * dev-interceptors.prod.ts (see fileReplacements in angular.json), so the sample data
 * never ships.
 */
export const devInterceptors: HttpInterceptorFn[] = [mockAuthInterceptor, mockApiInterceptor];
