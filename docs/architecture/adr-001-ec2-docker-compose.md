# ADR 001: Selection of EC2 + Docker Compose over EKS for Initial Stage

**Status**: Accepted  
**Date**: 2026-09-02  
**Deciders**: Platform Engineering Team  

---

## Context
The platform requires a production-ready infrastructure deployment for 3 initial microservices (`web-frontend`, `api-gateway`, `auth-service`).  
Constraints: Team size 2-5 developers, budget strictly under $200/month, zero-downtime deployment requirement.

## Decision
We choose **AWS EC2 (`t3.medium`) + Docker Compose + Nginx Reverse Proxy** over **Amazon EKS (Elastic Kubernetes Service)**.

## Trade-Off Analysis
- **Cost**: EKS control plane costs $72/month standalone + node costs (~$150/mo total minimum). EC2 `t3.medium` + RDS `db.t3.micro` costs ~$100/mo total.
- **Complexity**: EKS requires managing Ingress controllers, cert-manager, external-dns, storage classes, and complex IAM roles. Docker Compose uses familiar YAML declarations.

## Consequences
- Single EC2 host represents a single point of failure (mitigated by automated RDS backups and quick Terraform recreation).
- Horizontal auto-scaling requires manual instance resize or eventual EKS migration.

## Migration Trigger Criteria
Migrate to Amazon EKS when:
1. Monthly infrastructure budget exceeds $350/month.
2. Team grows beyond 8 developers.
3. Microservice count exceeds 15 containers.
