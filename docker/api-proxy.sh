#!/bin/sh
# Forwards /api requests to API_UPSTREAM, or answers 503 when no backend is configured.
set -eu

if [ -n "${API_UPSTREAM:-}" ]; then
  cat > /etc/nginx/api-proxy.inc <<EOF
location /api/ {
  proxy_pass ${API_UPSTREAM%/};
  proxy_set_header Host \$proxy_host;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
}
EOF
  echo "$0: forwarding /api to ${API_UPSTREAM}"
else
  cat > /etc/nginx/api-proxy.inc <<EOF
location /api/ {
  return 503;
}
EOF
  echo "$0: API_UPSTREAM is not set; /api requests return 503"
fi
