# ==============================================================================
# Module: S3 Storage Bucket (Logs & Backups)
# Path: terraform/modules/s3/main.tf
# ==============================================================================

resource "aws_s3_bucket" "logs" {
  bucket        = "${var.project_name}-${var.environment}-logs-storage"
  force_destroy = false

  tags = {
    Name = "${var.project_name}-${var.environment}-logs-storage"
  }
}

resource "aws_s3_bucket_versioning" "v" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "enc" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "lifecycle" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
}
