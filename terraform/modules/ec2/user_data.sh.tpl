#!/bin/bash
# ==============================================================================
# EC2 User Data Bootstrapping Script (IMDSv2 Compatible)
# Path: terraform/modules/ec2/user_data.sh.tpl
# ==============================================================================

set -euo pipefail

# Update system packages
apt-get update -y
apt-get upgrade -y

# Install Docker, Docker Compose plugin, Nginx, and Git
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    nginx \
    docker.io \
    docker-compose-v2

# Start and enable Docker service
systemctl start docker
systemctl enable docker

# Add ubuntu default user to docker group
usermod -aG docker ubuntu

# Create deployment directory structure
mkdir -p /opt/apps/nginx
mkdir -p /opt/apps/observability

# Write production environment configuration file
cat <<'ENVFILE' > /opt/apps/docker-compose.env
DATABASE_HOST=${rds_endpoint}
DATABASE_PORT=5432
DATABASE_NAME=${rds_dbname}
DATABASE_USER=${rds_username}
DATABASE_PASSWORD=${rds_password}
APP_ENV=${environment}
LOG_LEVEL=info
REGISTRY_URL=registry.gitlab.com/manveersyan-group
ENVFILE

chown -R ubuntu:ubuntu /opt/apps

echo "EC2 Infrastructure Bootstrapping Complete."
