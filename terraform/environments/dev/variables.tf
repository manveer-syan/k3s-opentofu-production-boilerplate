variable "project_name" { type = string }
variable "environment" { type = string }
variable "region" { type = string }
variable "vpc_cidr" { type = string }
variable "azs" { type = list(string) }
variable "public_subnets" { type = list(string) }
variable "private_subnets" { type = list(string) }
variable "allowed_ssh_cidr" { type = string }
variable "ec2_instance_type" { type = string }
variable "rds_instance_class" { type = string }
variable "rds_username" { type = string }
variable "rds_password" {
  type      = string
  sensitive = true
}
variable "enable_monitoring" { type = bool }
