# Runbook: Deploying a New Microservice

**Target Audience**: Developers, Platform Engineers  
**Scope**: Adding a new service (e.g. `notification-service` on port `7000`) to `manveersyan-group`

---

## Step 1: Create Repository in GitLab Group
1. In GitLab UI, navigate to `manveersyan-group` -> **New Project** -> `notification-service`.
2. Push your initial codebase.

## Step 2: Add Production Multi-Stage Dockerfile
Ensure your service repository contains a production multi-stage `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production
EXPOSE 7000
CMD ["node", "dist/main.js"]
```

## Step 3: Create K3s Kubernetes Manifests (`k8s/base/`)
1. Create `k8s/base/notification-service/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  namespace: manveersyan-group
spec:
  replicas: 2
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
        - name: notification-service
          image: registry.gitlab.com/manveersyan-group/notification-service:latest
          ports:
            - containerPort: 7000
          readinessProbe:
            httpGet:
              path: /health
              port: 7000
```

2. Add resource entry to `k8s/base/kustomization.yaml`:
```yaml
resources:
  - notification-service/deployment.yaml
  - notification-service/service.yaml
```

3. Route endpoint in `k8s/base/ingress/ingress.yaml`:
```yaml
- path: /notification
  pathType: Prefix
  backend:
    service:
      name: notification-service-svc
      port:
        number: 80
```

## Step 4: Add Local Development Entry (`docker-compose/`)
In `docker-compose/docker-compose.yml`, add the local development service definition:

```yaml
  notification-service:
    image: ${REGISTRY_URL}/notification-service:latest
    container_name: app-notification-service
    restart: always
    ports:
      - "7000:7000"
    networks:
      - app-network
```

## Step 5: Commit & Deploy via GitLab CI
Commit and push to `dev`. The automated pipeline will run Trivy validation scans and deploy the new service to K3s automatically!
