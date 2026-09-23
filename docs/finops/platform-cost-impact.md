# FinOps Analysis: Production Infrastructure Cost Impact

## 1. Executive Summary

A core architectural tenet of Project ATE is disciplined FinOps. By intentionally avoiding AWS NAT Gateways ($32.40/mo base + $0.045/GB data processing per AZ) and deploying a lightweight single-node K3s cluster on an EC2 instance, the platform delivers enterprise-grade GitOps, container orchestration, and relational persistence at a fraction of standard hyperscaler costs.

This document profiles the exact monthly expenditures for:
1. **Mode A (Current Cost-Optimized Single Node on t3.small)**
2. **Mode A-Scale (Recommended Single Node on t3.medium)**
3. **Mode B (High Availability Multi-Node Multi-AZ)**
4. **Traditional Managed Kubernetes (EKS + RDS Multi-AZ + NAT Gateways)**

---

## 2. Comprehensive Cost Breakdown Matrix

*All pricing based on AWS `us-east-1` On-Demand rates as of 2026.*

| Component | Mode A (t3.small) | Mode A-Scale (t3.medium) | Mode B (3x t3.medium HA) | Traditional EKS HA |
| :--- | :--- | :--- | :--- | :--- |
| **Control Plane Fee** | $0.00 (K3s SQLite) | $0.00 (K3s SQLite) | $0.00 (K3s Kine/RDS) | $73.00 (EKS Cluster Fee) |
| **Compute Instances** | $15.18 (1x `t3.small`) | $30.37 (1x `t3.medium`) | $91.11 (3x `t3.medium`) | $91.11 (3x `t3.medium`) |
| **EBS Storage** | $1.60 (20GB gp3) | $2.40 (30GB gp3) | $7.20 (3x 30GB gp3) | $7.20 (3x 30GB gp3) |
| **Load Balancer** | $0.00 (HostPort) | $0.00 (HostPort) | $16.20 (AWS NLB) | $16.20 (AWS NLB) |
| **NAT Gateways** | $0.00 (Public Host) | $0.00 (Public Host) | $0.00 (Public Nodes) | $64.80 (2x NAT Gateways) |
| **Database (RDS)** | $17.52 (Single `db.t3.micro`) | $17.52 (Single `db.t3.micro`) | $35.04 (Multi-AZ `db.t3.micro`) | $35.04 (Multi-AZ `db.t3.micro`) |
| **RDS Storage & Backup** | $2.30 (20GB gp3 + snapshots)| $2.30 (20GB gp3 + snapshots)| $4.60 (40GB gp3 + snapshots)| $4.60 (40GB gp3 + snapshots)|
| **Secrets Manager** | $0.40 (1 secret) | $0.40 (1 secret) | $0.40 (1 secret) | $0.40 (1 secret) |
| **S3 & State Lock** | $0.20 (State bucket) | $0.20 (State bucket) | $0.20 (State bucket) | $0.20 (State bucket) |
| **Total Monthly Cost** | **$37.20 / mo** | **$53.19 / mo** | **$154.75 / mo** | **$292.55 / mo** |
| **Annual Run Rate** | **$446.40 / yr** | **$638.28 / yr** | **$1,857.00 / yr** | **$3,510.60 / yr** |

---

## 3. FinOps Architectural Levers & Savings Analysis

### 3.1 Elimination of AWS NAT Gateways ($388.80 / yr saved)
Traditional AWS reference architectures mandate placing Kubernetes nodes in private subnets with a managed NAT Gateway per Availability Zone.
- NAT Gateway fixed cost: 2 AZs * $0.045/hr * 730 hrs = **$65.70 / month** ($788.40/yr).
- **ATE Architectural Choice**: The EC2 K3s host is placed directly in the public subnet with strict security groups (inbound ports limited to 22, 80, 443; zero open admin ports). The RDS database resides in an isolated private subnet with zero internet routing. This completely eliminates NAT Gateway charges without compromising database isolation.

### 3.2 K3s vs. Managed EKS Control Plane ($876.00 / yr saved)
AWS charges a flat rate of $0.10/hour ($73.00/month) simply to keep an EKS control plane running, regardless of whether 1 pod or 1,000 pods are deployed.
- By running K3s, Project ATE maintains 100% Kubernetes API conformance, CRD support, and GitOps integration with **zero control plane licensing fees**.

### 3.3 VictoriaMetrics vs. Heavyweight Prometheus Stack
Traditional `kube-prometheus-stack` requires ~800MB to 1.5GB of RAM just for Prometheus TSDB buffers and Alertmanager, forcing an immediate upgrade to a larger EC2 instance.
- VictoriaMetrics requires only ~60MB RAM on idle and ~120MB under load, fitting comfortably within the memory envelope of a `t3.small` / `t3.medium`.

---

## 4. Cost Optimization Recommendations

1. **Adopt AWS Savings Plans or 1-Year Reserved Instances (RI)**:
   - Committing to a 1-year No-Upfront Compute Savings Plan for EC2 and RDS reduces total compute spend by **36% to 42%**, lowering Mode A-Scale from $53.19/mo to **~$34.50/mo**.
2. **Implement CloudWatch S3 Lifecycle Rules**:
   - Transition Terraform state logs and automated snapshot dumps older than 30 days to S3 Glacier Instant Retrieval.
