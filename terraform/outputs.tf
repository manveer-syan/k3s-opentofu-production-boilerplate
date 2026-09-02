# ==============================================================================
# Infrastructure Outputs
# Path: terraform/outputs.tf
# ==============================================================================

output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "VPC Identifier"
}

output "public_subnet_ids" {
  value       = module.vpc.public_subnet_ids
  description = "List of public subnet IDs"
}

output "private_subnet_ids" {
  value       = module.vpc.private_subnet_ids
  description = "List of private subnet IDs"
}

output "ec2_public_ip" {
  value       = module.ec2.public_ip
  description = "Public Elastic IP assigned to application host"
}

output "rds_endpoint" {
  value       = module.rds.rds_endpoint
  description = "PostgreSQL RDS connection endpoint"
}

output "rds_database_name" {
  value       = module.rds.database_name
  description = "Primary database name"
}

output "s3_bucket_name" {
  value       = module.s3.bucket_name
  description = "Logs & backup S3 bucket name"
}
