output "platform_public_ip" {
  value       = aws_eip.platform_eip.public_ip
  description = "Public Elastic IP address of the platform host"
}

output "web_frontend_url" {
  value       = "http://${aws_eip.platform_eip.public_ip}:3000"
  description = "URL for Web Frontend service"
}

output "api_gateway_url" {
  value       = "http://${aws_eip.platform_eip.public_ip}:8080"
  description = "URL for API Gateway service"
}

output "auth_service_url" {
  value       = "http://${aws_eip.platform_eip.public_ip}:5000"
  description = "URL for Auth Service"
}
