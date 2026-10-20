export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedCustomer {
  customerId: string;
  name: string;
  email: string;
}

/** Response from `POST /auth/login`. */
export interface LoginResponse {
  token: string;
  /** Seconds until the token expires. */
  expiresIn: number;
  customer: AuthenticatedCustomer;
}

export interface AuthSession {
  token: string;
  /** Epoch milliseconds after which the token is no longer valid. */
  expiresAt: number;
  customer: AuthenticatedCustomer;
}
