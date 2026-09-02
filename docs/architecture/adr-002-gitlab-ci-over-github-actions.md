# ADR 002: Selection of GitLab CI/CD over GitHub Actions

**Status**: Accepted  
**Date**: 2026-09-02  
**Deciders**: Platform Engineering Team  

---

## Context
The team requires a unified version control and CI/CD platform for all repositories in the `manveersyan-group` organization.

## Decision
We choose **GitLab.com Native CI/CD Pipelines** over GitHub Actions.

## Rationale
1. Native integration with GitLab Container Registry (`registry.gitlab.com/manveersyan-group/*`).
2. Native Multi-Project downstream pipeline triggers (`trigger: project`).
3. Built-in GitLab Environments integration for tracking deployments (`dev`, `staging`, `production`).
4. Native CI/CD Component Templates (`include: templates/app-pipeline.yml`).
