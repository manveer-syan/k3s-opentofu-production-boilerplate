# Central Platform Infrastructure & GitOps Control Center

**GitLab Group**: [`manveersyan-group`](https://gitlab.com/manveersyan-group)  
**Infrastructure Repository**: [`manveersyan-group/ate`](https://gitlab.com/manveersyan-group/ate)  
**Cloud Provider**: AWS (`us-east-1`)  
**Container Orchestration**: K3s Kubernetes (Production) & Docker Compose (Local Dev)  
**IaC Engine**: OpenTofu (`>= 1.6.0`)  
**Security Standard**: AWS SSM Session Manager & Aqua Security Trivy DevSecOps  

---

## Executive Overview

This repository serves as the central **Infrastructure as Code (IaC)**, configuration management, and **GitOps orchestration center** for all microservices within the `manveersyan-group` organization.

It manages cloud resources on AWS, NetworkPolicies, zero-downtime rolling updates, and container ingress routing for microservices operating across the organization:
- **`web-frontend`**: React / Vite Dashboard UI
- **`api-gateway`**: Go API Routing Gateway
- **`auth-service`**: OAuth2 / JWT Security Microservice

---

## Architectural Topology

```
                                  Clients & Users
                                         |
                                         v
                               AWS Public Elastic IP
                                   (34.198.184.122)
                                         |
                                         v
                           K3s Traefik Ingress (80/443)
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
         v                               v                               v
web-frontend-svc:80             api-gateway-svc:80              auth-service-svc:80
  (Port 3000 Pods)               (Port 8080 Pods)                (Port 5000 Pods)
         |                               |                               |
         +-------------------------------+-------------------------------+
                                         |
                                         v
                              AWS RDS PostgreSQL (5432)
                               (Private Subnet VPC)
```

---

## Repository Structure

```
.
├── .gitlab-ci.yml                 # GitLab CI/CD Pipeline (Validate, Plan, Trivy, Deploy)
├── Makefile                       # Operator deployment shortcuts
├── README.md                      # Platform documentation
├── INFRASTRUCTURE_PLAN.md        # Architecture & deployment blueprint
├── ansible/                       # Configuration management & hardening playbooks
│   ├── ansible.cfg                # Ansible configuration
│   ├── inventory/hosts.ini        # Host inventory definition
│   └── site.yml                   # Master orchestration playbook
├── docker-compose/                # Local Development Stack (docker compose up)
│   ├── deploy.sh                  # Standalone Compose deployment helper
│   ├── docker-compose.yml         # Local microservice compose file
│   └── nginx/nginx.conf           # Local reverse proxy routing rules
├── docs/                          # Architecture decision records & runbooks
│   ├── architecture/              # ADR technical decision documentation
│   └── runbooks/                  # Emergency operational runbooks
├── k8s/                           # Production Kubernetes Manifests (K3s)
│   ├── base/                      # Core K8s manifests (Deployments, Services, Ingress)
│   └── overlays/production/       # Production Kustomize overlay (PDB, NetworkPolicy)
├── observability/                 # System monitoring stack (Prometheus & Grafana)
└── terraform/                     # OpenTofu Infrastructure as Code
    ├── backend.tf                 # Remote S3 state backend configuration
    ├── environments/              # Environment compositions (dev, production)
    └── modules/                   # Reusable infrastructure modules (VPC, EC2, RDS, S3, IAM, SG)
```

---

## Prerequisites

The platform operational environment requires the following toolchain:

- **OpenTofu**: `1.6.0` or higher
- **kubectl**: `1.28+`
- **AWS CLI**: `2.x` configured with `us-east-1` profile
- **Docker Engine**: `24.0+` with Compose plugin (`v2.x`)
- **Ansible**: `2.15+`
- **Git**: `2.30+`

---

## Quick Start Guide

### 1. Configure Cloud Credentials
Set environment variables for AWS authentication:

```bash
export AWS_ACCESS_KEY_ID="<your_access_key_id>"
export AWS_SECRET_ACCESS_KEY="<your_secret_access_key>"
export AWS_DEFAULT_REGION="us-east-1"
```

### 2. Provision Cloud Infrastructure (OpenTofu)
Navigate to the production environment directory and execute OpenTofu:

```bash
cd terraform/environments/production
tofu init
tofu plan
tofu apply -auto-approve
```

### 3. Access Live K3s Cluster (AWS SSM Session Manager)
Connect securely to your server without needing SSH key pairs:

```bash
aws ssm start-session --target i-0123456789abcdef0
```

---

## Ingress Routing & Service Matrix

Incoming traffic is routed by **K3s Traefik Ingress** based on path prefixes:

| Microservice | Container Image | Pod Port | Ingress Route |
| :--- | :--- | :--- | :--- |
| **`web-frontend`** | `registry.gitlab.com/manveersyan-group/web-frontend:latest` | `3000` | `/` |
| **`api-gateway`** | `registry.gitlab.com/manveersyan-group/api-gateway:latest` | `8080` | `/api` |
| **`auth-service`** | `registry.gitlab.com/manveersyan-group/auth-service:latest` | `5000` | `/auth` |

---

## Cost Optimization Matrix

Infrastructure resource allocation is structured to maintain total monthly cloud expenditure under $100:

| Resource Type | Resource Sizing | Subnet Layer | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **EC2 Host** | `t3.small` (2 vCPU, 2GB RAM + 2GB Swap) | Public Subnet | $15.00 |
| **Elastic IP** | Static EIP Allocation (`34.198.184.122`) | VPC Level | $0.00 |
| **RDS Database** | `db.t3.micro` (PostgreSQL 15.7) | Private Subnet | $15.00 |
| **S3 Storage** | Encrypted Log & State Bucket | Object Store | $0.06 |
| **Data Egress** | Standard AWS Egress | Internet | ~$10.00 |
| **Total Expenditure** | | | **~$40.06 / month** |

---

## Governance & CI/CD Security

1. **Aqua Security Trivy**: Automated IaC and Kubernetes misconfiguration scanning runs during the `validate` pipeline stage in [.gitlab-ci.yml](file:///Users/manveersingh/projectATE/ate/.gitlab-ci.yml).
2. **AWS SSM Access**: Zero public SSH exposure on port 22. Access is managed dynamically via IAM roles (`AmazonSSMManagedInstanceCore`).
3. **State Locking**: Remote OpenTofu state is backed by AWS S3 with DynamoDB table locking (`ate-tf-locks`).

---

## Engineering Ownership

- **Platform Team**: `manveersyan-group`
- **Repository Link**: [manveersyan-group/ate](https://gitlab.com/manveersyan-group/ate)
