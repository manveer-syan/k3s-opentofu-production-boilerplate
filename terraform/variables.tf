# ==============================================================================
# Central Input Variables
# Path: terraform/variables.tf
# ==============================================================================

variable "project_name" {
  type        = string
  default     = "manveersyan-platform"
  description = "Project name identifier used in resources and tags"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment (dev, production)"
}

variable "region" {
  type        = string
  default     = "us-east-1"
  description = "AWS Region for infrastructure deployment"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "VPC Classless Inter-Domain Routing block"
}

variable "azs" {
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
  description = "Availability zones for subnet allocation"
}

variable "public_subnets" {
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
  description = "CIDR blocks for public subnets"
}

variable "private_subnets" {
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
  description = "CIDR blocks for private subnets"
}

variable "allowed_ssh_cidr" {
  type        = string
  default     = "0.0.0.0/0"
  description = "IP CIDR block allowed to SSH into EC2 instances"
}

variable "ec2_instance_type" {
  type        = string
  default     = "t3.medium"
  description = "EC2 compute instance sizing"
}

variable "rds_instance_class" {
  type        = string
  default     = "db.t3.micro"
  description = "Database instance compute class"
}

variable "rds_username" {
  type        = string
  default     = "dbuser_app"
  description = "Master database admin username"
}

variable "rds_password" {
  type        = string
  sensitive   = true
  description = "Master database admin password"
}

variable "enable_monitoring" {
  type        = bool
  default     = false
  description = "Toggle enhanced observability stack deployment"
}
