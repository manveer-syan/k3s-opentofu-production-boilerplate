# Runbook: RDS PostgreSQL Unavailable or Connection Saturation

## 1. Alert Summary

- **Triggered When**: RDS instance unreachable, connection failures spike, or active connections exceed 80% of max limit.
- **Severity**: Critical (P1)
- **Impact**: All stateful microservices (`api-gateway`, `auth-service`, `notification-service`) unable to read or write data, resulting in widespread 500 Internal Server Errors.

---

## 2. Immediate Diagnostic Triage

1. Check RDS instance status in AWS Console or CLI:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier ate-production-postgres \
     --query "DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus,PendingModifiedValues]" \
     --output table
   ```

2. Test TCP reachability from within the K3s host:
   ```bash
   nc -zv <RDS_ENDPOINT> 5432
   ```

3. Query active database connections and locks (if connected):
   ```bash
   psql -h <RDS_ENDPOINT> -U produser -d appdb -c "
     SELECT count(*), state FROM pg_stat_activity GROUP BY state;
   "
   ```

4. Identify long-running queries or deadlocks:
   ```bash
   psql -h <RDS_ENDPOINT> -U produser -d appdb -c "
     SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
     FROM pg_stat_activity
     WHERE (now() - pg_stat_activity.query_start) > interval '10 seconds'
     ORDER BY duration DESC;
   "
   ```

---

## 3. Common Failure Modes and Remediation

### Failure Mode 1: Security Group or Subnet Routing Blackhole
- **Symptom**: `nc -zv` times out.
- **Action**:
  1. Inspect RDS Security Group ingress rules: Ensure port 5432 allows ingress from the EC2 security group (`ate-production-ec2-sg`).
  2. Verify NetworkPolicy: Ensure `allow-db-egress` in `k8s/components/strict-network/network-policy.yaml` matches the RDS private subnet CIDRs (`10.0.10.0/24`, `10.0.11.0/24`).

### Failure Mode 2: Connection Pool Exhaustion on db.t3.micro
- **Symptom**: Database rejects connections with `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
- **Cause**: Default `max_connections` on `db.t3.micro` (~1GB RAM) is ~85. Unpooled application instances or connection leaks deplete the pool.
- **Action**:
  1. Terminate idle connections immediately:
     ```bash
     psql -h <RDS_ENDPOINT> -U produser -d appdb -c "
       SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND (now() - state_change) > interval '5 minutes';
     "
  2. Verify that Go microservices have connection pool bounds configured (`db.SetMaxOpenConns(10)`, `db.SetMaxIdleConns(5)`).
  3. If organic growth requires higher limits, scale the instance to `db.t3.small` via OpenTofu.

### Failure Mode 3: RDS Storage Full / In Read-Only Mode
- **Symptom**: Transactions fail with `ERROR: cannot execute INSERT in a read-only transaction`.
- **Action**:
  1. Check allocated vs free storage in CloudWatch.
  2. With `storage_autoscaling = true` in our hardened configuration, storage should automatically expand up to 50GB. If it reached the maximum cap, increase `max_allocated_storage` in `terraform/modules/rds/main.tf` and apply.

### Failure Mode 4: RDS In Maintenance or Reboot State
- **Symptom**: `DBInstanceStatus` is `maintenance`, `upgrading`, or `rebooting`.
- **Action**:
  1. Maintenance windows are configured for Sundays 04:00-05:00 UTC. If triggered during business hours, check CloudWatch logs and AWS Health Dashboard.
  2. Wait for reboot/maintenance completion; observe health endpoints recovering.
