#!/bin/bash
# ==============================================================================
# Automated Application Deployment Script
# Path: docker-compose/deploy.sh
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "🚀 Initiating Zero-Downtime Deployment: $(date)"
echo "=================================================="

# Check for .env file existence
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found in $SCRIPT_DIR"
    exit 1
fi

source .env

# Log into GitLab Container Registry
echo "🔑 Logging into Container Registry ($REGISTRY_URL)..."
echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USER" --password-stdin "$REGISTRY_URL"

# Pull latest container images
echo "📥 Pulling latest application images..."
docker compose pull

# Apply zero-downtime container updates
echo "🔄 Upgrading application containers..."
docker compose up -d --remove-orphans

# Health Check Validation Loop
echo "⏳ Verifying application health status..."
MAX_RETRIES=12
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || true)
    if [ "$HTTP_CODE" -eq 200 ]; then
        HEALTHY=true
        break
    fi
    echo "   ...waiting for healthcheck OK (Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$HEALTHY" = true ]; then
    echo "✅ Deployment Successful! All services healthy."
    docker compose ps
    echo "Timestamp: $(date)"
    exit 0
else
    echo "❌ Deployment Failed! Nginx healthcheck returned HTTP $HTTP_CODE"
    docker compose logs --tail 50
    exit 1
fi
