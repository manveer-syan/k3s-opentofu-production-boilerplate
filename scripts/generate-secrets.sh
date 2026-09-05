#!/bin/bash
# ==============================================================================
# Script: Cryptographic Secrets Generator
# Path: scripts/generate-secrets.sh
# ==============================================================================

set -euo pipefail

echo "=================================================="
echo "Generating Secure Production Secrets..."
echo "=================================================="

JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9')
COOKIE_SECRET=$(openssl rand -base64 32)
GRAFANA_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9')

TARGET_FILE="docker-compose/.env"

cat <<ENVEOF > "$TARGET_FILE"
# Generated Production Environment Secrets
REGISTRY_URL=registry.gitlab.com/manveersyan-group
REGISTRY_USER=gitlab-deploy-token-user
REGISTRY_PASSWORD=gitlab-deploy-token-password

DATABASE_HOST=manveersyan-prod-db.c123456789.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=appdb
DATABASE_USER=produser
DATABASE_PASSWORD=${DB_PASSWORD}

APP_ENV=production
LOG_LEVEL=info
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}
GF_ADMIN_PASSWORD=${GRAFANA_PASS}

API_GATEWAY_URL=http://api-gateway:8080
AUTH_SERVICE_URL=http://auth-service:5000
ENVEOF

echo "Generated secrets saved to $TARGET_FILE"
echo "IMPORTANT: Mask and upload these values into GitLab CI/CD Variables!"
