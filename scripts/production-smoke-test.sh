#!/usr/bin/env bash
# ==============================================================================
# Script: Production Non-Destructive Smoke Test Suite
# Path: scripts/production-smoke-test.sh
# ==============================================================================

set -euo pipefail

BASE_URL="${1:-http://localhost}"
TIMEOUT_SEC="${2:-5}"

echo "================================================================================"
echo " Project ATE — Production Smoke Test Suite"
echo " Target Base URL: $BASE_URL (Timeout: ${TIMEOUT_SEC}s)"
echo "================================================================================"

FAILED=0

test_endpoint() {
  local path="$1"
  local expected_status="$2"
  local description="$3"

  local full_url="${BASE_URL%/}${path}"
  echo -n "Testing $description ($path)... "

  # Perform non-destructive HTTP GET (following redirects)
  local http_code
  http_code=$(curl -s -L -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT_SEC" -k "$full_url" || echo "000")

  if [ "$http_code" = "$expected_status" ]; then
    echo "[PASS] (HTTP $http_code)"
  else
    echo "[FAIL] (Expected HTTP $expected_status, got $http_code)"
    FAILED=$((FAILED + 1))
  fi
}

echo ""
echo "--- 1. Testing Core Microservice Endpoints ---"
test_endpoint "/" 200 "FATE Web Frontend Static UI"
test_endpoint "/api/health" 200 "GATE API Gateway Health Probe"
test_endpoint "/auth/health" 200 "STATE Auth Service Health Probe"
test_endpoint "/notifications/health" 200 "DATE Notification Service Health Probe"

echo ""
echo "--- 2. Testing TLS Handshake & Headers (if HTTPS) ---"
if [[ "$BASE_URL" =~ ^https:// ]]; then
  echo -n "Validating TLS handshake and security headers... "
  if curl -s -I --max-time "$TIMEOUT_SEC" "$BASE_URL" | grep -iq "strict-transport-security"; then
    echo "[PASS] (HSTS Header Present)"
  else
    echo "[WARN] (HSTS header missing or testing via bypass proxy)"
  fi
fi

echo ""
echo "================================================================================"
if [ "$FAILED" -eq 0 ]; then
  echo " SMOKE TEST RESULT: ALL ENDPOINTS HEALTHY"
  echo "================================================================================"
  exit 0
else
  echo " SMOKE TEST RESULT: $FAILED ENDPOINTS UNHEALTHY"
  echo "================================================================================"
  exit 1
fi
