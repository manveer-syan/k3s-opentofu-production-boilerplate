# ==============================================================================
# Module: EC2 Application Host
# Path: terraform/modules/ec2/main.tf
# ==============================================================================

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_key_pair" "deployer" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = file("~/.ssh/id_ed25519.pub")
}

resource "aws_instance" "server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deployer.key_name
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = var.iam_instance_profile

  # Enforce IMDSv2 for enhanced security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = templatefile("${path.module}/user_data.sh.tpl", {
    rds_endpoint = var.rds_endpoint
    rds_dbname   = var.rds_dbname
    rds_username = var.rds_username
    rds_password = var.rds_password
    environment  = var.environment
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-ec2"
  }
}

# Elastic IP allocation
resource "aws_eip" "eip" {
  instance = aws_instance.server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}-eip"
  }
}
