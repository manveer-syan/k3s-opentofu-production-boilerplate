# ATE Operations Suite - Golang & IaC Makefile

APP_NAME = ate-operations-go
BINARY = ate-app
PORT = 8080

.PHONY: help build run test clean docker-build docker-run docker-stop tf-init tf-apply ansible-play k8s-apply

help:
	@echo "Available Go & IaC commands:"
	@echo "  make build          Compile Go executable binary"
	@echo "  make run            Run compiled Go application"
	@echo "  make test           Execute Go unit tests"
	@echo "  make docker-build   Build multi-stage Docker image"
	@echo "  make tf-init        Initialize Terraform working directory"
	@echo "  make tf-apply       Apply Terraform infrastructure provisioning"
	@echo "  make ansible-play   Run Ansible automation playbook"
	@echo "  make k8s-apply      Apply Kubernetes manifests to cluster"
	@echo "  make clean          Remove binary executable"

build:
	go build -o $(BINARY) main.go

run: build
	./$(BINARY)

test:
	go test -v ./...

docker-build:
	docker build -t $(APP_NAME):latest .

tf-init:
	cd terraform && terraform init

tf-apply:
	cd terraform && terraform apply -auto-approve

ansible-play:
	cd ansible && ansible-playbook -i inventory.ini playbook.yml

k8s-apply:
	kubectl apply -f k8s/

clean:
	rm -f $(BINARY)
