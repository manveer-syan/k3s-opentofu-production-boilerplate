# 🚀 ATE Operations Control Platform

![Go Version](https://img.shields.io/badge/Go-1.22%2B-00ADD8?style=flat-square&logo=go)
![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=flat-square&logo=docker)
![GitLab CI](https://img.shields.io/badge/GitLab_CI-Pipeline-FC6D26?style=flat-square&logo=gitlab)
![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?style=flat-square&logo=terraform)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?style=flat-square&logo=kubernetes)
![Ansible](https://img.shields.io/badge/Automation-Ansible-EE0000?style=flat-square&logo=ansible)

A production-ready, high-performance operations management microservice engineered in **Golang**. Features an embedded minimalist monochrome Web UI (`Inter` & `JetBrains Mono` typography), thread-safe in-memory state engine (`sync.RWMutex`), RESTful API endpoints, and a complete **Infrastructure as Code (IaC)** deployment suite (**Terraform**, **Ansible**, **Kubernetes**, **GitLab CI**).

---

## 📐 Architecture Overview

```
+-----------------------------------------------------------------------+
|                             CLIENT / BROWSER                          |
|             (Minimalist Monochrome UI - Inter & JetBrains Mono)        |
+-----------------------------------------------------------------------+
                                   |
                         HTTP Port 8080 (REST / Static)
                                   v
+-----------------------------------------------------------------------+
|                         GOLANG HTTP SERVER                            |
|                                                                       |
|  +-----------------------+     +-----------------------------------+  |
|  |   http.FileServer     |     |          http.ServeMux            |  |
|  |  (embed.FS Static UI) |     |       (REST API & Health)         |  |
|  +-----------------------+     +-----------------------------------+  |
|                                                  |                    |
|                                                  v                    |
|                                +-----------------------------------+  |
|                                |     Thread-Safe Memory Store      |  |
|                                |         (sync.RWMutex)            |  |
|                                +-----------------------------------+  |
+-----------------------------------------------------------------------+
                                   |
       +---------------------------+---------------------------+
       |                           |                           |
       v                           v                           v
+--------------+           +--------------+           +------------------+
|  TERRAFORM   |           |   ANSIBLE    |           |    KUBERNETES    |
| (Docker Provider)|       | (Playbook Setup)|        | (Deployment/HPA) |
+--------------+           +--------------+           +------------------+
```

---

## 🛠️ Project Repository Structure

```
ATE/
├── main.go                 # Application entry point, embedded FS & HTTP router
├── go.mod                  # Go module definition
├── models/
│   └── operation.go        # Operation & OperationalStats data models
├── store/
│   ├── store.go            # Thread-safe in-memory store (sync.RWMutex)
│   └── store_test.go       # Go unit tests (100% test coverage)
├── handlers/
│   └── handlers.go         # REST API handlers (/api/v1/operations, /health, /stats)
├── static/                 # Embedded static Web UI
│   ├── index.html          # Minimalist HTML layout
│   ├── css/style.css       # Monochrome CSS with Inter & JetBrains Mono typography
│   └── js/app.js           # REST API client logic
├── terraform/              # Terraform / OpenTofu IaC manifests
│   ├── main.tf             # Docker provider & container resources
│   ├── variables.tf        # Input variable definitions
│   └── outputs.tf          # Endpoint outputs
├── ansible/                # Ansible Automation
│   ├── inventory.ini       # Target hosts inventory
│   └── playbook.yml        # Container deployment & health verification
├── k8s/                    # Kubernetes Declarative Manifests
│   ├── deployment.yaml     # 3-replica Deployment with Liveness & Readiness probes
│   ├── service.yaml        # NodePort Service (Port 30080)
│   ├── ingress.yaml        # Nginx Ingress routing controller
│   └── hpa.yaml            # Horizontal Pod Autoscaler (2 to 10 pods @ 70% CPU)
├── Dockerfile              # Multi-stage build (golang:alpine -> alpine:3.19 ~15MB)
├── docker-compose.yml      # Docker Compose orchestration with resource limits
├── .gitlab-ci.yml          # GitLab CI pipeline configuration
├── Makefile                # Developer & DevOps operational shortcuts
└── README.md               # Project documentation
```

---

## 🔌 REST API Specification

The microservice exposes a clean RESTful JSON API:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | DevOps monitoring healthcheck endpoint |
| `GET` | `/api/v1/stats` | System operational statistics & category breakdown |
| `GET` | `/api/v1/operations` | Query active operations (supports `category`, `priority`, `search`) |
| `POST` | `/api/v1/operations` | Create a new operation |
| `GET` | `/api/v1/operations/{id}` | Retrieve operation details by ID |
| `PUT` | `/api/v1/operations/{id}` | Update existing operation |
| `DELETE` | `/api/v1/operations/{id}` | Permanently delete operation |

### Sample Response: `GET /health`
```json
{
  "service": "ate-operations-go",
  "status": "healthy",
  "timestamp": "2026-09-01T17:30:00Z",
  "uptime": "running"
}
```

---

## 🚀 Local Development & Execution

### 1. Run via Go CLI
```bash
# Build standalone binary
go build -o ate-app main.go

# Start application server
./ate-app
# Application listening on http://localhost:8080
```

### 2. Execute Unit Tests
```bash
go test -v ./...
```

---

## 🐳 Docker Deployment

The `Dockerfile` utilizes a 2-stage build pipeline, compiling the Go binary statically and serving it from a lightweight Alpine Linux image (~15MB total image size).

```bash
# Build multi-stage Docker image
docker build -t ate-operations-go:latest .

# Run container instance
docker run -d -p 8080:8080 --name ate-go ate-operations-go:latest

# Verify health status
curl http://localhost:8080/health
```

---

## 🏗️ Infrastructure as Code (IaC) Guide

### 1. Terraform / OpenTofu (`terraform/`)
Provision container infrastructure declaratively:
```bash
cd terraform
terraform init
terraform apply -auto-approve
```

### 2. Ansible Automation (`ansible/`)
Execute host provisioning, image compilation, and automated health verification:
```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

### 3. Kubernetes Declarative Deployment (`k8s/`)
Deploy 3-replica cluster pods with Horizontal Pod Autoscaling:
```bash
kubectl apply -f k8s/
```

---

## 🛠️ Makefile Command Reference

| Target | Description |
| :--- | :--- |
| `make build` | Compile Go binary executable |
| `make run` | Compile and start local server |
| `make test` | Execute Go unit test suite |
| `make docker-build` | Build multi-stage (~15MB) Docker container image |
| `make tf-init` | Initialize Terraform environment |
| `make tf-apply` | Apply Terraform infrastructure provisioning |
| `make ansible-play` | Run Ansible deployment playbook |
| `make k8s-apply` | Apply Kubernetes manifests to cluster |
| `make clean` | Remove compiled binary executable |
