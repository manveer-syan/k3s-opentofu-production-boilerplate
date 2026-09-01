# 🌐 Central Infrastructure & Platform Engineering Repository

![GitLab Group](https://img.shields.io/badge/GitLab_Group-manveersyan--group-FC6D26?style=flat-square&logo=gitlab)
![Terraform](https://img.shields.io/badge/IaC-Terraform_Modular-7B42BC?style=flat-square&logo=terraform)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes_Group_Cluster-326CE5?style=flat-square&logo=kubernetes)
![Ansible](https://img.shields.io/badge/Automation-Ansible_Roles-EE0000?style=flat-square&logo=ansible)

This repository (`manveersyan-group/ate`) serves as the **Central Infrastructure & Platform Engineering Control Center** for the **`manveersyan-group`** on GitLab.

It contains no application source code. Instead, it provides the modular **Infrastructure as Code (IaC)**, **Ansible Playbooks**, **Kubernetes Cluster Manifests**, and **GitLab CI Multi-Project Pipelines** to provision, wire, and orchestrate all microservices in the `manveersyan-group` (e.g. `web-frontend`, `api-gateway`, `auth-service`).

---

## 📐 Group Infrastructure Architecture

```
+---------------------------------------------------------------------------------+
|                       GITLAB GROUP: manveersyan-group                            |
|                                                                                 |
|  +--------------------+    +--------------------+    +-----------------------+  |
|  |    web-frontend    |    |    api-gateway     |    |     auth-service      |  |
|  | (GitLab Repo #1)   |    | (GitLab Repo #2)   |    |  (GitLab Repo #3)     |  |
|  +--------------------+    +--------------------+    +-----------------------+  |
|            |                        |                        |                  |
|            +------------------------+------------------------+                  |
|                                     |                                           |
|                                     v (Pushes Container Images)                 |
|                   +------------------------------------+                        |
|                   |   GitLab Group Container Registry  |                        |
|                   | (registry.gitlab.com/manveersyan-g)|                        |
|                   +------------------------------------+                        |
+---------------------------------------------------------------------------------+
                                      |
                                      | (Wired & Provisioned By)
                                      v
+---------------------------------------------------------------------------------+
|              THIS REPO: manveersyan-group/ate (Central Infrastructure)          |
|                                                                                 |
|   +-------------------+    +--------------------+    +----------------------+   |
|   |  Terraform Modules|    |  Ansible Playbooks |    | Kubernetes Manifests |   |
|   | (EC2 / SG / EIP)  |    | (Host Provisioning)|    | (Ingress / Services) |   |
|   +-------------------+    +--------------------+    +----------------------+   |
+---------------------------------------------------------------------------------+
```

---

## 📂 Repository Directory Layout

```
ATE/
├── README.md               # Central Platform Architecture & Wiring Guide
├── INFRASTRUCTURE_PLAN.md  # Multi-App GitLab Group Orchestration Plan
├── Makefile                # Unified Infra operational targets
├── .gitlab-ci.yml          # Central Multi-Project Pipeline Runner
├── .gitignore              # Infra state & secret exclusions
├── terraform/              # Modular Infrastructure as Code (AWS/Docker)
│   ├── main.tf             # Central orchestration wiring group microservices
│   ├── variables.tf        # Shared group environment variables
│   ├── outputs.tf          # Group microservice URLs & Elastic IP output
│   └── modules/
│       ├── app_service/    # Reusable Microservice App Module
│       └── networking/     # Shared Security Group & Firewall Module
├── ansible/                # Configuration Management & Multi-App Wiring
│   ├── inventory.ini       # Platform host inventory
│   ├── site.yml            # Main playbook
│   └── roles/
│       ├── common/         # Host preparation & Docker setup
│       └── wire_apps/      # Wire group containers together
└── k8s/                    # Enterprise Kubernetes Manifests
    ├── 00-namespace.yaml   # Dedicated manveersyan-group namespace
    ├── 01-ingress.yaml     # Group Ingress Router (path-based routing)
    └── apps/               # Declarative microservice manifests
        ├── web-frontend.yaml
        ├── api-gateway.yaml
        └── auth-service.yaml
```

---

## 🛠️ Group Microservices Integration Matrix

| Microservice | Container Port | Exposed Host Port | Subdomain / Ingress Path |
| :--- | :--- | :--- | :--- |
| **`web-frontend`** | `3000` | `3000` | `app.manveersyan.com/` |
| **`api-gateway`** | `8080` | `8080` | `app.manveersyan.com/api` |
| **`auth-service`** | `5000` | `5000` | `app.manveersyan.com/auth` |

---

## 🚀 Provisioning & Wiring Commands

### 1. Terraform Infrastructure Provisioning
```bash
cd terraform
terraform init
terraform apply -auto-approve
```

### 2. Ansible Host Provisioning & App Wiring
```bash
cd ansible
ansible-playbook -i inventory.ini site.yml
```

### 3. Kubernetes Multi-Service Cluster Deployment
```bash
kubectl apply -f k8s/
```
