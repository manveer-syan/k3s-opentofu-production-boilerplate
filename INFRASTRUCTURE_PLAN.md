# 📄 Central Infrastructure & Multi-App Wiring Plan

**GitLab Group**: [`manveersyan-group`](https://gitlab.com/manveersyan-group)  
**Infrastructure Repository**: [`manveersyan-group/ate`](https://gitlab.com/manveersyan-group/ate/-/tree/dev)  
**Document Target**: Central Multi-Service Infrastructure & Platform Engineering  
**Orchestration Stack**: Modular Terraform, Ansible Roles, Kubernetes Ingress/Manifests, GitLab CI Multi-Project Pipeline

---

## 1. Architectural Strategy

This repository operates as the **Single Source of Truth for Platform Infrastructure** across the `manveersyan-group` organization. 

Application repositories (e.g. `web-frontend`, `api-gateway`, `auth-service`) focus strictly on feature development, building container images, and pushing them to the **GitLab Container Registry**:
`registry.gitlab.com/manveersyan-group/<service-name>:latest`

This repository manages the underlying cloud infrastructure (AWS EC2, Elastic IP, Security Groups), network routing, container orchestration, and wiring of all microservices into a unified platform.

---

## 2. Infrastructure Layer Breakdown

### A. Modular Terraform Infrastructure (`terraform/`)
- **[modules/networking/](file:///Users/manveersingh/ATE/terraform/modules/networking)**: Shared AWS Security Group opening Ports `80` (HTTP), `443` (HTTPS), `3000` (Web Frontend), `8080` (API Gateway), `5000` (Auth Service), and `22` (SSH).
- **[modules/app_service/](file:///Users/manveersingh/ATE/terraform/modules/app_service)**: Generic microservice container module pulling images from the GitLab Container Registry.
- **[main.tf](file:///Users/manveersingh/ATE/terraform/main.tf)**: Central orchestration file instantiating networking and wiring all group microservices.

### B. Ansible Roles & Configuration Management (`ansible/`)
- **[roles/common/](file:///Users/manveersingh/ATE/ansible/roles/common)**: Server preparation, security hardening, and Docker engine installation.
- **[roles/wire_apps/](file:///Users/manveersingh/ATE/ansible/roles/wire_apps)**: Pulls and wires container images for `web-frontend`, `api-gateway`, and `auth-service`.
- **[site.yml](file:///Users/manveersingh/ATE/ansible/site.yml)**: Master playbook orchestrating host configuration.

### C. Enterprise Kubernetes Orchestration (`k8s/`)
- **[00-namespace.yaml](file:///Users/manveersingh/ATE/k8s/00-namespace.yaml)**: Dedicated `manveersyan-group` cluster namespace.
- **[01-ingress.yaml](file:///Users/manveersingh/ATE/k8s/01-ingress.yaml)**: Ingress routing specs wiring sub-paths (`/`, `/api`, `/auth`) to their corresponding service pods.
- **[apps/](file:///Users/manveersingh/ATE/k8s/apps)**: Declarative deployments and service definitions for `web-frontend.yaml`, `api-gateway.yaml`, and `auth-service.yaml`.

---

## 3. Step-by-Step Deployment Commands

```bash
# 1. Provision Infrastructure & Wire Group Apps via Terraform
cd terraform
terraform init
terraform apply -auto-approve

# 2. Configure Host & Wire Containers via Ansible
cd ansible
ansible-playbook -i inventory.ini site.yml

# 3. Apply Multi-Service Kubernetes Manifests
kubectl apply -f k8s/
```
