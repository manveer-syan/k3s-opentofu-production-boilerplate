terraform {
  backend "s3" {
    bucket         = "manveersyan-tf-state-dev"
    key            = "platform/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "manveersyan-tf-locks"
    encrypt        = true
  }
}
