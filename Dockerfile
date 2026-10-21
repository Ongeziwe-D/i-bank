# syntax=docker/dockerfile:1

# ---- Dependencies: shared by the test and build stages ----
FROM node:22.23-alpine AS deps
WORKDIR /app

# Behind a proxy that re-signs TLS traffic, pass its CA certificate as the optional "ca" secret
# (see README) so npm trusts it.
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=ca \
    if [ -f /run/secrets/ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/ca; fi \
    && npm ci --no-audit --no-fund

COPY . .

# ---- Test: lint and unit tests. Only runs when targeted: docker build --target test . ----
FROM deps AS test
RUN npx ng lint && npx ng test --watch=false

# ---- Build: compile the Angular app ----
FROM deps AS build

# "production" calls the real API at /api. "demo" is optimised the same way but keeps the
# development login and sample data, so the app works without a backend.
ARG BUILD_CONFIGURATION=production
RUN npx ng build --configuration "$BUILD_CONFIGURATION"

# ---- Run: serve the static files with nginx as a non-root user ----
FROM nginxinc/nginx-unprivileged:1.27-alpine

ARG BUILD_CONFIGURATION=production
LABEL org.opencontainers.image.title="i-bank" \
      org.opencontainers.image.description="i-bank customer spending insights dashboard (${BUILD_CONFIGURATION} build)"

RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/i-bank.conf
COPY --chmod=755 docker/api-proxy.sh /docker-entrypoint.d/40-api-proxy.sh
COPY --from=build /app/dist/i-bank/browser /usr/share/nginx/html

# Where to forward /api requests, e.g. http://backend:8080. Leave empty to disable the proxy.
ENV API_UPSTREAM=""

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
