# ==============================================================================
# Module: Networking & Security Group Configuration
# ==============================================================================

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

resource "aws_security_group" "group_sg" {
  name        = "manveersyan-group-${var.environment}-sg"
  description = "Shared Security Group for manveersyan-group microservices"

  # Public Web Ingress
  ingress {
    description = "HTTP Traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS Traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Microservices Internal Wiring Ports
  ingress {
    description = "Web Frontend Port"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "API Gateway Port"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Auth Service Port"
    from_port   = 5000
    to_port     = 5000
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

  tags = {
    Name        = "manveersyan-group-sg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

output "security_group_id" {
  value = aws_security_group.group_sg.id
}

output "security_group_name" {
  value = aws_security_group.group_sg.name
}
