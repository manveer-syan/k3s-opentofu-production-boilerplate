# Runbook: Service Down or Pod CrashLooping

## 1. Alert Summary

- **Triggered When**: Pod unavailable for > 2 minutes, CrashLoopBackOff detected, or HTTP 5xx error rate exceeds 5%.
- **Severity**: Critical (P1)
- **Impact**: User-facing requests failing for specific paths (`/`, `/api`, `/auth`, or `/notifications`).

---

## 2. Immediate Diagnostic Triage

1. Identify pods in non-running states:
   ```bash
   kubectl -n production-manveersyan-group get pods -o wide
   ```

2. Check recent pod events and restarts:
   ```bash
   kubectl -n production-manveersyan-group describe pod <POD_NAME>
   ```

3. Inspect current logs and previous crashed instance logs:
   ```bash
   # Current logs
   kubectl -n production-manveersyan-group logs <POD_NAME> --tail=100

   # Previous container logs before termination
   kubectl -n production-manveersyan-group logs <POD_NAME> --previous --tail=100
   ```

---

## 3. Common Failure Modes and Remediation

### Failure Mode 1: OOMKilled (Exit Code 137)
- **Symptom**: Pod status displays `OOMKilled` or last state termination reason is `OOMKilled`.
- **Cause**: Memory consumption exceeded container limit.
- **Action**:
  1. Verify current memory pressure: `kubectl top pod <POD_NAME> -n production-manveersyan-group`.
  2. If leak is suspected, isolate the pod and review memory profile.
  3. If legitimate traffic increase, update memory limits in `k8s/base/<service>/deployment.yaml` via GitOps commit.

### Failure Mode 2: Startup or Liveness Probe Failure
- **Symptom**: Events log shows `Unhealthy: Startup probe failed` or `Liveness probe failed`.
- **Cause**: Application failed to initialize within `failureThreshold * periodSeconds`, or database connection failed during startup.
- **Action**:
  1. Verify database reachable from cluster:
     ```bash
     nc -zv <RDS_ENDPOINT> 5432
     ```
  2. Verify secret injection: Ensure environment variables or mounted secrets are not null or malformed.
  3. Check application logs for unhandled panic during initialization.

### Failure Mode 3: Image Pull BackOff / ErrImagePull
- **Symptom**: Pod fails to pull container image from GitLab Container Registry.
- **Cause**: Registry credentials expired, invalid tag, or registry unreachable.
- **Action**:
  1. Inspect pod events: `kubectl -n production-manveersyan-group describe pod <POD_NAME> | grep -A 5 Events`.
  2. Verify image tag exists in GitLab Registry.
  3. Check image pull secret: `kubectl -n production-manveersyan-group get secret gitlab-registry-secret`.

---

## 4. Rollback and Recovery

If the failure was triggered by a recent deployment:
1. Revert the commit in `k8s/overlays/production/kustomization.yaml` that changed `newTag`.
2. Push to Git and trigger Flux reconciliation:
   ```bash
   flux reconcile kustomization ate-production --with-source
   ```
3. Verify that the previous healthy container image is restored.
