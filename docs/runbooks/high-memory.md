# Runbook: High Memory Utilization & Swap Exhaustion

## 1. Alert Summary

- **Triggered When**: Host available memory < 15% (300MB on t3.small) or Pod memory > 90% of limit for > 5 minutes.
- **Severity**: Critical (P1) if host swap exceeds 500MB; High (P2) otherwise.
- **Impact**: Risk of Linux Kernel OOM Killer terminating vital control plane pods (k3s-server, VictoriaMetrics, Traefik).

---

## 2. Immediate Diagnostic Triage

1. Check host-level memory and swap utilization:
   ```bash
   free -m
   vmstat 1 5
   ```

2. Check memory consumption by pod:
   ```bash
   kubectl top pods -A --sort-by=memory
   ```

3. Identify which processes or containers are consuming swap:
   ```bash
   for file in /proc/*/status; do
     awk '/VmSwap|Name/{printf $2 " " $3}END{ print ""}' "$file" 2>/dev/null
   done | grep -v ' 0 kB' | sort -k 2 -n -r | head -n 15
   ```

---

## 3. Immediate Stabilization Actions

1. If node is in danger of freezing:
   - Identify non-essential workloads (e.g. temporary debug pods or excess replicas).
   - Clear Linux buffer/page cache if needed:
     ```bash
     sync; echo 1 > /proc/sys/vm/drop_caches
     ```
   - Restart high-leak pods cleanly to release heap back to the OS:
     ```bash
     kubectl -n production-manveersyan-group rollout restart deployment/<SERVICE_NAME>
     ```

2. Prevent OOM cascading:
   - Do NOT run parallel builds or heavy CLI tools (`tofu`, `docker build`) directly on the EC2 production node.

---

## 4. Root Cause Analysis & Capacity Resolution

1. Run the Project ATE capacity report:
   ```bash
   ./scripts/k8s-capacity-report.sh
   ```
2. If committed memory requests exceed the 1480MB allocatable threshold on `t3.small`:
   - Follow [capacity-planning.md](../architecture/capacity-planning.md) to upgrade the node to `t3.medium` (4GB RAM).
