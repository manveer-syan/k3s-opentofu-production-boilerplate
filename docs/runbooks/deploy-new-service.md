# 📖 Runbook: Deploying a New Microservice

**Target Audience**: Developers, Platform Engineers  
**Scope**: Adding a new service (e.g. `payment-service` on port `7000`) to `manveersyan-group`

---

## Step 1: Create Repository in GitLab Group
1. In GitLab UI, navigate to `manveersyan-group` ➔ **New Project** ➔ `payment-service`.
2. Push your initial codebase.

## Step 2: Add Multi-Stage Dockerfile
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

## Step 3: Include CI/CD Component Template
In your application repository, create `.gitlab-ci.yml`:
```yaml
include:
  - project: 'manveersyan-group/ate'
    file: 'templates/app-pipeline.yml'

variables:
  APP_NAME: "payment-service"
```

## Step 4: Register Service in `docker-compose.yml`
In `manveersyan-group/ate` repo, edit `docker-compose/docker-compose.yml`:
```yaml
  payment-service:
    image: ${REGISTRY_URL}/payment-service:latest
    container_name: app-payment-service
    restart: always
    expose:
      - "7000"
    env_file:
      - .env
    networks:
      - app-network
```

## Step 5: Route Service in `nginx.conf`
In `docker-compose/nginx/nginx.conf`, add upstream & location block:
```nginx
upstream payment_service_upstream {
    server payment-service:7000;
}

location /payment/ {
    rewrite ^/payment/(.*)$ /$1 break;
    proxy_pass http://payment_service_upstream;
}
```

## Step 6: Add Prometheus Scrape Target
In `observability/prometheus/prometheus.yml`:
```yaml
  - job_name: 'payment-service'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['payment-service:7000']
```

## Step 7: Commit, Push & Deploy
Commit and push to `main` branch. The automated pipeline will build the container, register metrics, update Nginx routing, and deploy!
