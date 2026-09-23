#!/usr/bin/env bash
# ==============================================================================
# Script: Master Platform Validation & Quality Assurance Gate
# Path: scripts/platform-validate.sh
# ==============================================================================

set -euo pipefail

echo "================================================================================"
echo " Project ATE — Master Platform Infrastructure & Manifest Validation Gate"
echo "================================================================================"

FAILED=0

check_pass() {
  echo " [PASS] $1"
}

check_fail() {
  echo " [FAIL] $1: $2"
  FAILED=$((FAILED + 1))
}

# 1. Shell Script Syntax Validation
echo ""
echo "--- 1. Validating Shell Script Syntax (bash -n) ---"
for script in scripts/*.sh; do
  if [ -f "$script" ]; then
    if bash -n "$script"; then
      check_pass "Syntax valid: $script"
    else
      check_fail "Script Syntax" "Syntax error in $script"
    fi
  fi
done

# 2. OpenTofu / Terraform IaC Validation
echo ""
echo "--- 2. Validating OpenTofu Infrastructure Code ---"
if command -v tofu >/dev/null 2>&1 || command -v terraform >/dev/null 2>&1; then
  IAC_BIN=$(command -v tofu || command -v terraform)
  
  if $IAC_BIN fmt -check -recursive terraform/ >/dev/null 2>&1; then
    check_pass "Terraform formatting check passed"
  else
    check_fail "Terraform Formatting" "Files in terraform/ require formatting (run 'tofu fmt -recursive')"
  fi

  if (cd terraform/environments/production && $IAC_BIN validate >/dev/null 2>&1); then
    check_pass "Production OpenTofu configuration validates cleanly"
  else
    check_fail "Terraform Validate" "Validation failed in terraform/environments/production"
  fi
else
  check_fail "IaC Binary" "Neither tofu nor terraform CLI available"
fi

# 3. Kubernetes Kustomize Manifest Compilation
echo ""
echo "--- 3. Validating Kubernetes Manifest Compilation ---"
if command -v kubectl >/dev/null 2>&1; then
  if kubectl kustomize k8s/base >/dev/null 2>&1; then
    check_pass "Kustomize base manifests compile cleanly"
  else
    check_fail "Kustomize Base" "Failed to compile k8s/base"
  fi

  if kubectl kustomize k8s/components/strict-network >/dev/null 2>&1; then
    check_pass "Kustomize strict-network component compiles cleanly"
  else
    check_fail "NetworkPolicy" "Failed to compile k8s/components/strict-network"
  fi

  if kubectl kustomize k8s/components/kyverno-policies >/dev/null 2>&1; then
    check_pass "Kustomize kyverno-policies component compiles cleanly"
  else
    check_fail "Kyverno" "Failed to compile k8s/components/kyverno-policies"
  fi

  if kubectl kustomize k8s/overlays/production >/dev/null 2>&1; then
    check_pass "Kustomize production overlay compiles cleanly"
  else
    check_fail "Production Overlay" "Failed to compile k8s/overlays/production"
  fi

  if kubectl kustomize k8s/overlays/staging >/dev/null 2>&1; then
    check_pass "Kustomize staging overlay compiles cleanly"
  else
    check_fail "Staging Overlay" "Failed to compile k8s/overlays/staging"
  fi
else
  check_fail "kubectl Binary" "kubectl CLI not available"
fi

# 4. Security Posture Checks
echo ""
echo "--- 4. Executing Security Posture Auditor ---"
if [ -x "scripts/security-posture-check.sh" ]; then
  if ./scripts/security-posture-check.sh >/dev/null 2>&1; then
    check_pass "Workloads comply with Kubernetes Restricted Pod Security Standards"
  else
    check_fail "Security Posture" "Non-compliant workloads detected by scripts/security-posture-check.sh"
  fi
fi

# 5. Disaster Recovery Preflight Readiness
echo ""
echo "--- 5. Executing Disaster Recovery Preflight Check ---"
if [ -x "scripts/dr-preflight.sh" ]; then
  if ./scripts/dr-preflight.sh >/dev/null 2>&1; then
    check_pass "Disaster recovery preflight checks passed"
  else
    check_fail "DR Preflight" "Preflight check failed in scripts/dr-preflight.sh"
  fi
fi

echo ""
echo "================================================================================"
if [ "$FAILED" -eq 0 ]; then
  echo " PLATFORM VALIDATION RESULT: ALL VALIDATION GATES PASSED [READY FOR GITOPS]"
  echo "================================================================================"
  exit 0
else
  echo " PLATFORM VALIDATION RESULT: $FAILED VALIDATION GATES FAILED"
  echo "================================================================================"
  exit 1
fi
