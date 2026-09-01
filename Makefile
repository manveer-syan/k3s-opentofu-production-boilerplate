# ATE Operations Suite - DevOps Makefile

APP_NAME = ate-operations-app
PORT = 8080

.PHONY: help install dev build docker-build docker-run docker-stop docker-logs clean healthcheck

help:
	@echo "Available commands:"
	@echo "  make install       Install npm dependencies"
	@echo "  make dev           Start local Vite development server"
	@echo "  make build         Build static production assets (dist/)"
	@echo "  make docker-build  Build Docker image"
	@echo "  make docker-run    Run Docker container on port $(PORT)"
	@echo "  make docker-stop   Stop and remove running container"
	@echo "  make docker-logs   View container logs"
	@echo "  make healthcheck   Perform HTTP health check against local container"
	@echo "  make clean         Remove build artifacts and node_modules"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

docker-build:
	docker build -t $(APP_NAME):latest .

docker-run:
	docker run -d --name $(APP_NAME) -p $(PORT):80 $(APP_NAME):latest

docker-stop:
	docker stop $(APP_NAME) || true
	docker rm $(APP_NAME) || true

docker-logs:
	docker logs -f $(APP_NAME)

healthcheck:
	@curl -s -f http://localhost:$(PORT)/health || (echo "Healthcheck Failed!" && exit 1)

clean:
	rm -rf dist node_modules
