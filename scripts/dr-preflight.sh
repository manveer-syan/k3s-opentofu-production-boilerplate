#!/usr/bin/env bash
# ==============================================================================
# Script: Disaster Recovery Preflight Readiness Auditor
# Path: scripts/dr-preflight.sh
# ==============================================================================

set -euo pipefail

echo "================================================================================"
echo " Project ATE — Disaster Recovery (DR) Preflight Readiness Audit"
echo "================================================================================"

FAILED=0

# Helper assertion
check_pass() {
  echo " [PASS] $1"
}

check_fail() {
  echo " [FAIL] $1: $2"
  FAILED=$((FAILED + 1))
}

# 1. Verify Git Repository Reachability
echo ""
echo "--- 1. Validating Git Repository Reachability ---"
if git remote get-url origin >/dev/null 2>&1; then
  check_pass "Git remote 'origin' is configured ($(git remote get-url origin))"
else
  check_fail "Git Remote" "No origin remote found"
fi

if git rev-parse --verify HEAD >/dev/null 2>&1; then
  check_pass "Git commit history is healthy (HEAD: $(git rev-parse --short HEAD))"
else
  check_fail "Git History" "Unable to resolve HEAD commit"
fi

# 2. Verify OpenTofu / Terraform Backend & Manifests
echo ""
echo "--- 2. Validating Infrastructure as Code (IaC) ---"
if command -v tofu >/dev/null 2>&1 || command -v terraform >/dev/null 2>&1; then
  IAC_BIN=$(command -v tofu || command -v terraform)
  check_pass "IaC binary found ($IAC_BIN)"
  if (cd terraform/environments/production && $IAC_BIN validate >/dev/null 2>&1); then
    check_pass "Production OpenTofu configuration validates cleanly"
  else
    check_fail "OpenTofu Validation" "terraform/environments/production failed validation"
  fi
else
  check_fail "IaC Binary" "Neither tofu nor terraform found in PATH"
fi

# 3. Verify Master Age Key Availability (Local or AWS Secrets Manager)
echo ""
echo "--- 3. Validating Master Cryptographic Decryption Keys ---"
if [ -f "${SOPS_AGE_KEY_FILE:-$HOME/.config/sops/age/keys.txt}" ]; then
  check_pass "Local Age key file located at ${SOPS_AGE_KEY_FILE:-$HOME/.config/sops/age/keys.txt}"
elif command -v aws >/dev/null 2>&1 && aws secretsmanager describe-secret --secret-id "manveersyan-prod-sops-age-key" --region us-east-1 >/dev/null 2>&1; then
  check_pass "AWS Secrets Manager backup key reachable (manveersyan-prod-sops-age-key)"
else
  check_fail "Age Key Recovery" "Master Age private key not found locally or in AWS Secrets Manager"
fi

# 4. Verify Secret Decryptability
echo ""
echo "--- 4. Validating Secret Decryptability via SOPS ---"
if command -v sops >/dev/null 2>&1; then
  TEST_SECRET="k8s/overlays/production/apps/api-gateway/secret.enc.yaml"
  if [ -f "$TEST_SECRET" ]; then
    if sops -d "$TEST_SECRET" >/dev/null 2>&1; then
      check_pass "Production secrets can be decrypted successfully using active key"
    else
      check_fail "SOPS Decryption" "Failed to decrypt $TEST_SECRET with active Age key"
    fi
  else
    check_fail "Secret Manifest" "Target test secret $TEST_SECRET not found"
  fi
else
  check_fail "SOPS Binary" "sops CLI not installed"
fi

# 5. Verify Kustomize Manifest Compilation
echo ""
echo "--- 5. Validating Kubernetes Manifest Compilation ---"
if command -v kubectl >/dev/null 2>&1; then
  if kubectl kustomize k8s/base >/dev/null 2>&1; then
    check_pass "Base Kubernetes manifests compile cleanly"
  else
    check_fail "Kustomize Base" "Failed to compile k8s/base"
  fi

  if kubectl kustomize k8s/components/strict-network >/dev/null 2>&1; then
    check_pass "Strict-network component manifests compile cleanly"
  else
    check_fail "NetworkPolicy Component" "Failed to compile strict-network component"
  fi

  if kubectl kustomize k8s/components/kyverno-policies >/dev/null 2>&1; then
    check_pass "Kyverno security policies compile cleanly"
  else
    check_fail "Kyverno Component" "Failed to compile kyverno-policies component"
  fi
else
  check_fail "kubectl Binary" "kubectl CLI not installed"
fi

# 6. Verify GitOps Flux Sync Manifests
echo ""
echo "--- 6. Validating GitOps Operator Declarations ---"
if [ -f "gitops/flux/ate-sync.yaml" ]; then
  check_pass "Flux v2 GitRepository and Kustomization manifests present"
else
  check_fail "Flux Manifest" "gitops/flux/ate-sync.yaml missing"
fi

echo ""
echo "================================================================================"
if [ "$FAILED" -eq 0 ]; then
  echo " DR PREFLIGHT RESULT: ALL CHECKS PASSED [READY FOR DISASTER RECOVERY]"
  echo "================================================================================"
  exit 0
else
  echo " DR PREFLIGHT RESULT: $FAILED CHECKS FAILED [ACTION REQUIRED]"
  echo "================================================================================"
  exit 1
fi
