# 🚀 ATE Operations Management Suite (Golang Backend)

A lightweight, high-performance operational control platform built using **Golang (Go 1.22+)** with an embedded web UI, thread-safe in-memory store, REST API, and a complete **DevOps stack** (Dockerfile, Docker Compose, Nginx, GitLab CI, Makefile).

---

## 🌟 Key Features & Operations (CRUD)

- ⚡ **Go REST API & Server**: Built with Go standard library `net/http` and `embed` package for single binary distribution.
- ➕ **CREATE**: Add operations with Title, Category, Priority, Status, Lead, Due Date, Estimated Hours.
- 👁️ **READ**: Filter by category, priority, status, and search query. Card Grid, Data Table, and Analytics views.
- ✏️ **UPDATE**: Edit operation fields or status transitions via REST API (`PUT /api/v1/operations/{id}`).
- 🗑️ **DELETE**: Soft-archive or permanent removal (`DELETE /api/v1/operations/{id}`).
- 📊 **METRICS**: Live stats via `/api/v1/stats`.
- 🏥 **HEALTHCHECK**: Monitoring endpoint at `/health` returning JSON status.

---

## 🛠️ DevOps Infrastructure

```
ATE/
├── main.go                 # Go entry point & HTTP router
├── go.mod                  # Go module definition
├── models/                 # Operation & Stats schema structs
├── store/                  # Thread-safe in-memory store (sync.RWMutex)
├── handlers/               # REST API handlers (/api/v1/operations, /health)
├── static/                 # Embedded static Web UI (index.html, CSS, JS)
├── Dockerfile              # Multi-stage build (~15MB runtime image)
├── docker-compose.yml      # Go service container stack
├── Makefile                # Command shortcuts (make build, make test, etc.)
├── .gitlab-ci.yml          # GitLab CI pipeline for Go testing & Docker build
└── scripts/
    └── healthcheck.sh      # Health check script
```

---

## 🚀 Quick Start Guide

### 1. Run with Go CLI
```bash
# Build binary
go build -o ate-app main.go

# Run server
./ate-app
# App listening at http://localhost:8080
```

### 2. Run Tests
```bash
go test -v ./...
```

---

## 🐳 Docker Deployment

### Multi-Stage Build (~15MB size)
```bash
# Build image
docker build -t ate-operations-go:latest .

# Run container
docker run -d -p 8080:8080 --name ate-go ate-operations-go:latest

# Healthcheck
curl http://localhost:8080/health
```

---

## 🛠️ Makefile Commands

| Command | Description |
| :--- | :--- |
| `make build` | Compile Go binary |
| `make run` | Compile and start Go server |
| `make test` | Run Go unit tests |
| `make docker-build` | Build minimal (~15MB) Docker image |
| `make docker-run` | Launch container on port 8080 |
| `make healthcheck` | Curl test against `/health` route |
