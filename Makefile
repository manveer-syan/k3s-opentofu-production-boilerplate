# ==============================================================================
# Central Platform Infrastructure & Orchestration Makefile
# Project ATE — SSoT Infrastructure, GitOps & Orchestration
# ==============================================================================

SHELL := /usr/bin/env bash

.PHONY: help validate tf-fmt tf-validate tf-plan-prod k8s-build k8s-validate security-scan secret-scan capacity-report dr-preflight smoke-test flux-reconcile

help:
	@echo "Project ATE — Platform Engineering Commands:"
	@echo "  make validate         Run complete platform validation gate (IaC, manifests, security, DR)"
	@echo "  make tf-fmt           Format all OpenTofu configuration files"
	@echo "  make tf-validate      Validate OpenTofu dev and production environments"
	@echo "  make tf-plan-prod     Generate speculative OpenTofu plan for production"
	@echo "  make k8s-build        Verify Kustomize build compilation across base and components"
	@echo "  make k8s-validate     Audit Kubernetes manifests against Pod Security Standards"
	@echo "  make security-scan    Run security posture auditor and Kyverno policy checks"
	@echo "  make secret-scan      Run Gitleaks secret detection scanner"
	@echo "  make capacity-report  Generate CPU and Memory capacity and headroom breakdown"
	@echo "  make dr-preflight     Run automated disaster recovery preflight readiness checks"
	@echo "  make smoke-test       Execute automated production HTTP health and routing smoke tests"
	@echo "  make flux-reconcile   Trigger immediate in-cluster Flux GitOps reconciliation"

validate:
	./scripts/platform-validate.sh

tf-fmt:
	tofu fmt -recursive terraform/

tf-validate:
	@echo "Validating OpenTofu production environment..."
	cd terraform/environments/production && tofu init -backend=false > /dev/null && tofu validate
	@echo "Validating OpenTofu dev environment..."
	cd terraform/environments/dev && tofu init -backend=false > /dev/null && tofu validate

tf-plan-prod:
	cd terraform/environments/production && tofu plan

k8s-build:
	@echo "Compiling base manifests..."
	kubectl kustomize k8s/base > /dev/null
	@echo "Compiling strict-network component..."
	kubectl kustomize k8s/components/strict-network > /dev/null
	@echo "Compiling kyverno-policies component..."
	kubectl kustomize k8s/components/kyverno-policies > /dev/null
	@echo "Compiling production overlay..."
	kubectl kustomize k8s/overlays/production > /dev/null
	@echo "Compiling staging overlay..."
	kubectl kustomize k8s/overlays/staging > /dev/null
	@echo "All manifest layers and overlays compiled cleanly."

k8s-validate:
	./scripts/security-posture-check.sh

security-scan: k8s-validate
	@echo "Security posture checks completed."

secret-scan:
	@if command -v gitleaks > /dev/null; then \
		gitleaks detect --no-git -v; \
	else \
		echo "gitleaks binary not found locally; executing git diff security inspection"; \
		! git grep -E '(BEGIN (OPENSSH|RSA|EC|PGP) PRIVATE KEY)' -- ':!*.enc.yaml' ':!*.agekey'; \
	fi

capacity-report:
	./scripts/k8s-capacity-report.sh

dr-preflight:
	./scripts/dr-preflight.sh

smoke-test:
	./scripts/production-smoke-test.sh

flux-reconcile:
	flux reconcile source git ate-repo
	flux reconcile kustomization ate-production --with-source
