# Runbook: Flux v2 Reconciliation & Native SOPS Decryption Failure

## 1. Alert Summary

- **Triggered When**: Flux `Kustomization` or `GitRepository` enters `Ready: False` status for > 5 minutes, or Flux fails to decrypt `secret.enc.yaml`.
- **Severity**: High (P2)
- **Impact**: Kubernetes cluster state is out-of-sync with Git repository. New deployments, config updates, or security patches will not apply.

---

## 2. Immediate Diagnostic Triage

1. Inspect Flux Kustomization and GitRepository resources:
   ```bash
   flux get kustomizations -A
   flux get sources git -A
   ```

2. Inspect detailed error messages:
   ```bash
   kubectl -n flux-system describe kustomization ate-production
   ```

3. View Kustomize controller logs:
   ```bash
   kubectl -n flux-system logs -l app=kustomize-controller --tail=100
   ```

---

## 3. Common Failure Modes and Remediation

### Failure Mode 1: Age Key Missing or Inaccessible in Cluster
- **Symptom**: Error log shows `failed to decrypt secret: error decrypting ... no recipient matches the private keys`.
- **Cause**: The `sops-age` secret in `flux-system` is missing, was deleted, or does not contain the private key matching the public recipient in `.sops.yaml`.
- **Action**:
  1. Verify the secret exists:
     ```bash
     kubectl -n flux-system get secret sops-age
     ```
  2. Follow the recovery runbook: [recover-sops-age-key.md](recover-sops-age-key.md) to retrieve the key from AWS Secrets Manager and recreate the secret.
  3. Re-trigger reconciliation:
     ```bash
     flux reconcile kustomization ate-production --with-source
     ```

### Failure Mode 2: Git Authentication Failure / Deploy Key Expired
- **Symptom**: `GitRepository` shows `unable to clone: authentication failed`.
- **Cause**: GitLab deploy token or SSH key was revoked or expired.
- **Action**:
  1. Generate a new Project Deploy Token in GitLab (`Settings > Repository > Deploy Tokens` with `read_repository` scope).
  2. Update the `flux-system` secret:
     ```bash
     kubectl -n flux-system create secret generic ate-git-auth \
       --from-literal=username=<NEW_TOKEN_NAME> \
       --from-literal=password=<NEW_TOKEN_SECRET> \
       --dry-run=client -o yaml | kubectl apply -f -
     ```
  3. Trigger source reconciliation:
     ```bash
     flux reconcile source git ate-repo
     ```

### Failure Mode 3: Malformed Manifest / Invalid YAML Syntax
- **Symptom**: `kustomize build` error reported in Flux status.
- **Cause**: A recent Git commit contained invalid YAML syntax, missing schema fields, or referencing nonexistent resources.
- **Action**:
  1. Run local validation gate to catch the defect:
     ```bash
     ./scripts/platform-validate.sh
     ```
  2. Fix the offending file in Git and push a patch commit, or revert the faulty commit.
  3. Reconcile Flux immediately.

### Failure Mode 4: Drift / Stale Lock
- **Symptom**: Flux gets stuck waiting on resource deletion or suspended.
- **Action**:
  1. Check if kustomization is suspended:
     ```bash
     flux resume kustomization ate-production
     ```
  2. Force recreation of out-of-sync resources if safe.
