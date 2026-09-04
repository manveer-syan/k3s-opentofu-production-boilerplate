# ADR 001: Selection of K3s Lightweight Kubernetes on EC2 over EKS and Monolithic Docker Compose

**Status**: Accepted  
**Date**: 2026-09-04  
**Deciders**: Platform Engineering Team  

---

## Context
The platform requires production-ready container orchestration for our microservices (`web-frontend`, `api-gateway`, `auth-service`) with zero-downtime rolling updates, self-healing pods, ingress routing, and PodDisruptionBudgets.  
Constraints: Single EC2 host (`t3.small`), low monthly budget strictly under $50/month, zero-downtime deployment requirement.

## Decision
We choose **K3s (Lightweight Kubernetes)** installed on an **AWS EC2 `t3.small` instance** (with 2GB Swap) using **Kustomize (`k8s/base` & `k8s/overlays/production`)**, with **Docker Compose** reserved strictly for local laptop development.

## Trade-Off Analysis
- **Cost**: Managed EKS control plane costs $72/month standalone + node fees (~$150/mo minimum). K3s on EC2 `t3.small` + RDS `db.t3.micro` costs ~$40/mo total.
- **Features**: K3s provides full Kubernetes API compatibility (`kubectl`, `Ingress`, `HPA`, `PDB`, `NetworkPolicy`) with minimal RAM overhead (~500MB).
- **Local Dev vs Production**: Developers use `docker-compose/` locally for zero-overhead iteration, while production uses declarative K3s Kubernetes manifests.

## Consequences
- Requires automated swap management (`/swapfile`) on `t3.small` to prevent OOM during node builds.
- Future migration to EKS will require zero manifest rewrites since standard `k8s/` manifests are used.
