# 📄 ATE Operations Platform - Complete Infrastructure & Deployment Plan

**Document Version**: `1.0 (Production Release)`  
**Target Cloud Provider**: Amazon Web Services (AWS) — `$100 Credit / Free Tier Eligible`  
**DevOps Stack**: Terraform IaC, Docker Multi-Stage, Nginx, Ansible, Kubernetes (K8s), GitLab CI  
**Application Architecture**: High-Performance Golang Microservice (`~15MB` image size) with Embedded Monochrome UI  
**Repository Branch**: [`dev`](https://gitlab.com/manveersyan-group/ate/-/tree/dev)

---

## 1. Executive Summary & Cost Strategy

This document defines the complete Infrastructure as Code (IaC) deployment architecture for the **ATE Operations Management Suite**. The microservice is written in **Golang (Go 1.22+)** with an embedded monospaced monochrome Web UI (`Inter` & `JetBrains Mono` typography).

### 💰 AWS Free Tier & $100 Credit Strategy
The entire infrastructure stack is optimized to run **100% within the AWS Free Tier** or using your **$100 AWS promotional credit**:
- **AWS EC2 (`t3.micro`)**: Eligible for 750 free compute hours/month.
- **AWS Security Group**: Free stateful firewall for Ports 80 (HTTP), 443 (HTTPS), 8080 (Go App), and 22 (SSH Admin).
- **AWS Elastic IP**: Free static public IPv4 address bound to your server.
- **Docker Engine**: Container runtime powering the 15MB Alpine Go microservice.

---

## 2. System Architecture Diagram

```
+-----------------------------------------------------------------------+
|                             CLIENT / BROWSER                          |
|                    (Minimal Monochrome Technical UI)                  |
+-----------------------------------------------------------------------+
                                   |
                         HTTP Port 8080 (REST API / UI)
                                   v
+-----------------------------------------------------------------------+
|                    AWS EC2 INSTANCE (t3.micro / Ubuntu)               |
|                                                                       |
|   +---------------------------------------------------------------+   |
|   |                  DOCKER ENGINE & CONTAINER                     |   |
|   |                  (Go Microservice - ~15MB)                     |   |
|   |                                                               |   |
|   |   +-------------------------+    +------------------------+   |   |
|   |   | REST API & Health Check |    | Thread-Safe Store      |   |   |
|   |   | (/api/v1/operations)    |    | (sync.RWMutex Engine)  |   |   |
|   |   +-------------------------+    +------------------------+   |   |
|   +---------------------------------------------------------------+   |
+-----------------------------------------------------------------------+
                                   |
       +---------------------------+---------------------------+
       |                           |                           |
       v                           v                           v
+--------------+           +--------------+           +------------------+
|  TERRAFORM   |           |   ANSIBLE    |           |    KUBERNETES    |
| (AWS EC2/EIP)|           | (Playbook)   |           | (Deployment/HPA) |
+--------------+           +--------------+           +------------------+
```

---

## 3. Infrastructure Components Breakdown

| Component | File / Location | Description |
| :--- | :--- | :--- |
| **AWS Compute** | `aws_instance.ate_server` | Ubuntu 22.04 LTS `t3.micro` server instance (750 free hours/month). |
| **AWS Networking** | `aws_security_group.ate_sg` | Ingress firewall rules for Port 80, Port 443, Port 8080, and Port 22 (SSH). |
| **AWS Elastic IP** | `aws_eip.ate_eip` | Permanent static IPv4 address preventing DNS breakage on restarts. |
| **Terraform IaC** | [`terraform/aws_main.tf`](file:///Users/manveersingh/ATE/terraform/aws_main.tf) | Declarative automation provisioning EC2, Security Groups, Elastic IP, and bootstrapping Docker. |
| **Docker Engine** | [`Dockerfile`](file:///Users/manveersingh/ATE/Dockerfile) | Multi-stage build (`golang:alpine` ➔ `alpine:3.19`) producing a `~15MB` image. |
| **Ansible Automation** | [`ansible/playbook.yml`](file:///Users/manveersingh/ATE/ansible/playbook.yml) | Configuration management playbook for package installation, code pull, and health validation. |
| **Kubernetes Manifests** | [`k8s/`](file:///Users/manveersingh/ATE/k8s/) | Manifests for Deployment (3 replicas), Service, Ingress, and Horizontal Pod Autoscaler. |
| **GitLab CI/CD** | [`.gitlab-ci.yml`](file:///Users/manveersingh/ATE/.gitlab-ci.yml) | Automated 4-stage pipeline: `unit_tests`, `compile_binary`, `docker_build`, `deploy_staging`. |

---

## 4. Step-by-Step AWS Deployment Execution Guide

### Phase 1: Environment & AWS Credentials Setup
Obtain your AWS Access Key ID and Secret Access Key from **AWS Console > Security Credentials**, and export them in your workstation shell:

```bash
export AWS_ACCESS_KEY_ID="your_aws_access_key"
export AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
export AWS_DEFAULT_REGION="us-east-1"
```

---

### Phase 2: Automated Provisioning via Terraform
Navigate to the `terraform/` directory and execute the Terraform workflow:

```bash
cd terraform

# Initialize AWS Provider
terraform init

# Provision EC2, Security Group, Elastic IP, and bootstrap Docker
terraform apply -auto-approve
```

**Terraform Output Example**:
```bash
Outputs:

application_url = "http://54.210.xx.xx:8080"
healthcheck_url = "http://54.210.xx.xx:8080/health"
public_ip = "54.210.xx.xx"
```

---

### Phase 3: Health Verification
Test your live AWS deployment by curling the health endpoint:

```bash
curl http://<YOUR_AWS_PUBLIC_IP>:8080/health
```

**Expected JSON Response**:
```json
{
  "service": "ate-operations-go",
  "status": "healthy",
  "timestamp": "2026-09-01T19:00:00Z",
  "uptime": "running"
}
```

---

### Phase 4: Ansible Configuration Management
Run automated host configuration management across your servers:

```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

---

### Phase 5: Kubernetes Manifests Deployment (Optional K8s Cluster)
If deploying to an AWS EKS or Kubernetes cluster:

```bash
kubectl apply -f k8s/
```

---

## 5. DevOps Makefile Operational Commands

| Command | Description |
| :--- | :--- |
| `make build` | Compiles Go binary executable (`ate-app`) |
| `make run` | Compiles and executes local Go server |
| `make test` | Runs Go unit test suite (`store/store_test.go`) |
| `make docker-build` | Builds multi-stage Docker image (`~15MB` size) |
| `make tf-init` | Initializes Terraform working directory |
| `make tf-apply` | Provisions AWS EC2 & Elastic IP infrastructure |
| `make ansible-play` | Executes Ansible playbook configuration |
| `make k8s-apply` | Applies Kubernetes manifests to cluster |
| `make clean` | Removes compiled binary artifacts |
