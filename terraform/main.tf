# ==============================================================================
# Terraform IaC Configuration for ATE Go Operations Suite
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

provider "docker" {}

# 1. Docker Image Resource
resource "docker_image" "ate_app" {
  name         = "ate-operations-go:latest"
  keep_locally = true
}

# 2. Docker Container Instance Resource
resource "docker_container" "ate_service" {
  name  = var.app_name
  image = docker_image.ate_app.image_id

  ports {
    internal = var.internal_port
    external = var.external_port
  }

  env = [
    "PORT=${var.internal_port}",
    "ENVIRONMENT=${var.environment}"
  ]

  healthcheck {
    test     = ["CMD", "curl", "-f", "http://localhost:8080/health"]
    interval = "15s"
    timeout  = "5s"
    retries  = 3
  }

  restart = "unless-stopped"
}
