#!/bin/bash
# ==============================================================================
# Script: GitLab CI/CD Masked Variables Setup via glab CLI / API
# Path: scripts/setup-gitlab-variables.sh
# ==============================================================================

set -euo pipefail

PROJECT_PATH="manveersyan-group/ate"

echo "=================================================="
echo "Configuring GitLab Masked Variables for $PROJECT_PATH..."
echo "=================================================="

set_var() {
  local key=$1
  local value=$2
  local masked=$3

  echo "Setting $key..."
  glab variable set "$key" "$value" --repo "$PROJECT_PATH" --protected --masked="$masked" || \
  curl --request POST --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
       "https://gitlab.com/api/v4/projects/${PROJECT_PATH//\//%2F}/variables" \
       --form "key=$key" --form "value=$value" --form "protected=true" --form "masked=$masked"
}

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in your shell environment."
  exit 1
fi

if [ -z "${DATABASE_PASSWORD:-}" ]; then
  echo "Error: DATABASE_PASSWORD must be set in your shell environment."
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "Error: JWT_SECRET must be set in your shell environment (minimum 32 bytes)."
  exit 1
fi

set_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "false"
set_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "true"
set_var "REGISTRY_PASSWORD" "${REGISTRY_PASSWORD:-dummy-token-pass}" "true"
set_var "DATABASE_USER" "${DATABASE_USER:-produser}" "false"
set_var "DATABASE_PASSWORD" "$DATABASE_PASSWORD" "true"
set_var "JWT_SECRET" "$JWT_SECRET" "true"
if [ -n "${DATABASE_URL:-}" ]; then
  set_var "DATABASE_URL" "$DATABASE_URL" "true"
fi

echo "All GitLab CI/CD protected and masked variables configured successfully."
