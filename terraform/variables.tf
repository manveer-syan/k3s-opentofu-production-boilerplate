variable "app_name" {
  type        = string
  default     = "ate-operations-go"
  description = "Name of the deployed container service"
}

variable "internal_port" {
  type        = number
  default     = 8080
  description = "Container internal application listening port"
}

variable "external_port" {
  type        = number
  default     = 8080
  description = "Host external exposed port"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment target environment (staging/production)"
}
