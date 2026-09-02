# ==============================================================================
# Production Environment Infrastructure Composition
# Path: terraform/environments/production/main.tf
# ==============================================================================

module "vpc" {
  source          = "../../modules/vpc"
  project_name    = var.project_name
  environment     = var.environment
  vpc_cidr        = var.vpc_cidr
  azs             = var.azs
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

module "security_groups" {
  source           = "../../modules/security_groups"
  project_name     = var.project_name
  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  vpc_cidr         = var.vpc_cidr
  allowed_ssh_cidr = var.allowed_ssh_cidr
}

module "s3" {
  source       = "../../modules/s3"
  project_name = var.project_name
  environment  = var.environment
}

module "iam" {
  source        = "../../modules/iam"
  project_name  = var.project_name
  environment   = var.environment
  s3_bucket_arn = module.s3.bucket_arn
}

module "rds" {
  source             = "../../modules/rds"
  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.security_groups.rds_security_group_id
  instance_class     = var.rds_instance_class
  db_username        = var.rds_username
  db_password        = var.rds_password
}

module "ec2" {
  source                = "../../modules/ec2"
  project_name          = var.project_name
  environment           = var.environment
  subnet_id             = module.vpc.public_subnet_ids[0]
  security_group_id     = module.security_groups.ec2_security_group_id
  instance_type         = var.ec2_instance_type
  iam_instance_profile  = module.iam.instance_profile_name
  rds_endpoint          = module.rds.rds_endpoint
  rds_dbname            = module.rds.database_name
  rds_username          = var.rds_username
  rds_password          = var.rds_password
}
