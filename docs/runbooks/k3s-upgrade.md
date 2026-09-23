# Runbook: K3s Cluster Upgrades & Maintenance

## 1. Overview

K3s distributes major, minor, and patch releases following Kubernetes upstream versions. Upgrades in a single-node cluster will briefly interrupt the Kubernetes API Server (typically 15-45 seconds), while existing running pods continue to operate via containerd.

- **Current Version**: v1.28.x+k3s1
- **Upgrade Path Rule**: Upgrade one minor version at a time (e.g., 1.28 -> 1.29 -> 1.30). Never skip minor versions.

---

## 2. Pre-Upgrade Verification

1. Review upstream K3s release notes for deprecated APIs and breaking changes.
2. Confirm current cluster and node health:
   ```bash
   kubectl get nodes -o wide
   kubectl get pods -A | grep -v -E 'Running|Completed'
   ```
3. Backup the SQLite/etcd datastore:
   ```bash
   sudo k3s secrets-encrypt status
   # Trigger on-demand snapshot
   sudo k3s etcd-snapshot save --name pre-upgrade-backup
   # Or for SQLite:
   sudo cp /var/lib/rancher/k3s/server/db/state.db /var/lib/rancher/k3s/server/db/state.db.bak
   ```
4. Verify all workloads compile cleanly:
   ```bash
   ./scripts/platform-validate.sh
   ```

---

## 3. In-Place Upgrade Execution

1. Suspend Flux reconciliation to prevent race conditions during restart:
   ```bash
   flux suspend kustomization ate-production
   ```

2. Upgrade K3s binary on the EC2 host:
   ```bash
   # Target specific release channel or version
   curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="v1.29.2+k3s1" sh -
   ```

3. Restart the K3s systemd service:
   ```bash
   sudo systemctl restart k3s
   ```

4. Monitor systemd status:
   ```bash
   sudo systemctl status k3s --no-pager
   ```

---

## 4. Post-Upgrade Verification

1. Confirm node has reached `Ready` state with the new version:
   ```bash
   kubectl get nodes
   ```

2. Verify all core system pods are operational:
   ```bash
   kubectl -n kube-system get pods
   kubectl -n flux-system get pods
   ```

3. Resume Flux reconciliation:
   ```bash
   flux resume kustomization ate-production
   flux reconcile kustomization ate-production --with-source
   ```

4. Execute production smoke tests:
   ```bash
   ./scripts/production-smoke-test.sh
   ```
