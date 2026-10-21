# i-bank — Customer Spending Insights

An Angular 22 single-page app where a bank customer signs in and sees their spending insights:
profile, spending summary for a chosen period, monthly trend, spending by category, budget goals
and recent transactions. It is built against the Customer Spending Insights API and ships as a
small nginx container.

- [Quick start (Docker)](#quick-start-docker)
- [Configuration](#configuration)
- [Local development](#local-development)
- [Testing and quality checks](#testing-and-quality-checks)
- [Project structure](#project-structure)
- [Design decisions](#design-decisions)
- [Security](#security)
- [Known limitations and next steps](#known-limitations-and-next-steps)

## Quick start (Docker)

Requires Docker 23+ (BuildKit is used for build secrets). Run the commands from the project root.

**Demo build** — includes a mock login and sample data, so it runs without a backend:

```bash
docker build --build-arg BUILD_CONFIGURATION=demo -t i-bank:demo .
docker run --rm -p 8080:8080 i-bank:demo
```

Open <http://localhost:8080> and sign in with:

| Email                | Password       |
| -------------------- | -------------- |
| `john.doe@email.com` | `Password123!` |

**Production build** — calls the real API. nginx forwards `/api/*` unchanged to `API_UPSTREAM`:

```bash
docker build -t i-bank .
docker run --rm -p 8080:8080 -e API_UPSTREAM=http://host.docker.internal:3000 i-bank
```

> ⚠️ Never deploy a `demo` image: it accepts the demo credentials above. Keep the `:demo` tag
> out of any registry that deployments pull from.

**Run the tests in Docker** (lint + unit tests; the build fails if either fails):

```bash
docker build --target test .
```

### Building behind a corporate proxy

If the build fails with `self-signed certificate in certificate chain`, your network re-signs
HTTPS traffic (e.g. Netskope, Zscaler). Export the proxy's root CA certificate(s) as a PEM file
and pass it as a build secret. It is used only while installing packages and is not stored in
the image:

```bash
docker build --secret id=ca,src=company-root-ca.pem --build-arg BUILD_CONFIGURATION=demo -t i-bank:demo .
```

## Configuration

| Setting               | Where                | Default      | Purpose                                                                  |
| --------------------- | -------------------- | ------------ | ------------------------------------------------------------------------ |
| `BUILD_CONFIGURATION` | build arg            | `production` | `production` calls the real API; `demo` bundles the mock login and data. |
| `API_UPSTREAM`        | runtime env variable | _(empty)_    | Backend that `/api/*` is proxied to. Empty → `/api/*` returns `503`.     |

The app always calls the API on its own origin (`/api`), so one image works in every environment
and no CORS configuration is needed; only `API_UPSTREAM` changes per environment.

The container listens on port **8080**, runs nginx as a **non-root** user, and has a Docker
`HEALTHCHECK`.

## Local development

Requires Node.js **22.23** (see `.nvmrc`) and npm.

```bash
npm ci
npm start            # http://localhost:4200, with the mock login and sample data
```

| Command                | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `npm start`            | Dev server with live reload and mock API                        |
| `npm run build`        | Production build into `dist/i-bank/browser`                     |
| `npm test`             | Unit tests (Vitest) in watch mode                               |
| `npm run test:ci`      | Unit tests, single run                                          |
| `npm run lint`         | ESLint (TypeScript + Angular templates)                         |
| `npm run format:check` | Prettier check                                                  |
| `npm run e2e`          | Playwright end-to-end tests (see below)                         |
| `npm run icons`        | Regenerate the icon font subset (see [Icons](#fonts-and-icons)) |

## Testing and quality checks

- **Unit tests** — Vitest with jsdom, run through the Angular CLI. They cover the auth service
  (sign-in, session restore, expiry), route guards, the API client, the login form and the
  dashboard. Run `npm run test:ci`, or `docker build --target test .` without Node installed.
- **End-to-end tests** — Playwright, in `e2e/`, on a desktop and a mobile (Pixel 7) viewport.
  They cover the sign-in redirect and return, form validation, a wrong password, staying signed in
  across a reload, signing out, every dashboard card, changing the period, the trend chart,
  refreshing a card, the icon font, and layout at phone width. Automated WCAG 2.1 AA checks
  (axe-core) run on the login page and the dashboard, and every test fails if the page logs an
  error — including resources blocked by the Content-Security-Policy.
- **Static checks** — strict TypeScript, ESLint with `angular-eslint`, and Prettier.
- **Continuous integration** — `.github/workflows/ci.yml` runs on every push and pull request:
  format check, lint, unit tests, `npm audit` on runtime dependencies and a production build; then
  builds the Docker image and smoke-tests the running container (page served, CSP header present,
  `/api` returns 503 without a backend); and runs the end-to-end tests against the demo image, so
  they exercise the real nginx configuration and headers. The Playwright report is uploaded when
  they fail.

### Running the end-to-end tests

The tests sign in with the demo account, so they run against a build that includes the mock
backend. First install the browser once:

```bash
npx playwright install chromium
```

Against the dev server (started automatically):

```bash
npm run e2e
```

Against the Docker image — closest to production, as it includes nginx and the security headers:

```bash
docker build --build-arg BUILD_CONFIGURATION=demo -t i-bank:demo .
docker run -d --rm --name i-bank-demo -p 8080:8080 i-bank:demo
E2E_BASE_URL=http://localhost:8080 npm run e2e   # PowerShell: $env:E2E_BASE_URL="http://localhost:8080"; npm run e2e
docker stop i-bank-demo
```

Open the HTML report with `npx playwright show-report`. Behind a TLS-intercepting proxy, set
`NODE_EXTRA_CA_CERTS` to your proxy's CA file before `npx playwright install`.

## Project structure

```
src/app/
├── core/
│   ├── auth/                    # AuthService, guards, token interceptor, mock login (dev only)
│   ├── api-base-url.ts          # API_BASE_URL token ("/api")
│   ├── customer-id.ts           # Signed-in customer's ID, derived from the session
│   ├── dev-interceptors.ts      # Mock interceptors, replaced by dev-interceptors.prod.ts in production
│   └── mock-api.interceptor.ts  # Sample API responses (dev/demo only)
├── login/                       # Sign-in page
├── dashboard-navigation/        # Signed-in shell: toolbar, side nav, sign out
└── customer-dashboard/          # Dashboard cards, API client and response models
docker/
├── nginx.conf                   # Static hosting, security headers, caching
└── api-proxy.sh                 # Writes the /api proxy config from API_UPSTREAM at container start
e2e/                             # Playwright end-to-end and accessibility tests
scripts/update-icon-font.mjs     # Builds the icon font subset
```

## Design decisions

- **Standalone components, signals and `rxResource`.** Every dashboard card loads from its own
  endpoint with its own loading, error and retry state, so a slow or failing endpoint only affects
  its card.
- **Mock backend as HTTP interceptors.** The mocks sit at the HTTP layer, so the real
  `DashboardService` and `AuthService` code runs unchanged in development. Production builds swap
  `dev-interceptors.ts` for an empty list via `fileReplacements`, so mock data and demo
  credentials are not in the production bundle.
- **Lazy-loaded routes.** Login, the navigation shell and the dashboard are separate chunks; the
  initial download is ~96 kB compressed.
- **Same-origin API through nginx.** Avoids CORS, keeps the backend address out of the bundle and
  lets the CSP restrict `connect-src` to `'self'`.

### Fonts and icons

Roboto (`@fontsource/roboto`) and the icons are bundled with the app, so the browser makes no
requests to Google — better for privacy (POPIA), a strict CSP, and builds behind proxies. The icon
font is a subset with only the icons the app uses (≈4 KB instead of the 4 MB full font). When you
use a new icon, add its name to `scripts/update-icon-font.mjs` and run `npm run icons`.

## Security

- **Session handling.** The API returns a bearer token, which is held in `sessionStorage` (cleared
  when the tab closes) and attached only to `/api` requests. The customer is signed out
  automatically when the token expires, or as soon as the API answers `401`, and is returned to
  where they were after signing in again. The post-login `returnUrl` only accepts same-app paths,
  preventing open redirects.
- **HTTP headers** (`docker/nginx.conf`): a strict Content-Security-Policy (scripts, fonts and API
  calls only from the app's own origin, no framing), HSTS, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`. The
  nginx version is hidden.
- **Container.** Multi-stage build (no Node or source code in the final image), non-root nginx,
  pinned base images, and `npm ci` against the lockfile.
- **Caching.** Hashed bundles and fonts are cached for a year; `index.html` is revalidated on every
  visit so releases take effect immediately.

## Known limitations and next steps

These need a backend or infrastructure decision that is outside this frontend assignment:

- **Token storage.** Any token readable by JavaScript is exposed if an XSS bug slips through. The
  strict CSP reduces that risk, but for production I would move to a backend-for-frontend issuing
  an `HttpOnly`, `Secure`, `SameSite=Strict` session cookie, plus refresh tokens and an
  inactivity timeout.
- **`style-src 'unsafe-inline'`.** Angular injects component styles at runtime. Removing it needs a
  per-request CSP nonce (`ngCspNonce`) generated by the server.
- **TLS** is expected to be terminated in front of the container (load balancer or ingress).
- **Observability.** Front-end error reporting (e.g. Sentry/OpenTelemetry) and real-user metrics
  would be added once a provider is chosen.
- **E2E against a real backend.** The end-to-end tests use the mock backend; a contract-test or
  staging run against the real API would catch differences from the API spec.
- **Dev-only audit findings.** `npm audit` reports advisories in `vite`, used by the Angular dev
  server only; it is not part of the production bundle. The only automatic fix downgrades
  `@angular/build`, so it is left until a fixed release is available.
