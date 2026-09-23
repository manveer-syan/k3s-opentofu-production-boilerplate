# Runbook: K3s Node Replacement & Zero-Data-Loss Migration

## 1. Overview

In single-node K3s environments, node replacement is required for:
- Underlying AWS EC2 hardware retirement or scheduled maintenance.
- Instance type upgrades (e.g. `t3.small` to `t3.medium`).
- Operating system upgrades or kernel patching.

Since workloads share a single node, this procedure documents both:
1. **Planned Maintenance Replacement** (controlled switchover).
2. **Emergency Node Replacement** (host already terminated or unresponsive).

---

## 2. Planned Node Replacement Procedure

### Step 1: Pre-Replacement Preparation
1. Ensure the PostgreSQL database is healthy in RDS:
   ```bash
   aws rds describe-db-instances --db-instance-identifier ate-production-postgres --query "DBInstances[0].DBInstanceStatus"
   ```
2. Trigger an ad-hoc RDS snapshot before starting:
   ```bash
   aws rds create-db-snapshot \
     --db-instance-identifier ate-production-postgres \
     --db-snapshot-identifier "pre-node-migration-$(date +%s)"
   ```
3. Verify Git repository is clean and all desired state is pushed to `main`.

### Step 2: Provision the Target Host
1. If scaling instance type, update `instance_type` in `terraform/environments/production/terraform.tfvars`:
   ```hcl
   instance_type = "t3.medium"
   ```
2. Run OpenTofu to provision the replacement host:
   ```bash
   cd terraform/environments/production
   tofu apply -auto-approve
   ```
3. Capture new host IP:
   ```bash
   NEW_HOST_IP=$(tofu output -raw ec2_public_ip)
   ```

### Step 3: Bootstrap K3s on New Host
1. Install K3s with secrets encryption:
   ```bash
   ssh ubuntu@"${NEW_HOST_IP}" 'curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--secrets-encryption --write-kubeconfig-mode 644" sh -'
   ```
2. Fetch `kubeconfig` and set context:
   ```bash
   scp ubuntu@"${NEW_HOST_IP}":/etc/rancher/k3s/k3s.yaml ~/.kube/config-ate-new
   sed -i '' "s/127.0.0.1/${NEW_HOST_IP}/g" ~/.kube/config-ate-new
   export KUBECONFIG=~/.kube/config-ate-new
   ```

### Step 4: Inject Age Key and Bootstrap Flux v2
1. Inject the SOPS Age key from AWS Secrets Manager:
   ```bash
   AGE_KEY=$(aws secretsmanager get-secret-value --secret-id "manveersyan-prod-sops-age-key" --query "SecretString" --output text)
   kubectl create namespace flux-system
   kubectl -n flux-system create secret generic sops-age --from-literal=age.agekey="${AGE_KEY}"
   ```
2. Install Flux and sync repository:
   ```bash
   flux install --namespace=flux-system
   kubectl apply -f gitops/flux/gitrepository.yaml
   kubectl apply -f gitops/flux/kustomization.yaml
   flux reconcile kustomization ate-production --with-source
   ```

### Step 5: Verify Workload Health
1. Wait for all production pods to report `Running (1/1)`:
   ```bash
   kubectl -n production-manveersyan-group get pods -w
   ```
2. Execute automated smoke tests against the new host:
   ```bash
   BASE_URL="http://${NEW_HOST_IP}" ./scripts/production-smoke-test.sh
   ```

### Step 6: DNS Switchover & Old Node Deprovisioning
1. Update DNS A record in AWS Route 53 or your DNS registrar to point to `${NEW_HOST_IP}`.
2. Monitor HTTP access logs on the new node for incoming traffic.
3. Terminate the deprecated EC2 instance.
