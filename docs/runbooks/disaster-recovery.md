# 📖 Runbook: Disaster Recovery & Total System Reconstruction

**RPO (Recovery Point Objective)**: 24 hours (Automated RDS daily backups & S3 lifecycle)  
**RTO (Recovery Time Objective)**: 4 hours (Complete infrastructure recreation via Terraform)

---

## 1. Scratch Infrastructure Recreation Procedure

In the event of total AWS region outage or account disaster:

1. **Clone Infrastructure Repository**:
   ```bash
   git clone git@gitlab.com:manveersyan-group/ate.git
   cd ate
   ```

2. **Re-initialize S3 State Backend & Deploy Infrastructure**:
   ```bash
   cd terraform/environments/production
   terraform init
   terraform apply -auto-approve
   ```

3. **Deploy Application Layer**:
   ```bash
   cd ../../../ansible
   ansible-playbook -i inventory/hosts.ini playbooks/update-apps.yml
   ```

---

## 2. Database Backup & Restore Verification

1. **Extract S3 Database Dump**:
   ```bash
   aws s3 cp s3://manveersyan-prod-logs-storage/db-backups/latest-dump.sql.gz .
   ```

2. **Restore PostgreSQL Database**:
   ```bash
   gunzip -c latest-dump.sql.gz | psql -h <RDS_ENDPOINT> -U produser -d appdb
   ```
