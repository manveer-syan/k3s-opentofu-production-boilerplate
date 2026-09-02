# Central Platform Infrastructure & GitOps Control Center

**GitLab Group**: `manveersyan-group`  
**Infrastructure Repository**: `manveersyan-group/ate`  
**Cloud Provider**: AWS (`us-east-1`)  
**Target Environment**: Multi-Service Enterprise Platform  

---

## Executive Overview

This repository serves as the central Infrastructure as Code (IaC), configuration management, and GitOps orchestration center for all applications within the `manveersyan-group` organization on GitLab.

It maintains cloud resources, network security controls, continuous delivery pipelines, and container routing for microservices operating across the organization, including `web-frontend`, `api-gateway`, and `auth-service`.

---

## Architectural Topology

```
                                  Clients & Users
                                         |
                                         v
                              AWS Public Elastic IP
                                         |
                                         v
                             Nginx Reverse Proxy (80/443)
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
         v                               v                               v
web-frontend:3000                 api-gateway:8080                auth-service:5000
 (Web Interface)                   (API Controller)               (Authentication)
         |                               |                               |
         +-------------------------------+-------------------------------+
                                         |
                                         v
                              RDS PostgreSQL (5432)
                               (Private Subnet)
```

---

## Repository Structure

```
.
├── .gitlab-ci.yml                 # Infrastructure GitOps pipeline definition
├── Makefile                       # Operator deployment shortcuts
├── README.md                      # Platform documentation
├── ansible/                       # Configuration management playbooks
│   ├── ansible.cfg                # Ansible configuration
│   ├── inventory/hosts.ini        # Host inventory definition
│   └── playbooks/                 # System hardening & app updating playbooks
├── docker-compose/                # Application container orchestration
│   ├── deploy.sh                  # Zero-downtime deployment script
│   ├── docker-compose.yml         # Production multi-service compose file
│   └── nginx/nginx.conf           # Reverse proxy routing rules
├── docs/                          # Architecture decision records & runbooks
│   ├── architecture/              # ADR technical decision documentation
│   └── runbooks/                  # Emergency operational runbooks
├── k8s/                           # Kubernetes cluster specifications (EKS path)
│   ├── base/                      # Core Kubernetes manifests
│   └── overlays/production/       # Production Kustomize overlay
├── observability/                 # System monitoring stack
│   ├── grafana/                   # Grafana dashboards & datasources
│   └── prometheus/                # Prometheus metrics collection rules
├── scripts/                       # Maintenance & secret generation scripts
├── templates/
│   └── app-pipeline.yml           # Reusable CI/CD component template for apps
└── terraform/                     # Modular Infrastructure as Code
    ├── backend.tf                 # Remote S3 state backend configuration
    ├── environments/              # Environment compositions (dev, staging, prod)
    └── modules/                   # Reusable infrastructure modules (VPC, EC2, RDS, S3, IAM)
```

---

## Prerequisites

The platform operational environment requires the following toolchain:

- **Terraform**: `1.5.0` or higher
- **AWS CLI**: `2.x` configured with `us-east-1` profile
- **Docker Engine**: `24.0+` with Compose plugin (`v2.x`)
- **Ansible**: `2.15+`
- **Git**: `2.30+`

---

## Quick Start Guide

### 1. Configure Cloud Credentials
Set local shell environment variables for AWS authentication:

```bash
export AWS_ACCESS_KEY_ID="<your_access_key_id>"
export AWS_SECRET_ACCESS_KEY="<your_secret_access_key>"
export AWS_DEFAULT_REGION="us-east-1"
```

### 2. Provision Cloud Infrastructure
Navigate to the production environment directory and execute Terraform:

```bash
cd terraform/environments/production
terraform init
terraform apply -auto-approve
```

### 3. Deploy Application Services
Execute the deployment script to pull container images and launch services:

```bash
cd '../../../docker-compose'
cp .env.example .env
./deploy.sh
```

---

## Microservices Ingress Routing Matrix

Incoming HTTP/HTTPS traffic is routed by Nginx to internal container targets based on path prefixes:

| Microservice | Container Image | Target Port | Ingress Route |
| :--- | :--- | :--- | :--- |
| **`web-frontend`** | `registry.gitlab.com/manveersyan-group/web-frontend:latest` | `3000` | `/` |
| **`api-gateway`** | `registry.gitlab.com/manveersyan-group/api-gateway:latest` | `8080` | `/api/` |
| **`auth-service`** | `registry.gitlab.com/manveersyan-group/auth-service:latest` | `5000` | `/auth/` |

---

## Cost Optimization Matrix

Infrastructure resource allocation is structured to maintain total monthly cloud expenditure under $150:

| Resource Type | Resource Sizing | Subnet Layer | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **EC2 Host** | `t3.medium` (2 vCPU, 4GB RAM) | Public Subnet | $30.00 |
| **Elastic IP** | Static EIP Allocation | VPC Level | $0.00 |
| **NAT Gateway** | Single Gateway | Public Subnet | $32.00 |
| **RDS Database** | `db.t3.micro` (PostgreSQL 15) | Private Subnet | $15.00 |
| **S3 Storage** | Encrypted Log Bucket | Object Store | $0.06 |
| **Data Egress** | Standard AWS Egress | Internet | ~$20.00 |
| **Total Expenditure** | | | **~$97.06 / month** |

---

## Compliance and Governance

1. **Static Code Analysis**: All Terraform files must pass `tflint` and `checkov` checks prior to merging into `main`.
2. **Secrets Management**: No plaintext secrets or SSH keys are allowed in source control. All variables must be populated via GitLab Masked Variables.
3. **State Locking**: Remote Terraform state is backed by S3 with DynamoDB table locking (`manveersyan-tf-locks`).

---

## Engineering Ownership

- **Platform Team**: `manveersyan-group`
- **Repository Link**: [manveersyan-group/ate](https://gitlab.com/manveersyan-group/ate)
