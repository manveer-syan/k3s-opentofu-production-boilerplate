# ==============================================================================
# Module: RDS PostgreSQL Database
# Path: terraform/modules/rds/main.tf
# ==============================================================================

resource "aws_db_subnet_group" "rds" {
  name       = "${var.project_name}-${var.environment}-rds-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-subnet-group"
  }
}

resource "aws_db_parameter_group" "pg" {
  name   = "${var.project_name}-${var.environment}-pg15-params"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

#trivy:ignore:AVD-AWS-0077
#trivy:ignore:AVD-AWS-0176
#trivy:ignore:AVD-AWS-0177
#trivy:ignore:AVD-AWS-0133
resource "aws_db_instance" "postgres" {
  identifier                          = "${var.project_name}-${var.environment}-db"
  engine                              = "postgres"
  engine_version                      = "15.7"
  instance_class                      = var.instance_class
  allocated_storage                   = 20
  max_allocated_storage               = 100
  storage_type                        = "gp3"
  db_name                             = "appdb"
  username                            = var.db_username
  password                            = var.db_password
  db_subnet_group_name                = aws_db_subnet_group.rds.name
  vpc_security_group_ids              = [var.security_group_id]
  parameter_group_name                = aws_db_parameter_group.pg.name
  skip_final_snapshot                 = (var.environment == "production" || var.environment == "prod") ? false : true
  final_snapshot_identifier           = "${var.project_name}-${var.environment}-final-snapshot"
  backup_retention_period             = 7
  backup_window                       = "01:00-02:00"
  maintenance_window                  = "Sun:03:00-Sun:04:00"
  auto_minor_version_upgrade          = true
  deletion_protection                 = (var.environment == "production" || var.environment == "prod") ? true : false
  iam_database_authentication_enabled = true
  performance_insights_enabled        = var.instance_class != "db.t3.micro" && var.instance_class != "db.t4g.micro" && var.instance_class != "db.t2.micro"
  multi_az                            = false # Set false for cost control (<$200 constraint)
  storage_encrypted                   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-rds"
  }
}
