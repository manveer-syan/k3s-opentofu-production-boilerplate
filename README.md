# 🚀 ATE Operations Management Suite

A professional, structured web application for task management and operational control, built with modern modular JavaScript, Vite, HTML5, CSS design system, and a complete **DevOps infrastructure stack** (Dockerfile, Docker Compose, Nginx, CI/CD, Makefile).

---

## 🌟 Features & Basic Operations (CRUD)

The application implements full **Create, Read, Update, Delete (CRUD)** operations with reactive state management and LocalStorage persistence:

* ➕ **CREATE**: Add new operations with Title, Category, Priority, Status, Lead, Due Date, Estimated Hours, and Tags. Smart field validation included.
* 👁️ **READ / VIEW**:
  * **Card Grid View**: Visual glassmorphic cards with status pills and priority badges.
  * **Data Table View**: Columnar view with sorting and row-level quick actions.
  * **Kanban Board View**: Column-based drag-and-drop workflow (`Backlog`, `To Do`, `In Progress`, `Under Review`, `Completed`).
  * **Analytics View**: Live KPI metrics, completion rates, category distribution, and workload breakdown.
* ✏️ **UPDATE**: Edit task details, status transitions, or inline drag-and-drop column changes.
* 🗑️ **DELETE**: Soft delete to Trash/Archive with 1-click restore, or permanent deletion via safety confirmation modal.
* 🔄 **UTILITIES**: Theme switcher (Dark/Light mode), JSON/CSV data export, and demo dataset seed reset.

---

## 🛠️ DevOps Infrastructure & Architecture

This repository includes a production-grade DevOps setup:

```
ATE/
├── Dockerfile              # Multi-stage Docker build (Node.js build -> Nginx alpine)
├── docker-compose.yml      # Service orchestration with healthchecks & resource limits
├── nginx.conf              # Production Nginx config with Gzip, caching, SPA routing, & /health
├── .dockerignore           # Optimized build context exclusions
├── Makefile                # Command shortcuts (make dev, make docker-build, etc.)
├── .gitlab-ci.yml          # GitLab CI/CD pipeline configuration
├── .github/workflows/ci.yml # GitHub Actions CI workflow
└── scripts/
    └── healthcheck.sh      # Automated health check validation script
```

---

## 🚀 Quick Start Guide

### 1. Git Branch Setup
Ensure you are on the `dev` branch:
```bash
git checkout dev
```

### 2. Local Development (Vite)
```bash
# Install dependencies
npm install

# Start development server
npm run dev
# Server running at http://localhost:3000
```

### 3. Production Static Build
```bash
npm run build
# Compiles output to dist/
```

---

## 🐳 Docker Deployment

### Using Docker & Nginx
```bash
# Build Docker image
docker build -t ate-operations-app:latest .

# Run container on port 8080
docker run -d -p 8080:80 --name ate-app ate-operations-app:latest

# Check health endpoint
curl http://localhost:8080/health
# Output: healthy
```

### Using Docker Compose
```bash
# Start container stack
docker-compose up -d --build

# View container status & health
docker-compose ps

# Stop stack
docker-compose down
```

---

## 🛠️ Convenience Makefile Commands

| Command | Description |
| :--- | :--- |
| `make install` | Install npm dependencies |
| `make dev` | Launch Vite dev server |
| `make build` | Build static dist directory |
| `make docker-build` | Build multi-stage Docker image |
| `make docker-run` | Run Docker container on port 8080 |
| `make docker-stop` | Stop and remove running Docker container |
| `make healthcheck` | Run curl test against `/health` endpoint |

---

## 🔄 CI/CD Pipeline

The project supports both **GitLab CI** and **GitHub Actions**:
* **Test & Lint Stage**: Installs dependencies and verifies static build.
* **Build Stage**: Compiles assets.
* **Docker Build Stage**: Containerizes application using Docker multi-stage build.
* **Health Check**: Automated validation against `/health` route.
