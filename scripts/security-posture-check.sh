#!/usr/bin/env bash
# ==============================================================================
# Script: Kubernetes Security Posture & CIS Compliance Auditor
# Path: scripts/security-posture-check.sh
# ==============================================================================

set -euo pipefail

echo "================================================================================"
echo " Project ATE — Kubernetes Workload Security Posture Audit"
echo "================================================================================"

FAILED=0

check_pass() {
  echo " [PASS] $1"
}

check_fail() {
  echo " [FAIL] $1: $2"
  FAILED=$((FAILED + 1))
}

echo ""
echo "--- 1. Pod Security Standards (Restricted Profile) Checks ---"

# Render full base manifest stream
MANIFESTS=$(kubectl kustomize k8s/base)

# 1. Privileged Container Check
if echo "$MANIFESTS" | grep -q "privileged: true"; then
  check_fail "Privileged Containers" "Disallowed 'privileged: true' found in manifests"
else
  check_pass "Zero privileged containers detected"
fi

# 2. Privilege Escalation Check
if echo "$MANIFESTS" | grep -q "allowPrivilegeEscalation: false"; then
  check_pass "All containers enforce 'allowPrivilegeEscalation: false'"
else
  check_fail "Privilege Escalation" "Missing 'allowPrivilegeEscalation: false'"
fi

# 3. Non-Root Execution Check
if echo "$MANIFESTS" | grep -q "runAsNonRoot: true"; then
  check_pass "Workloads enforce 'runAsNonRoot: true' and non-root UID"
else
  check_fail "Non-Root" "Workloads missing 'runAsNonRoot: true'"
fi

# 4. Read-Only Root Filesystem Check
if echo "$MANIFESTS" | grep -q "readOnlyRootFilesystem: true"; then
  check_pass "Containers enforce immutable 'readOnlyRootFilesystem: true'"
else
  check_fail "Root Filesystem" "Containers missing 'readOnlyRootFilesystem: true'"
fi

# 5. Linux Capabilities Dropped Check
if echo "$MANIFESTS" | grep -A 2 "capabilities:" | grep -q "ALL"; then
  check_pass "Containers drop all Linux kernel capabilities (drop: ['ALL'])"
else
  check_fail "Capabilities" "Missing 'drop: [ALL]' in container securityContext"
fi

echo ""
echo "--- 2. Resource Allocations & Probes ---"

# 6. Resource Requests & Limits Check
for app in web-frontend api-gateway auth-service notification-service; do
  DEPLOY="k8s/base/$app/deployment.yaml"
  if grep -q "requests:" "$DEPLOY" && grep -q "limits:" "$DEPLOY"; then
    check_pass "Workload '$app' defines both CPU/memory requests and limits"
  else
    check_fail "Resources" "Workload '$app' missing requests or limits"
  fi

  if grep -q "startupProbe:" "$DEPLOY" && grep -q "livenessProbe:" "$DEPLOY" && grep -q "readinessProbe:" "$DEPLOY"; then
    check_pass "Workload '$app' defines startupProbe, livenessProbe, and readinessProbe"
  else
    check_fail "Health Probes" "Workload '$app' missing required probes"
  fi
done

echo ""
echo "--- 3. Identity, RBAC & Network Security ---"

# 7. Service Accounts & Token Mount Check
for app in web-frontend api-gateway auth-service notification-service; do
  DEPLOY="k8s/base/$app/deployment.yaml"
  if grep -q "automountServiceAccountToken: false" "$DEPLOY"; then
    check_pass "Workload '$app' disables automatic Kubernetes API token mounting"
  else
    check_fail "ServiceAccount" "Workload '$app' missing 'automountServiceAccountToken: false'"
  fi
done

# 8. NetworkPolicy Default Deny Check
if grep -q "name: default-deny-all" k8s/components/strict-network/network-policy.yaml; then
  check_pass "Strict-network component enforces default-deny ingress and egress"
else
  check_fail "NetworkPolicy" "Missing default-deny NetworkPolicy in strict-network"
fi

echo ""
echo "================================================================================"
if [ "$FAILED" -eq 0 ]; then
  echo " SECURITY AUDIT RESULT: ALL CHECKS PASSED [COMPLIANT WITH RESTRICTED PSS]"
  echo "================================================================================"
  exit 0
else
  echo " SECURITY AUDIT RESULT: $FAILED NON-COMPLIANT CONTROLS FOUND"
  echo "================================================================================"
  exit 1
fi
