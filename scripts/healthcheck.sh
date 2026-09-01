#!/bin/sh
# ATE Operations Suite - Healthcheck script

HOST="${1:-http://localhost:8080}"
echo "Checking service health at: $HOST/health"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/health")

if [ "$STATUS" -eq 200 ]; then
  echo "✅ Healthcheck SUCCESS: HTTP 200 OK"
  exit 0
else
  echo "❌ Healthcheck FAILED: Received HTTP $STATUS"
  exit 1
fi
