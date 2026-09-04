# Runbook: Disaster Recovery & System Reconstruction

**RPO (Recovery Point Objective)**: 24 hours (Automated RDS daily backups & S3 lifecycle)  
**RTO (Recovery Time Objective)**: 30 minutes (Complete infrastructure & K3s cluster recreation via OpenTofu)

---

## 1. Infrastructure Reconstruction Procedure

In the event of total EC2 server loss or AWS instance disaster:

1. **Clone Infrastructure Repository**:
   ```bash
   git clone https://gitlab.com/manveersyan-group/ate.git
   cd ate
   ```

2. **Re-initialize OpenTofu State & Deploy Infrastructure**:
   ```bash
   cd terraform/environments/production
   tofu init
   tofu apply -auto-approve
   ```

3. **Re-apply K3s Kubernetes Manifests**:
   ```bash
   kubectl apply -k k8s/overlays/production
   ```

4. **Verify Application Health**:
   ```bash
   curl -i http://34.198.184.122/health
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
