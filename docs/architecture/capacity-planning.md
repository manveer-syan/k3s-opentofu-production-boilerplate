# EC2 & K3s Capacity Planning & Resource Sizing Guide

> **Document Version**: 1.0.0  
> **Target Cloud Host**: AWS EC2 running Ubuntu 22.04 LTS + K3s v1.28+  
> **Target Workload**: 4 Go/React Microservices + Ingress + GitOps + Observability  

---

## 1. Workload Resource Inventory & Memory Footprint

To prevent Out-Of-Memory (OOM) kernel panics and continuous swap thrashing, all platform components are profiled below based on empirical operational baselines:

### 1.1 Host & System Daemon Baseline

| Component | Function | Resident Set Size (RSS RAM) | Base CPU Utilization |
| :--- | :--- | :--- | :--- |
| **Linux Kernel & OS** | Systemd, journald, udev, ufw, fail2ban, sshd | ~180 MB | 0.05 vCPU |
| **Containerd & Runc** | Container runtime engine | ~120 MB | 0.05 vCPU |
| **K3s Server Engine** | SQLite/kine datastore, API server, controller-manager, scheduler | ~380 MB | 0.15 vCPU |
| **Traefik Ingress** | L7 routing proxy & reverse proxy | ~80 MB | 0.05 vCPU |
| **CoreDNS** | Cluster internal DNS resolution | ~40 MB | 0.02 vCPU |
| **Metrics-Server** | In-cluster metrics aggregation for HPA/kubectl top | ~45 MB | 0.02 vCPU |
| **Flux v2 Operators** | `source-controller` + `kustomize-controller` | ~85 MB | 0.05 vCPU |
| **VictoriaMetrics** | Time-series scraper & PromQL engine | ~75 MB | 0.05 vCPU |
| **Grafana** | Visualization UI & dashboard engine | ~110 MB | 0.03 vCPU |
| **Node Exporter / Telemetry**| Hardware metrics collection | ~25 MB | 0.01 vCPU |
| **Subtotal Infrastructure** | **Platform Core Overhead** | **~1,140 MB** | **~0.48 vCPU** |

---

### 1.2 Microservice Workload Consumption

| Microservice | Architecture | Typical RSS Memory | CPU Usage (Idle/Burst) | Configured Request (RAM / CPU) | Configured Limit (RAM / CPU) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FATE (`web-frontend`)** | React / Nginx Static Bundle | ~45 MB | 0.02 / 0.10 vCPU | 64 MiB / 50m | 128 MiB / 250m |
| **GATE (`api-gateway`)** | Compiled Go Binary | ~55 MB | 0.03 / 0.20 vCPU | 96 MiB / 75m | 256 MiB / 500m |
| **STATE (`auth-service`)** | Compiled Go (bcrypt/crypto) | ~60 MB | 0.04 / 0.35 vCPU | 96 MiB / 75m | 256 MiB / 500m |
| **DATE (`notification-service`)**| Go Worker Pool (N=5) | ~50 MB | 0.02 / 0.15 vCPU | 64 MiB / 50m | 128 MiB / 250m |
| **Subtotal (1 Replica Each)** | **4 Microservices (N=1)** | **~210 MB** | **~0.11 / 0.80 vCPU** | **320 MiB / 250m** | **768 MiB / 1500m** |
| **Subtotal (2 Replicas Each)** | **8 Microservices (N=2)** | **~420 MB** | **~0.22 / 1.60 vCPU** | **640 MiB / 500m** | **1536 MiB / 3000m** |

---

## 2. Capacity Evaluation by Instance Type

### Option 1: `t3.small` (2 vCPU, 2,048 MB RAM) — **Cost-Optimized Minimum**
* **Monthly Cost**: ~$15.18 / month
* **Memory Headroom (1 Replica Mode)**:
  $2,048\text{ MB} - (1,140\text{ MB} + 210\text{ MB}) = \mathbf{698\text{ MB}}\text{ free buffer } (\mathbf{34\%}\text{ headroom})$.
* **Memory Headroom (2 Replicas Mode)**:
  $2,048\text{ MB} - (1,140\text{ MB} + 420\text{ MB}) = \mathbf{488\text{ MB}}\text{ free buffer } (\mathbf{23\%}\text{ headroom})$.
* **Verdict**: Perfectly viable for single-node development and low-traffic staging/production when backed by the 2GB swapfile. However, during burst traffic or image compilation, memory pressure can push pages into swap.

### Option 2: `t3.medium` (2 vCPU, 4,096 MB RAM) — **Recommended Production Standard**
* **Monthly Cost**: ~$30.37 / month (an increase of only +$15.19/mo)
* **Memory Headroom (2 Replicas Mode)**:
  $4,096\text{ MB} - (1,140\text{ MB} + 420\text{ MB}) = \mathbf{2,536\text{ MB}}\text{ free buffer } (\mathbf{62\%}\text{ headroom})$.
* **Verdict**: **The optimal production balance.** Provides ample memory cushion to run logging forwarders (Fluent Bit), trace collectors (Tempo), and handle database connection surges without touching swap.

### Option 3: `t4g.medium` (2 vCPU, 4,096 MB RAM — AWS Graviton2 ARM64)
* **Monthly Cost**: ~$24.53 / month (20% cheaper than `t3.medium` with ~40% better performance)
* **Architecture Constraint**: Requires compiling all Docker images for `linux/arm64` in addition to `linux/amd64`. If CI/CD runners only build AMD64 images, pods will fail with `exec format error`.
* **Recommendation**: Target as Phase 8 roadmap enhancement once multi-arch builds are standardized in GitLab CI.

---

## 3. Operational Headroom Targets & Scaling Triggers

To maintain stability without unmanaged degradation:

| Metric | Target Operational Ceiling | Warning Threshold | Critical Scaling Trigger |
| :--- | :--- | :--- | :--- |
| **Node Memory (Physical)** | < 70% Utilization | >= 80% for 10 min | >= 90% (Immediate vertical resize to `t3.medium`) |
| **Swap Usage** | 0 MB (Idle) | >= 128 MB active swap | >= 512 MB active swap (Indicates persistent RAM starvation) |
| **Node CPU (Load Average)** | < 1.0 (5m avg) | >= 1.6 for 15 min | >= 2.0 (Throttling CPU credits) |
| **Root EBS Disk Usage** | < 60% of 20GB | >= 75% | >= 85% (Run container image GC / expand gp3 volume) |
