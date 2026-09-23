# Kubernetes Identity & RBAC Security Specification

> **Document Version**: 1.0.0  
> **Target Cluster**: Project ATE K3s Cluster (`manveersyan-group`)  
> **Security Standard**: CIS Kubernetes Benchmark — Section 5 (RBAC and Service Accounts)  

---

## 1. Principles of Least Privilege & Threat Model

In vanilla Kubernetes deployments, pods default to using the namespace's `default` ServiceAccount. By default, the Kubernetes API token for this ServiceAccount is automatically mounted into every container filesystem at:
`/var/run/secrets/kubernetes.io/serviceaccount/token`

### The Security Risk
If an application container suffers a Remote Code Execution (RCE) or Path Traversal vulnerability, an attacker can extract this token and query the internal Kubernetes API (`https://kubernetes.default.svc`), mapping cluster workloads, scanning namespaces, and probing for privilege escalation paths.

### Project ATE RBAC Policy
1. **Decoupled Identity**: Every business microservice runs under a dedicated, named ServiceAccount.
2. **Token Mount Prohibition**: Applications that do not programmatically interact with the Kubernetes API server **MUST** explicitly set `automountServiceAccountToken: false`.
3. **No Cluster-Admin**: Workloads are strictly forbidden from binding to `cluster-admin` or possessing wildcard (`"*"`) verbs/resources.

---

## 2. Workload RBAC Matrix

| Component | Namespace | ServiceAccount Name | Kubernetes API Access Required? | Automount Token | Bound Roles / Privileges |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`web-frontend`** | `manveersyan-group` | `web-frontend-sa` | **No** (Static React UI) | **`false`** | None |
| **`api-gateway`** | `manveersyan-group` | `api-gateway-sa` | **No** (HTTP proxy to backend services) | **`false`** | None |
| **`auth-service`** | `manveersyan-group` | `auth-service-sa` | **No** (Database & JWT only) | **`false`** | None |
| **`notification-service`** | `manveersyan-group` | `notification-service-sa` | **No** (Database & SMTP only) | **`false`** | None |
| **`flux-source-controller`** | `flux-system` | `source-controller` | **Yes** (GitRepository CRD status updates) | `true` | Scoped to `flux-system` CRDs |
| **`flux-kustomize-controller`**| `flux-system` | `kustomize-controller` | **Yes** (Applies manifests to cluster) | `true` | Scoped via ServiceAccount impersonation |

---

## 3. Manifest Reference

All application ServiceAccounts are defined declaratively in `k8s/base/serviceaccounts.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-gateway-sa
  namespace: manveersyan-group
automountServiceAccountToken: false
```

And referenced in each Deployment pod template (`k8s/base/*/deployment.yaml`):

```yaml
spec:
  template:
    spec:
      serviceAccountName: api-gateway-sa
      automountServiceAccountToken: false
```

---

## 4. Verification & Audit Commands

To verify that the microservice ServiceAccounts have zero unauthorized API access:

```bash
# 1. Verify token mount is absent inside the running pod
kubectl exec -it deployment/api-gateway -n manveersyan-group -- ls /var/run/secrets/kubernetes.io/serviceaccount 2>&1
# Expected output: No such file or directory

# 2. Test RBAC permission boundaries using kubectl auth can-i
kubectl auth can-i list pods \
  --as=system:serviceaccount:manveersyan-group:api-gateway-sa \
  -n manveersyan-group
# Expected output: no

kubectl auth can-i get secrets \
  --as=system:serviceaccount:manveersyan-group:auth-service-sa \
  -n manveersyan-group
# Expected output: no
```
