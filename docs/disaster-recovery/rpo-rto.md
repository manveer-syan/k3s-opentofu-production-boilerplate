# Disaster Recovery Metrics: RPO & RTO Specifications

> **Target System**: Project ATE Cloud Platform  
> **Environment**: Production (`manveersyan-group`)  
> **Classification**: SRE / Business Continuity Architecture  

---

## 1. Terminology & Principles

* **Recovery Point Objective (RPO)**: The maximum acceptable data loss measured in time backward from an incident. Answers: *"How much transactional data can the business afford to lose?"*
* **Recovery Time Objective (RTO)**: The maximum acceptable duration of downtime before the system is restored to service. Answers: *"How long can the platform afford to be offline during an outage?"*

---

## 2. Target Metrics by Subsystem

The following targets represent the engineered capability and Service Level Objectives (SLOs) for Project ATE under the cost-optimized single-node architecture:

| Subsystem | Storage / State Engine | Backup / Replication Mechanism | Proposed RPO | Proposed RTO | Recovery Path |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Relational Database** | AWS RDS PostgreSQL 15.7 (`gp3`) | Automated Snapshots (7-day retention) + Continuous WAL Streaming (PITR) | **< 5 minutes** | **< 45 minutes** | Restore to Point-in-Time using AWS Console / CLI to a new RDS instance |
| **Kubernetes Workloads** | Stateless K3s Pods | Git SSoT (`manveersyan-group/ate`) + GitLab Container Registry | **0 minutes** | **< 15 minutes** | Automated GitOps reconciliation via Flux v2 from Git commit SHA |
| **Secrets & Credentials** | Kubernetes Secrets / SOPS Age | AWS Secrets Manager (KMS encrypted) + Git ciphertext (`secret.enc.yaml`) | **0 minutes** | **< 5 minutes** | Stream Age master key from Secrets Manager into in-cluster `sops-age` secret |
| **Cloud Infrastructure** | AWS VPC, Subnets, SG, IAM, EIP | OpenTofu IaC with S3 remote state and DynamoDB lock | **0 minutes** | **< 20 minutes** | Run `tofu apply` from CI/CD or authorized administrative runner |
| **Metrics & Telemetry** | VictoriaMetrics (`/victoria-metrics-data`) | Git provisioned Grafana dashboards + VictoriaMetrics disk volume | **24 hours** *(Acceptable loss)* | **< 10 minutes** | Re-deploy observability stack; fresh metrics scrape starts immediately |

---

## 3. Detailed Failure Scenarios & Recovery Walkthrough

### Scenario A: Single Microservice Failure or Bad Deployment
* **Impact**: One service returns 5xx errors or enters `CrashLoopBackOff`.
* **RPO**: 0 seconds.
* **RTO**: **< 2 minutes**.
* **Mitigation**:
  * GitOps rollback: Revert the tag commit in Git (`git revert HEAD && git push`). Flux detects the revert within 60 seconds and rolls back the Deployment.
  * Break-glass: `kubectl rollout undo deployment/<service-name> -n manveersyan-group`.

### Scenario B: EC2 Hardware Failure / Host Termination
* **Impact**: Total outage of web frontend, API gateway, auth, and notification services. RDS remains completely healthy in the private subnet.
* **RPO**: 0 seconds (all state is in RDS; all config is in Git).
* **RTO**: **< 30 minutes**.
* **Mitigation**:
  1. Re-run OpenTofu: `tofu apply` provisions a replacement `t3.small` / `t3.medium` EC2 host attached to the existing Elastic IP.
  2. Bootstrap script installs K3s with secrets encryption at rest enabled.
  3. Inject SOPS Age key from AWS Secrets Manager directly into `sops-age` secret.
  4. Apply `gitops/flux/ate-sync.yaml`. Flux pulls all manifests and starts containers.

### Scenario C: PostgreSQL Data Corruption or Accidental Table Drop
* **Impact**: Database schema or table data corrupted; applications fail database queries.
* **RPO**: **< 5 minutes** (data loss limited to the uncommitted or unarchived transaction window).
* **RTO**: **< 45 minutes** (AWS automated instance spin-up time).
* **Mitigation**:
  1. Identify the exact UTC timestamp prior to the corruption incident.
  2. Launch a Point-in-Time Recovery (PITR) instance:
     ```bash
     aws rds restore-db-instance-to-point-in-time \
       --source-db-instance-identifier manveersyan-prod-db \
       --target-db-instance-identifier manveersyan-prod-db-restored \
       --restore-time 2026-09-23T14:30:00Z \
       --db-subnet-group-name manveersyan-prod-rds-subnet-group \
       --vpc-security-group-ids sg-xxxxxxxxxxxxxxxxx
     ```
  3. Update application database endpoint pointer in `params.env` and push via GitOps.

---

## 4. Disaster Recovery Audit Checklist

* [x] Continuous automated database backups enabled with 7-day retention.
* [x] PostgreSQL database deletion protection enabled (`deletion_protection = true`).
* [x] Final snapshot configured on deletion (`skip_final_snapshot = false`).
* [x] Master encryption key replicated in AWS Secrets Manager.
* [x] All infrastructure configurations maintained 100% in Git.
* [ ] Automated DR drill executed semi-annually.
