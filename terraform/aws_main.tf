# ==============================================================================
# AWS Terraform IaC Configuration for ATE Go Platform
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS deployment region"
}

variable "instance_type" {
  type        = string
  default     = "t3.micro" # Free-tier eligible / low cost
  description = "AWS EC2 instance type"
}

# 1. AWS Security Group (Firewall)
resource "aws_security_group" "ate_sg" {
  name        = "ate-operations-sg"
  description = "Allow HTTP, HTTPS, and SSH traffic"

  ingress {
    description = "HTTP Public Access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Public Access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Go Application Direct Access"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH Admin Access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 2. Latest Ubuntu 22.04 AMI Lookup
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

# 3. AWS EC2 Instance Resource
resource "aws_instance" "ate_server" {
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  security_groups      = [aws_security_group.ate_sg.name]

  # User Data script: Automatically installs Docker & runs container on boot
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io docker-compose git
              systemctl start docker
              systemctl enable docker

              # Clone repo dev branch & launch
              cd /home/ubuntu
              git clone -b dev https://gitlab.com/manveersyan-group/ate.git
              cd ate
              docker-compose up -d --build
              EOF

  tags = {
    Name        = "ATE-Operations-Server"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# 4. AWS Elastic IP (Static Public IP)
resource "aws_eip" "ate_eip" {
  instance = aws_instance.ate_server.id
  domain   = "vpc"
}

# 5. Output Public IP
output "public_ip" {
  value       = aws_eip.ate_eip.public_ip
  description = "The Public Static IP Address of your AWS Server"
}

output "application_url" {
  value       = "http://${aws_eip.ate_eip.public_ip}:8080"
  description = "Direct HTTP access URL"
}

output "healthcheck_url" {
  value       = "http://${aws_eip.ate_eip.public_ip}:8080/health"
  description = "Healthcheck monitoring URL"
}
