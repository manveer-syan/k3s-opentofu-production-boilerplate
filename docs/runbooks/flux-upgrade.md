# Runbook: Flux v2 Operator & CRD Upgrades

## 1. Overview

Flux v2 components (`source-controller`, `kustomize-controller`, `helm-controller`, `notification-controller`) and their corresponding Custom Resource Definitions (CRDs) must be maintained to access security patches and performance improvements.

---

## 2. Upgrade Preflight

1. Check current installed Flux version:
   ```bash
   flux version
   flux check
   ```

2. Verify that there are no pending reconciliations or transient errors:
   ```bash
   flux get all -A
   ```

---

## 3. Upgrade Procedure via CLI

1. Update the local `flux` CLI binary:
   ```bash
   brew upgrade fluxcd/tap/flux
   # Or via curl:
   curl -s https://fluxcd.io/install.sh | sudo bash
   ```

2. Execute in-cluster upgrade:
   ```bash
   flux install --export > gitops/flux/flux-system.yaml
   # Or direct cluster update:
   flux install \
     --namespace=flux-system \
     --components=source-controller,kustomize-controller,helm-controller,notification-controller
   ```

3. If managing Flux manifests via GitOps:
   - Commit the updated `flux-system.yaml` to Git.
   - Reconcile the cluster:
     ```bash
     flux reconcile kustomization flux-system --with-source
     ```

---

## 4. Post-Upgrade Verification

1. Verify that all Flux controllers are healthy and running the new container versions:
   ```bash
   flux check
   kubectl -n flux-system get pods -o wide
   ```

2. Test an end-to-end reconciliation cycle:
   ```bash
   flux reconcile source git ate-repo
   flux reconcile kustomization ate-production --with-source
   ```

3. Confirm that native SOPS secret decryption functions properly:
   ```bash
   kubectl -n manveersyan-group get secrets
   ```
