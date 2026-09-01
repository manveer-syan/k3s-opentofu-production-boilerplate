# ==============================================================================
# GitLab Group Platform Orchestration - Central Infrastructure
# Group: manveersyan-group
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "docker" {}

# ----------------------------------------------------
# 1. Shared Group Security & Networking Module
# ----------------------------------------------------
module "group_networking" {
  source      = "./modules/networking"
  aws_region  = var.aws_region
  environment = var.environment
}

# ----------------------------------------------------
# 2. Central AWS Platform Host (EC2 + Elastic IP)
# ----------------------------------------------------
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "group_platform_server" {
  ami             = data.aws_ami.ubuntu.id
  instance_type   = var.instance_type
  security_groups = [module.group_networking.security_group_name]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose git
              systemctl start docker
              systemctl enable docker
              EOF

  tags = {
    Name        = "manveersyan-group-platform"
    Environment = var.environment
    ManagedBy   = "Terraform-Infra-Repo"
  }
}

resource "aws_eip" "platform_eip" {
  instance = aws_instance.group_platform_server.id
  domain   = "vpc"
}

# ----------------------------------------------------
# 3. Wired Microservices Configuration (GitLab Group)
# ----------------------------------------------------

# App 1: Web Frontend Service
module "service_web_frontend" {
  source         = "./modules/app_service"
  app_name       = "web-frontend"
  image_url      = "registry.gitlab.com/manveersyan-group/web-frontend:latest"
  container_port = 3000
  host_port      = 3000
  environment    = var.environment
}

# App 2: API Gateway Service
module "service_api_gateway" {
  source         = "./modules/app_service"
  app_name       = "api-gateway"
  image_url      = "registry.gitlab.com/manveersyan-group/api-gateway:latest"
  container_port = 8080
  host_port      = 8080
  environment    = var.environment
}

# App 3: Auth Service
module "service_auth_service" {
  source         = "./modules/app_service"
  app_name       = "auth-service"
  image_url      = "registry.gitlab.com/manveersyan-group/auth-service:latest"
  container_port = 5000
  host_port      = 5000
  environment    = var.environment
}
