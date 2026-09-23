# Runbook: High CPU Utilization

## 1. Alert Summary

- **Triggered When**: Host CPU utilization > 85% for > 5 minutes, or Pod CPU > 90% of limit.
- **Severity**: High (P2)
- **Impact**: Request latency degradation, potential thread starvation, or EC2 CPU credit exhaustion.

---

## 2. Immediate Diagnostic Triage

1. Check host CPU utilization and CPU credit balance:
   ```bash
   # On EC2 Host
   top -b -n 1 | head -n 20
   ```

2. Check CPU utilization by pod across all namespaces:
   ```bash
   kubectl top pods -A --sort-by=cpu
   ```

3. Check EC2 instance burst credits (AWS CloudWatch):
   ```bash
   aws cloudwatch get-metric-data \
     --metric-data-queries '[{"Id":"m1","MetricStat":{"Metric":{"Namespace":"AWS/EC2","MetricName":"CPUCreditBalance","Dimensions":[{"Name":"InstanceId","Value":"<INSTANCE_ID>"}]},"Period":300,"Stat":"Average"}}]' \
     --start-time $(date -u -v-1H +"%Y-%m-%dT%H:%M:%SZ") \
     --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ")
   ```

---

## 3. Common Failure Modes and Remediation

### Failure Mode 1: Infinite Loop or CPU Busy-Wait in Application
- **Symptom**: Single Go microservice pod utilizing 100% of its CPU limit continuously.
- **Action**:
  1. Capture a pprof goroutine/CPU profile:
     ```bash
     kubectl -n production-manveersyan-group exec -it <POD_NAME> -- wget -qO- http://localhost:<PORT>/debug/pprof/profile?seconds=30 > cpu.pprof
     ```
  2. If the pod is unresponsive and causing cascading gateway timeouts, restart the pod:
     ```bash
     kubectl -n production-manveersyan-group delete pod <POD_NAME>
     ```

### Failure Mode 2: Influx of External Traffic / DDoS
- **Symptom**: All services show elevated CPU, high network ingress in Traefik.
- **Action**:
  1. Inspect Traefik access logs:
     ```bash
     kubectl -n kube-system logs -l app.kubernetes.io/name=traefik --tail=200
     ```
  2. Verify if rate limiter is actively throttling (`RateLimit-Excess` headers).
  3. If traffic originates from a malicious IP range, block it via AWS Security Group or AWS WAF.

### Failure Mode 3: Host CPU Credit Depletion on t3.small
- **Symptom**: `CPUCreditBalance` is near 0; instance baseline throttles to 20% CPU.
- **Action**:
  1. If production workload has outgrown baseline capacity, initiate instance type resize from `t3.small` to `t3.medium` via OpenTofu.
  2. See [capacity-planning.md](../architecture/capacity-planning.md) for sizing guidelines.
