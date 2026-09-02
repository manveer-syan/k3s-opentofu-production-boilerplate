terraform {
  backend "s3" {
    bucket         = "manveersyan-tf-state-staging"
    key            = "platform/staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "manveersyan-tf-locks"
    encrypt        = true
  }
}
