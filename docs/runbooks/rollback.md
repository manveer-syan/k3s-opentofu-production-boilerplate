# Runbook: Incident Rollback Procedures

**Scope**: Immediate emergency rollback for Application Services (K3s), OpenTofu Infrastructure, or Database.

---

## 1. Kubernetes Application Rollback (K3s)

If a newly deployed container image introduces runtime errors in production:

1. **Instant Rollback via `kubectl`**:
   ```bash
   # Rollback specific deployment to previous revision
   kubectl rollout undo deployment/web-frontend -n manveersyan-group
   kubectl rollout undo deployment/api-gateway -n manveersyan-group
   kubectl rollout undo deployment/auth-service -n manveersyan-group
   ```

2. **Check Rollback Status**:
   ```bash
   kubectl rollout status deployment/web-frontend -n manveersyan-group
   ```

3. **Verify Service Health**:
   ```bash
   curl -i http://34.198.184.122/health
   ```

---

## 2. OpenTofu Infrastructure Rollback

If an OpenTofu apply broke networking or cloud resources:

1. **Revert Git Commit**:
   ```bash
   git revert HEAD
   ```

2. **Re-apply Previous Infrastructure State**:
   ```bash
   cd terraform/environments/production
   tofu init
   tofu apply -auto-approve
   ```

---

## 3. RDS Database Restoration

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
