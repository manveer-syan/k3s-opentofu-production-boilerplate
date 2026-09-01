# ATE Operations Suite - Golang DevOps Makefile

APP_NAME = ate-operations-go
BINARY = ate-app
PORT = 8080

.PHONY: help build run test clean docker-build docker-run docker-stop healthcheck

help:
	@echo "Available Go commands:"
	@echo "  make build         Compile Go executable binary"
	@echo "  make run           Run compiled Go application"
	@echo "  make test          Execute Go unit tests"
	@echo "  make docker-build  Build multi-stage Docker image (~15MB)"
	@echo "  make docker-run    Run Docker container on port $(PORT)"
	@echo "  make docker-stop   Stop running container"
	@echo "  make healthcheck   Check /health REST API endpoint"
	@echo "  make clean         Remove binary executable"

build:
	go build -o $(BINARY) main.go

run: build
	./$(BINARY)

test:
	go test -v ./...

docker-build:
	docker build -t $(APP_NAME):latest .

docker-run:
	docker run -d --name $(APP_NAME) -p $(PORT):8080 $(APP_NAME):latest

docker-stop:
	docker stop $(APP_NAME) || true
	docker rm $(APP_NAME) || true

healthcheck:
	@curl -s -f http://localhost:$(PORT)/health || (echo "Healthcheck Failed!" && exit 1)

clean:
	rm -f $(BINARY)
