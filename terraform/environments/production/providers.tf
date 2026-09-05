# ==============================================================================
# AWS Provider Configuration for Production
# Path: terraform/environments/production/providers.tf
# ==============================================================================

provider "aws" {
  region      = var.region
  max_retries = 5

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "OpenTofu"
      Repository  = "manveersyan-group/ate"
    }
  }
}
