# 📖 Runbook: Incident Rollback Procedures

**Scope**: Immediate emergency rollback for Application Services, Terraform State, or Database.

---

## 1. Application Container Rollback (Docker Compose)

If a newly deployed container image introduces runtime errors:

1. **SSH into the EC2 Server**:
   ```bash
   ssh ubuntu@<EC2_PUBLIC_IP>
   cd /opt/apps
   ```

2. **Pull and Deploy Previous Tag**:
   ```bash
   # Pin specific short SHA commit tag
   docker compose pull registry.gitlab.com/manveersyan-group/api-gateway:abc1234
   
   # Force service replacement
   docker compose up -d --no-deps api-gateway
   ```

3. **Verify Service Health**:
   ```bash
   curl http://localhost/health
   ```

---

## 2. Terraform Infrastructure Rollback

If a Terraform apply broke networking or server instances:

1. **Revert Git Commit**:
   ```bash
   git revert HEAD
   ```

2. **Re-apply Previous Infrastructure State**:
   ```bash
   cd terraform/environments/production
   terraform init
   terraform apply -auto-approve
   ```

---

## 3. Database Restoration Rollback

If database corruption occurs:

1. **Identify RDS Snapshot**:
   ```bash
   aws rds describe-db-snapshots --db-instance-identifier manveersyan-prod-db
   ```

2. **Restore DB Instance from Point-in-Time Snapshot**:
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier manveersyan-prod-db \
     --target-db-instance-identifier manveersyan-prod-db-restored \
     --use-latest-restorable-time
   ```
