# ==============================================================================
# Production Environment Provider Version Pinning
# Path: terraform/environments/production/versions.tf
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.1.0"
    }
  }
}
