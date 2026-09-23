# Site Reliability Engineering: SLI, SLO, SLA & Error Budgets

## 1. Overview and Principles

Project ATE defines Site Reliability Engineering standards based on Google SRE principles. This document codifies Service Level Indicators (SLIs), Service Level Objectives (SLOs), Service Level Agreements (SLAs), and operational Error Budget policies tailored to our single-node and high-availability operational profiles.

---

## 2. Core Service Classifications

Workloads are partitioned into three operational tiers:
1. **Tier 1 (Core Ingress & Auth)**: `api-gateway`, `auth-service`
2. **Tier 2 (User Interface & Notifications)**: `web-frontend`, `notification-service`
3. **Tier 3 (Observability & CI/CD Platform)**: VictoriaMetrics, Grafana, Flux

---

## 3. SLI / SLO / SLA Definitions

### 3.1 Tier 1: Core API & Authentication Services

| Dimension | Metric / SLI | SLO (30-Day Rolling) | SLA (Contractual) |
| :--- | :--- | :--- | :--- |
| **Availability** | Ratio of non-5xx HTTP requests to total HTTP requests | **>= 99.5%** (~3h 36m downtime) | **99.0%** (~7h 12m downtime) |
| **Latency (p95)** | Time from request received by Traefik to response written | **<= 250 ms** | <= 500 ms |
| **Latency (p99)** | Time from request received by Traefik to response written | **<= 750 ms** | <= 1500 ms |

### 3.2 Tier 2: Frontend & Notification Worker

| Dimension | Metric / SLI | SLO (30-Day Rolling) | SLA (Contractual) |
| :--- | :--- | :--- | :--- |
| **Frontend Availability** | Ratio of successful HTTP 200/304 requests for static assets | **>= 99.9%** | 99.5% |
| **Worker Queue Latency** | Time from notification event publish to worker receipt | **<= 5.0 seconds** (p95) | <= 30.0 seconds |
| **Delivery Success Rate** | Ratio of successfully dispatched notifications | **>= 99.0%** | 98.0% |

### 3.3 Infrastructure & GitOps SLIs

| System Component | Metric / SLI | Target Objective |
| :--- | :--- | :--- |
| **Flux Reconciliation** | Time from Git commit push to in-cluster deployment | **< 2.0 minutes** |
| **RDS Availability** | Percentage of successful TCP connections on port 5432 | **>= 99.95%** |
| **Host Node Uptime** | EC2 hypervisor reachability | **>= 99.5%** |

---

## 4. PromQL Formulas for Production SLIs

### Availability SLI (API Gateway):
```promql
sum(rate(traefik_service_requests_total{service="production-manveersyan-group-api-gateway@kubernetescrd", code!~"5.*"}[30d]))
/
sum(rate(traefik_service_requests_total{service="production-manveersyan-group-api-gateway@kubernetescrd"}[30d]))
```

### Latency SLI (p95 < 250ms):
```promql
histogram_quantile(0.95, sum(rate(traefik_service_request_duration_seconds_bucket{service="production-manveersyan-group-api-gateway@kubernetescrd"}[30d])) by (le)) <= 0.250
```

---

## 5. Error Budget Policy & Enforcement

For an SLO of **99.5%** over a 30-day period:
- Total Error Budget: **0.5%** of all requests or **216 minutes** of total downtime.

### Error Budget Consumption Escalation Matrix:

| Error Budget Consumed | Operational State | Permitted Actions | Engineering Consequences |
| :--- | :--- | :--- | :--- |
| **0% - 50%** | Green (Nominal) | Feature releases, refactoring, standard deployments | Standard GitOps velocity |
| **50% - 80%** | Amber (Elevated Risk) | Feature releases permitted with peer approval | Review flaky tests and latency regressions |
| **80% - 100%** | Orange (Budget Exhaustion Risk) | Only bug fixes and performance optimizations | Feature deployments frozen |
| **> 100%** | Red (Budget Breached) | Strict P0 / security patches only | Full engineering pause; post-mortem required |

---

## 6. SRE Golden Signals

Project ATE monitors the 4 Google SRE Golden Signals across all services:
1. **Latency**: Measured via Traefik request duration histograms and backend p95/p99 timers.
2. **Traffic**: Measured via HTTP request rate per second (`rate(requests_total[5m])`).
3. **Errors**: Measured via 5xx HTTP response rate and application error log lines.
4. **Saturation**: Measured via container memory/CPU utilization against limits, and RDS connection pool usage.
