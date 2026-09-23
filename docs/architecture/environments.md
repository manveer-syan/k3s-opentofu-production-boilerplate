# Multi-Environment Architecture & GitOps Promotion Standard

> **Document Version**: 1.0.0  
> **Target Environments**: Staging (`staging-manveersyan-group`) & Production (`manveersyan-group`)  
> **Orchestrator**: Flux v2 + Kustomize  

---

## 1. Environment Topology & Architectural Separation

Project ATE enforces strict isolation between Staging and Production to prevent staging tests from degrading or corrupting live user data:

| Dimension | Staging Environment (`k8s/overlays/staging/`) | Production Environment (`k8s/overlays/production/`) | Isolation Enforcement |
| :--- | :--- | :--- | :--- |
| **Namespace** | `staging-manveersyan-group` | `manveersyan-group` | Hard Kubernetes namespace separation |
| **Replicas** | **1 Replica** per service | **1–2 Replicas** per service | Patched via Kustomize overlay |
| **Database** | Isolated staging database (`staging_appdb`) | Production AWS RDS PostgreSQL (`appdb`) | Distinct database credentials & connection URLs |
| **Secrets** | Staging Age-encrypted (`secret.enc.yaml`) | Production Age-encrypted (`secret.enc.yaml`) | Independent cryptographic keys & secrets |
| **Logging Level** | `LOG_LEVEL=debug` | `LOG_LEVEL=info` | Set via `params.env` |
| **Hostnames** | `staging-ate.manveersyan.com` | `ate.manveersyan.com` | Traefik Ingress routing rules |
| **Tracing** | `OTEL_TRACES_SAMPLER=always_on` (100%) | `OTEL_TRACES_SAMPLER_ARG=0.10` (10%) | Resource throttling in production |

---

## 2. GitOps Promotion Lifecycle

Promoting code changes from a developer's feature branch to production follows this disciplined pipeline:

```text
[ Feature Branch ]
       │
       ▼ git push / Merge Request
[ GitLab CI Build & Validation ]
       │  - Tofu syntax & lint
       │  - Unit tests & container compilation
       │  - Trivy vulnerability scan
       │  - CycloneDX SBOM generation
       ▼
[ Staging Deployment ]
       │  - GitLab CI updates newTag in k8s/overlays/staging/kustomization.yaml
       │  - Flux v2 synchronizes staging namespace
       │  - Automated non-destructive smoke tests execute
       ▼
[ Manual Quality Gate & Approval ]
       │  - QA / Engineering sign-off on staging behavior
       ▼
[ Production Release ]
       │  - Merge to main branch
       │  - GitLab CI updates newTag in k8s/overlays/production/kustomization.yaml
       │  - Flux v2 reconciles production namespace
       │  - Zero-downtime rolling update rolls pods
       ▼
[ Post-Deployment Verification ]
       - External uptime monitors confirm 200 OK
       - VictoriaMetrics & Grafana Golden Signals monitored
```

---

## 3. Strict Credential Separation Verification

To prevent cross-environment secret leaks:
1. `staging-manveersyan-group` secrets utilize separate database users (`staging_user`) and distinct JWT signing secrets.
2. The staging database is physically separate or resides in an isolated database name, ensuring database migrations are validated in staging before running against production tables.
