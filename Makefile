# ==============================================================================
# Central Platform Infrastructure & Orchestration Makefile
# Group: manveersyan-group
# ==============================================================================

.PHONY: help tf-init tf-validate tf-plan tf-apply ansible-play k8s-apply

help:
	@echo "Central Infrastructure Commands for manveersyan-group:"
	@echo "  make tf-init        Initialize Terraform working directory"
	@echo "  make tf-validate    Validate Terraform configuration syntax"
	@echo "  make tf-plan        Generate Terraform execution plan"
	@echo "  make tf-apply       Provision infrastructure & wire group microservices"
	@echo "  make ansible-play   Execute Ansible playbook for multi-app host wiring"
	@echo "  make k8s-apply      Apply Kubernetes multi-service manifests"

tf-init:
	cd terraform && terraform init

tf-validate:
	cd terraform && terraform validate

tf-plan:
	cd terraform && terraform plan

tf-apply:
	cd terraform && terraform apply -auto-approve

ansible-play:
	cd ansible && ansible-playbook -i inventory.ini site.yml

k8s-apply:
	kubectl apply -f k8s/
