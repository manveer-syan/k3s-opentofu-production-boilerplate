# Central Infrastructure & Multi-App Wiring Plan

**GitLab Group**: [`manveersyan-group`](https://gitlab.com/manveersyan-group)  
**Infrastructure Repository**: [`manveersyan-group/ate`](https://gitlab.com/manveersyan-group/ate)  
**Document Target**: Central Multi-Service Infrastructure & Platform Engineering  
**Orchestration Stack**: OpenTofu, K3s Kubernetes Kustomize, Ansible Roles, GitLab CI GitOps Pipeline  

---

## 1. Architectural Strategy

This repository operates as the **Single Source of Truth for Platform Infrastructure** across the `manveersyan-group` organization. 

Application repositories (e.g. `web-frontend`, `api-gateway`, `auth-service`) focus strictly on feature development, building container images, and pushing them to the **GitLab Container Registry**:
`registry.gitlab.com/manveersyan-group/<service-name>:latest`

This repository manages the underlying cloud infrastructure (AWS EC2, Elastic IP, Security Groups, S3, RDS), network routing via Traefik Ingress, container orchestration via K3s, and security hardening.

---

## 2. Infrastructure Layer Breakdown

### A. Modular OpenTofu Infrastructure (`terraform/`)
- **`modules/ec2`**: AWS EC2 instance profile (`t3.small`) with 2GB Swap space and AWS SSM Session Manager integration (`AmazonSSMManagedInstanceCore`).
- **`modules/iam`**: IAM roles and policy attachments for SSM, CloudWatch, and S3 access.
- **`modules/rds`**: Managed AWS RDS PostgreSQL instance in private VPC subnets.
- **`modules/s3`**: Encrypted log storage bucket with lifecycle retention rules and public access block.
- **`modules/security_groups`**: Stateful firewall security groups for EC2 host and RDS database.
- **`modules/vpc`**: Multi-AZ VPC network subnets, route tables, and Internet Gateway.

### B. Ansible System Hardening & Configuration (`ansible/`)
- **`roles/common/`**: System update, security hardening, Docker engine, and K3s prerequisites setup.
- **`site.yml`**: Master playbook orchestrating host configuration.

### C. Enterprise K3s Kubernetes Orchestration (`k8s/`)
- **`base/`**: Core Kubernetes resource manifests (`namespace.yaml`, `secret.yaml`, `ingress.yaml`, and service/deployment definitions for `web-frontend`, `api-gateway`, `auth-service`).
- **`overlays/production/`**: Production-specific Kustomize configuration (`pdb.yaml`, `network-policy.yaml`, replica scaling).

---

## 3. Step-by-Step Deployment Commands

```bash
# 1. Provision Cloud Infrastructure via OpenTofu
cd terraform/environments/production
tofu init
tofu apply -auto-approve

# 2. Configure Host System via Ansible
cd ../../../ansible
ansible-playbook -i inventory/hosts.ini site.yml

# 3. Roll Out Production Kubernetes Manifests to K3s Cluster
kubectl apply -k k8s/overlays/production
```
