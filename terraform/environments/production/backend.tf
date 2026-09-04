terraform {
  backend "s3" {
    bucket         = "ate-tf-state-132848803918"
    key            = "platform/production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ate-tf-locks"
    encrypt        = true
  }
}
