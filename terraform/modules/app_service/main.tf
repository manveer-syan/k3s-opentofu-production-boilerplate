# ==============================================================================
# Module: Microservice App Provisioner
# ==============================================================================

variable "app_name" {
  type        = string
  description = "Name of the microservice application"
}

variable "image_url" {
  type        = string
  description = "GitLab Container Registry Image URL (registry.gitlab.com/manveersyan-group/...)"
}

variable "container_port" {
  type        = number
  description = "Container internal listening port"
}

variable "host_port" {
  type        = number
  description = "Host exposed port"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Environment target"
}

# Generic Container Deployment Specification
resource "docker_image" "app_image" {
  name         = var.image_url
  keep_locally = true
}

resource "docker_container" "app_container" {
  name  = "app-${var.app_name}"
  image = docker_image.app_image.image_id

  ports {
    internal = var.container_port
    external = var.host_port
  }

  env = [
    "PORT=${var.container_port}",
    "ENVIRONMENT=${var.environment}",
    "SERVICE_NAME=${var.app_name}"
  ]

  healthcheck {
    test     = ["CMD", "wget", "--no-verbose", "--spider", "http://localhost:${var.container_port}/health"]
    interval = "15s"
    timeout  = "5s"
    retries  = 3
  }

  restart = "unless-stopped"
}

output "container_id" {
  value = docker_container.app_container.id
}

output "app_url" {
  value = "http://localhost:${var.host_port}"
}
