output "container_id" {
  value       = docker_container.ate_service.id
  description = "The ID of the deployed Docker container"
}

output "application_url" {
  value       = "http://localhost:${var.external_port}"
  description = "The HTTP access URL of the deployed application"
}

output "healthcheck_url" {
  value       = "http://localhost:${var.external_port}/health"
  description = "The healthcheck monitoring endpoint URL"
}
