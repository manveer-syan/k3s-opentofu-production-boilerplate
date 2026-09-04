variable "project_name" { type = string }
variable "environment" { type = string }
variable "subnet_id" { type = string }
variable "security_group_id" { type = string }
variable "instance_type" { type = string }
variable "iam_instance_profile" { type = string }
variable "rds_endpoint" { type = string }
variable "rds_dbname" { type = string }
variable "rds_username" { type = string }
variable "rds_password" { type = string }
variable "ssh_public_key" {
  type        = string
  description = "Public SSH key for EC2 deployment"
  default     = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHraeRLuu9+i9vJiyAypOiknRVevobduksQROqNDZgAc manveer@example.com"
}
