# Platform Hardening & Maturity Audit — Project ATE

> **Document Classification**: Internal Engineering Architecture & Audit  
> **Target System**: Project ATE Central Platform (`manveersyan-group/ate`)  
> **Auditor**: Principal Platform & Kubernetes Security Engineer  
> **Date**: September 2026  
> **Status**: Completed Initial Assessment  

---

## 1. Executive Summary & Audit Context

Project ATE is a multi-tier microservices platform running containerized workloads on a lightweight Kubernetes (K3s) distribution deployed on AWS EC2 (`us-east-1`). The platform orchestrates four business microservices:
* **FATE (`web-frontend`)**: React / TypeScript Single Page Application (Port 3000)
* **GATE (`api-gateway`)**: Go API Gateway and routing proxy (Port 8080)
* **STATE (`auth-service`)**: Go Authentication & JWT service (Port 5000)
* **DATE (`notification-service`)**: Go Async Worker Pool for OTP/email dispatch (Port 7000)

The infrastructure is managed declaratively via OpenTofu (IaC), GitOps via Flux v2, and secret encryption via Mozilla SOPS + Age with native in-memory Flux v2 decryption. 

This audit evaluates the platform across twelve critical pillars: Infrastructure Architecture, Compute Sizing, K3s Datastore Security, Workload Hardening, RBAC, Network Security, TLS Lifecycle, Observability, CI/CD Supply Chain, Disaster Recovery, High Availability, and Operational Runbooks.

---

## 2. Current Architecture Breakdown

### 2.1 VPC & Network Topology
* **VPC CIDR**: `10.0.0.0/16` in `us-east-1` across two availability zones (`us-east-1a`, `us-east-1b`).
* **Subnet Architecture**:
  * Public Subnets: `10.0.1.0/24`, `10.0.2.0/24` with default route (`0.0.0.0/0`) mapped to an AWS Internet Gateway (`aws_internet_gateway.gw`).
  * Private Subnets: `10.0.10.0/24`, `10.0.11.0/24` with no outbound internet route (`0.0.0.0/0` eliminated).
* **FinOps Optimization**: AWS NAT Gateway and its associated Elastic IP were removed. The single EC2 instance resides in Public Subnet 1 (`10.0.1.0/24`) attached to an Elastic IP (`aws_eip.eip`). The AWS RDS PostgreSQL instance resides in the private subnet group. Internal VPC routing handles traffic between EC2 and RDS on TCP port 5432.
* **Firewalls**:
  * EC2 Security Group: Allows inbound HTTP (80/tcp), HTTPS (443/tcp), and SSH (22/tcp). Egress is unrestricted (`0.0.0.0/0`).
  * RDS Security Group: Strictly restricts inbound PostgreSQL (5432/tcp) to the EC2 Security Group ID (`ec2-sg`). Direct internet ingress is structurally impossible.

### 2.2 EC2 & K3s Topology
* **Instance Type**: Single `t3.small` (2 vCPU, 2GB physical RAM) running Ubuntu 22.04 LTS AMD64.
* **Storage & Memory Safety**: 20GB root gp3 EBS volume (encrypted). A 2GB Linux swapfile (`/swapfile`) provides memory headroom against sudden kernel OOM kills.
* **Instance Security**: IMDSv2 is enforced (`http_tokens = "required"`, `http_put_response_hop_limit = 1`). AWS SSM Agent is installed, and the instance attaches `AmazonSSMManagedInstanceCore`.
* **K3s Runtime**: Single-node K3s server using embedded SQLite datastore. Traefik L7 Ingress controller is enabled as the default ingress provider.

### 2.3 Ingress Architecture
* Traefik listens on ports 80 and 443. Path-based routing rules in `platform-ingress`:
  * `/` -> `web-frontend-svc:80`
  * `/api` -> `api-gateway-svc:80`
  * `/auth` -> `auth-service-svc:80`
  * `/notifications` -> `notification-service-svc:80`
* **Deficiency**: TLS termination is unconfigured (no cert-manager, no ACME / Let's Encrypt integration), and security response headers (HSTS, CSP, X-Frame-Options) are absent.

### 2.4 Relational Database Architecture
* **Engine**: PostgreSQL 15.7 on `db.t3.micro`.
* **Storage**: 20GB gp3 with auto-scaling to 100GB, KMS encrypted.
* **Parameters**: `log_connections = 1`, `log_disconnections = 1`.
* **Resilience**: `backup_retention_period = 7` days, `multi_az = false` (for cost reduction), `deletion_protection = true` in production.
* **Deficiencies**: `skip_final_snapshot = true` was set, `rds.force_ssl` is not explicitly set in the parameter group, and no staging database exists.

### 2.5 GitOps & CI/CD Flow
* **GitOps Model**: Strict pull-based GitOps using Flux v2 in the `flux-system` namespace.
* **GitRepository**: Tracks `https://gitlab.com/manveersyan-group/ate.git` on branch `dev` every 1 minute.
* **Kustomization**: Syncs `./k8s/overlays/production` into `manveersyan-group` with `decryption.provider: sops`.
* **CI/CD Pipeline (`.gitlab-ci.yml`)**:
  * Validates IaC (`tofu validate`) and manifests (`kubectl kustomize k8s/base`).
  * Runs Trivy config scan.
  * In the deploy stage, updates `newTag:` in `k8s/overlays/production/kustomization.yaml` and pushes with `[skip ci]`.
  * The CI runner holds no cluster access credentials.

### 2.6 Secret Lifecycle & Native SOPS Decryption
* **Encryption**: Asymmetric Age key (`age192pk2xs5v4dan3rl2hf4ex59m8v7wurj05gzvxpypwwlzc09kegsrc7cf7`).
* **Regex**: Target fields restricted to `^(data|stringData)$` via `.sops.yaml`.
* **In-Cluster Decryption**: Flux `kustomize-controller` utilizes native SOPS provider with the `sops-age` secret to decrypt `secret.enc.yaml` files strictly in-memory during sync.
* **Deficiencies**:
  * K3s datastore encryption at rest is disabled (secrets stored unencrypted in local SQLite).
  * Age private key has no automated out-of-band recovery from AWS KMS/Secrets Manager.
  * No secret scanning in CI/CD pipeline.

### 2.7 Observability Stack
* **Telemetry**: VictoriaMetrics (`victoriametrics/victoria-metrics:latest`) running with `-promscrape.config` on port 9090.
* **Dashboards**: Grafana (`grafana/grafana:10.2.0`) on port 3001 with Prometheus data source pointed to VictoriaMetrics.
* **Deficiencies**:
  * Centralized logging is completely missing.
  * Distributed tracing is not implemented.
  * Node and database alert rules are incomplete.
  * External synthetic uptime monitoring is unconfigured.

---

## 3. Gap Matrix & Severity Classification

| ID | Area | Current State | Risk | Severity | Recommended Change | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | K3s Security | Secrets stored plaintext in K3s SQLite datastore | Node compromise exposes all active production secrets | **CRITICAL** | Implement declarative K3s secrets encryption at rest with AES-CBC/AES-GCM provider | **PHASE 2** |
| **SEC-02** | Disaster Recovery | Age private key stored only locally in `~/.config/sops/` | Node loss + local workstation loss makes all GitOps secrets unrecoverable | **CRITICAL** | Implement AWS Secrets Manager + KMS automated recovery runbook and preflight validation | **PHASE 2** |
| **SEC-03** | Workload Identity | Pods use `default` ServiceAccount with auto-mounted API tokens | Compromised container can probe Kubernetes API | **HIGH** | Provision dedicated ServiceAccounts per service with `automountServiceAccountToken: false` | **PHASE 3** |
| **SEC-04** | Pod Security | Namespace lacks Pod Security Admission labels | Vulnerable to deployment of privileged or root containers | **HIGH** | Label namespace with `pod-security.kubernetes.io/enforce: restricted` | **PHASE 3** |
| **SEC-05** | Network Policy | Egress policy allows wide CIDR ranges; ingress allows all intra-namespace traffic | Lateral movement between microservices if any pod is breached | **HIGH** | Enforce default-deny ingress/egress; isolate FATE from RDS; allow CoreDNS strictly to `kube-system` | **PHASE 3** |
| **REL-01** | Reliability | `startupProbe` absent; liveness/readiness both point to identical generic `/health` | Slow startup kills pods prematurely; DB transient blip restarts healthy services | **HIGH** | Implement distinct startup, readiness, and liveness probes with rational thresholds | **PHASE 3** |
| **REL-02** | Capacity | Single `t3.small` (2GB RAM) running 8 app replicas + monitoring + K3s daemons | Severe RAM exhaustion, swap thrashing, potential OOM crashes | **HIGH** | Rigorous capacity audit, tune requests/limits, set single-node replicas to 1, evaluate `t3.medium` | **PHASE 2 / 3** |
| **OPS-01** | Observability | Zero centralized logging pipeline configured | Cannot investigate container crashes, panics, or security breaches post-restart | **HIGH** | Deploy lightweight log forwarder (Fluent Bit) shipping to CloudWatch Logs / Loki | **PHASE 5** |
| **OPS-02** | Observability | No distributed tracing across Go microservices | Cross-service latency bottlenecks and HTTP 5xx root causes are unobservable | **MEDIUM** | Implement OpenTelemetry instrumentation standards and Tempo / OTLP ingestion specs | **PHASE 5** |
| **OPS-03** | CI/CD | `k8s/overlays/production` not validated in CI; no secret scanning; images use `:latest` | Broken manifests reach GitOps loop; secrets leaked to Git; unrepeatable deploys | **HIGH** | Add Kustomize validation, Gitleaks scan, Trivy container audit, and immutable tag policy | **PHASE 4** |
| **OPS-04** | Environments | Staging overlay does not exist (`k8s/overlays/staging/`) | Untested changes deploy directly to production; credentials risk collision | **HIGH** | Build modular `k8s/overlays/staging` overlay with isolated configurations and secrets | **PHASE 6** |
| **FIN-01** | RDS Hardening | `skip_final_snapshot = true` in RDS configuration | Accidental database deletion results in catastrophic permanent data loss | **CRITICAL** | Set `skip_final_snapshot = false` with dynamic prefix, enforce TLS (`rds.force_ssl`) | **PHASE 2** |
| **SEC-06** | Supply Chain | No image signing (Cosign) or SBOM generation (Syft/CycloneDX) | Vulnerable to malicious image tampering or unvetted dependency vulnerabilities | **MEDIUM** | Integrate Syft SBOM generation and Cosign image verification architecture | **PHASE 4** |
| **GOV-01** | Governance | Competing ArgoCD manifest exists alongside authoritative Flux v2 | Dual control planes create configuration drift and confusion | **LOW** | Move ArgoCD manifest to `examples/` and formalize Flux v2 as the sole production engine | **PHASE 2** |
| **SRE-01** | Runbooks | Incomplete runbooks for node failure, secret rotation, and PostgreSQL recovery | High MTTR (Mean Time To Recovery) during high-severity production incidents | **HIGH** | Author comprehensive operational and incident response runbooks with exact commands | **PHASE 7** |

---

## 4. Audit Sign-off

The identified gaps are prioritized into immediate execution phases adhering to the architectural constraints: **No unnecessary tools, zero plaintext secrets, idempotent operations, and strict cost preservation.**
