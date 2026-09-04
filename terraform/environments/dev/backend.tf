terraform {
  backend "s3" {
    bucket         = "ate-tf-state-132848803918"
    key            = "platform/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ate-tf-locks"
    encrypt        = true
  }
}
