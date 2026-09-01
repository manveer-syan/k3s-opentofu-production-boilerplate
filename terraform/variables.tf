variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS Deployment Region"
}

variable "instance_type" {
  type        = string
  default     = "t3.micro"
  description = "EC2 Instance Type (Free-tier eligible)"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment Environment"
}
