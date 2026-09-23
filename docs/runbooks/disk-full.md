# Runbook: Disk Full / High Disk Space Utilization

## 1. Alert Summary

- **Triggered When**: Root filesystem (`/`) disk usage > 80% (Warning) or > 90% (Critical).
- **Severity**: P2 (at 80%), P1 (at 90%).
- **Impact**: K3s node enters `DiskPressure` taint, evicting pods and refusing new container creation.

---

## 2. Immediate Diagnostic Triage

1. Inspect disk usage by mount point:
   ```bash
   df -h /
   ```

2. Identify top space-consuming directories:
   ```bash
   du -sh /var/lib/rancher/k3s/agent/containerd/* | sort -hr | head -n 10
   du -sh /var/log/* | sort -hr | head -n 10
   ```

---

## 3. Emergency Remediation (Reclaiming Space)

1. Prune unused containerd images via `crictl`:
   ```bash
   sudo k3s crictl rmi --prune
   ```

2. Clean stopped containers and dangling build caches:
   ```bash
   sudo k3s crictl rm $(sudo k3s crictl ps -a -q --state Exited)
   ```

3. Truncate bloated systemd journal logs (retaining last 2 days or 500MB):
   ```bash
   sudo journalctl --vacuum-time=2d
   sudo journalctl --vacuum-size=500M
   ```

4. Prune VictoriaMetrics cache if retaining excessive historical metrics:
   ```bash
   # Verify storage directory
   du -sh /var/lib/victoriametrics
   ```

---

## 4. Permanent Resolution: EBS Volume Expansion

If data growth is legitimate, resize the AWS EBS volume online with zero downtime:

1. Update `root_volume_size` in `terraform/environments/production/terraform.tfvars`:
   ```hcl
   root_volume_size = 30 # Expand from 20GB to 30GB
   ```

2. Apply via OpenTofu:
   ```bash
   cd terraform/environments/production
   tofu apply -auto-approve
   ```

3. Expand the filesystem on the running Linux host:
   ```bash
   # Check partition
   sudo lsblk
   
   # Grow partition (assuming nvme0n1p1 or xvda1)
   sudo growpart /dev/nvme0n1 1
   
   # Resize ext4 filesystem
   sudo resize2fs /dev/nvme0n1p1
   
   # Verify new size
   df -h /
   ```
