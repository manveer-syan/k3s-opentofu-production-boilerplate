# Runbook: RDS PostgreSQL Upgrades & Maintenance

## 1. Overview

AWS RDS PostgreSQL requires routine minor version updates (e.g. 15.7 -> 15.8) for security fixes, and periodic major version updates (e.g. 15.x -> 16.x).

- **Current Version**: PostgreSQL 15.7
- **Database Identifier**: `ate-production-postgres`

---

## 2. Minor Version Upgrades (Zero Data Loss)

Minor version updates maintain complete wire compatibility and do not require schema alterations.

1. **Pre-Upgrade Snapshot**:
   ```bash
   aws rds create-db-snapshot \
     --db-instance-identifier ate-production-postgres \
     --db-snapshot-identifier "pre-minor-upgrade-$(date +%s)"
   ```

2. **Update OpenTofu Configuration**:
   In `terraform/modules/rds/main.tf` or `terraform/environments/production/terraform.tfvars`:
   ```hcl
   engine_version = "15.8"
   ```

3. **Plan and Apply**:
   ```bash
   cd terraform/environments/production
   tofu plan
   tofu apply -auto-approve
   ```

4. **Monitor RDS Status**:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier ate-production-postgres \
     --query "DBInstances[0].DBInstanceStatus"
   ```
   *(Expected downtime is typically 2-5 minutes during instance restart)*.

---

## 3. Major Version Upgrades (PostgreSQL 15 -> 16)

Major version upgrades may introduce changes to query planner behavior or SQL syntax.

### Step 1: Pre-Upgrade Checks & Extension Compatibility
1. Run pg_upgrade pre-checks via AWS CLI:
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier ate-production-postgres \
     --engine-version 16.2 \
     --allow-major-version-upgrade \
     --dry-run
   ```

2. Update RDS DB Parameter Group:
   - Create a new parameter group `ate-production-pg16` with `rds.force_ssl = 1`.

### Step 2: Maintenance Window Execution
1. Suspend application traffic by scaling backend deployments to 0:
   ```bash
   kubectl -n production-manveersyan-group scale deployment --all --replicas=0
   ```

2. Take a final manual snapshot:
   ```bash
   aws rds create-db-snapshot \
     --db-instance-identifier ate-production-postgres \
     --db-snapshot-identifier "pre-pg16-upgrade-final"
   ```

3. Apply major version upgrade:
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier ate-production-postgres \
     --engine-version 16.2 \
     --allow-major-version-upgrade \
     --apply-immediately
   ```

4. Monitor upgrade progress:
   ```bash
   aws rds describe-events --source-identifier ate-production-postgres --source-type db-instance
   ```

5. Once RDS status is `available`:
   - Scale back application deployments to 1:
     ```bash
     flux reconcile kustomization ate-production --with-source
     ```
   - Execute production smoke tests:
     ```bash
     ./scripts/production-smoke-test.sh
     ```
