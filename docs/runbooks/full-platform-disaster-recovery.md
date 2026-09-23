# Production Runbook: Full Platform Disaster Recovery

## 1. Overview and Incident Classification

This runbook outlines the step-by-step procedure for recovering the entire Project ATE production platform from catastrophic failure (total EC2 instance termination, cluster corruption, or availability zone outage).

- **Target RPO**: < 5 minutes (via RDS Automated Backups / WAL PITR)
- **Target RTO**: < 45 minutes (Automated IaC provisioning + Flux GitOps bootstrap)
- **Document Version**: 2.0 (Post-Hardening)

---

## 2. Recovery Timeline and Phases

| Phase | Action | Est. Duration | Responsible Role |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Incident Declaration & State Assessment | 5 min | Lead SRE / Incident Commander |
| **Phase 1** | OpenTofu State Recovery & Verification | 5 min | DevOps Engineer |
| **Phase 2** | Infrastructure Re-provisioning (VPC / EC2 / RDS) | 10 min | DevOps Engineer |
| **Phase 3** | K3s Cluster Initialization & Secrets Key Injection | 5 min | Platform Engineer |
| **Phase 4** | Flux v2 GitOps Reconciliation | 5 min | Platform Engineer |
| **Phase 5** | Database Verification & PITR (If RDS was destroyed) | 10 min | Database Administrator / SRE |
| **Phase 6** | Smoke Testing & Production Validation | 5 min | QA / SRE |

Total Estimated RTO: 45 minutes.

---

## 3. Prerequisites

The responding engineer must have the following tools installed and configured on their local workstation or bastion:
- AWS CLI v2 (`aws --version`) with administrator credentials for the target AWS account.
- OpenTofu v1.6+ (`tofu version`).
- `kubectl` v1.28+.
- `flux` CLI v2.2+.
- `age` and `sops` CLI (`age-keygen`, `sops`).
- Target repository cloned locally (`git clone git@gitlab.com:manveersyan-group/ate.git`).

---

## 4. Phase 0: Incident Declaration and State Assessment

1. Check current EC2 instance state via AWS CLI:
   ```bash
   aws ec2 describe-instances \
     --filters "Name=tag:Project,Values=ATE" "Name=instance-state-name,Values=running,stopped,shutting-down,terminated" \
     --query "Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress]" \
     --output table
   ```

2. Check RDS instance state:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier ate-production-postgres \
     --query "DBInstances[].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]" \
     --output table
   ```

3. Determine disaster scope:
   - **Scenario A (Compute-only loss)**: EC2 instance corrupted or terminated; RDS database is healthy and intact.
   - **Scenario B (Total platform loss)**: EC2 instance and RDS database both destroyed.

---

## 5. Phase 1: OpenTofu State Verification

Verify that remote state storage and DynamoDB state locks are intact:

```bash
aws s3 ls s3://manveersyan-prod-terraform-state/production/
aws dynamodb describe-table --table-name manveersyan-prod-terraform-locks --query "Table.TableStatus"
```

Initialize OpenTofu in the production environment:

```bash
cd terraform/environments/production
tofu init
tofu plan
```

---

## 6. Phase 2: Infrastructure Re-provisioning

If the EC2 instance was terminated:

1. Run OpenTofu to provision the replacement EC2 host and configure security groups:
   ```bash
   tofu apply -auto-approve
   ```

2. Capture the newly provisioned public IP address:
   ```bash
   NEW_PUBLIC_IP=$(tofu output -raw ec2_public_ip)
   echo "New EC2 Host Public IP: ${NEW_PUBLIC_IP}"
   ```

3. Wait for SSH availability:
   ```bash
   while ! nc -z -w 2 "${NEW_PUBLIC_IP}" 22; do
     echo "Waiting for SSH on ${NEW_PUBLIC_IP}..."
     sleep 5
   done
   ```

---

## 7. Phase 3: K3s Cluster Initialization and Secret Key Injection

1. Connect to the replacement host via SSH:
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@"${NEW_PUBLIC_IP}"
   ```

2. Install K3s with secrets encryption enabled:
   ```bash
   curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--secrets-encryption --disable traefik --write-kubeconfig-mode 644" sh -
   ```
   *(Note: If Traefik is deployed via Helm/GitOps, `--disable traefik` is used. If using built-in Traefik, omit `--disable traefik`)*.

3. Export `kubeconfig` to your local workstation:
   ```bash
   mkdir -p ~/.kube
   scp -i ~/.ssh/id_rsa ubuntu@"${NEW_PUBLIC_IP}":/etc/rancher/k3s/k3s.yaml ~/.kube/config-ate-prod
   sed -i '' "s/127.0.0.1/${NEW_PUBLIC_IP}/g" ~/.kube/config-ate-prod
   export KUBECONFIG=~/.kube/config-ate-prod
   kubectl get nodes
   ```

4. Recover and inject the SOPS Age key from AWS Secrets Manager:
   ```bash
   # Retrieve key from AWS Secrets Manager
   AGE_KEY=$(aws secretsmanager get-secret-value \
     --secret-id "manveersyan-prod-sops-age-key" \
     --query "SecretString" \
     --output text)

   # Create flux-system namespace
   kubectl create namespace flux-system --dry-run=client -o yaml | kubectl apply -f -

   # Create the sops-age Kubernetes secret
   kubectl create secret generic sops-age \
     --namespace flux-system \
     --from-literal=age.agekey="${AGE_KEY}" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

5. Verify that the key is present in the cluster:
   ```bash
   kubectl -n flux-system get secret sops-age
   ```

---

## 8. Phase 4: Flux v2 GitOps Reconciliation

1. Bootstrap Flux v2 on the cluster:
   ```bash
   flux install \
     --namespace=flux-system \
     --components=source-controller,kustomize-controller,helm-controller,notification-controller
   ```

2. Apply the Git repository source and Kustomization manifests:
   ```bash
   kubectl apply -f gitops/flux/gitrepository.yaml
   kubectl apply -f gitops/flux/kustomization.yaml
   ```

3. Force an immediate reconciliation loop:
   ```bash
   flux reconcile source git ate-repo
   flux reconcile kustomization ate-production --with-source
   ```

4. Monitor pod creation in the production namespace:
   ```bash
   kubectl -n production-manveersyan-group get pods -w
   ```

---

## 9. Phase 5: Database Recovery (Scenario B Only)

If the RDS instance was destroyed or corrupted:

1. Identify the latest automated snapshot or point-in-time boundary:
   ```bash
   aws rds describe-db-snapshots \
     --db-instance-identifier ate-production-postgres \
     --query "DBSnapshots[-1].[DBSnapshotIdentifier,SnapshotCreateTime]" \
     --output table
   ```

2. Restore database to a specific point in time:
   ```bash
   RESTORE_TIME=$(date -u -v-10M +"%Y-%m-%dT%H:%M:%SZ") # 10 minutes ago
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier ate-production-postgres \
     --target-db-instance-identifier ate-production-postgres-restored \
     --restore-time "${RESTORE_TIME}" \
     --db-instance-class db.t3.micro \
     --db-subnet-group-name ate-production-db-subnet-group \
     --vpc-security-group-ids "$(tofu output -raw rds_security_group_id)"
   ```

3. Update OpenTofu configuration or DNS endpoint if the database identifier changed, and run:
   ```bash
   tofu apply -auto-approve
   ```

---

## 10. Phase 6: Production Smoke Testing & Verification

1. Run the automated production smoke test script:
   ```bash
   BASE_URL="http://${NEW_PUBLIC_IP}" ./scripts/production-smoke-test.sh
   ```

2. Validate database connectivity from the API Gateway:
   ```bash
   kubectl -n production-manveersyan-group exec -it \
     $(kubectl -n production-manveersyan-group get pods -l app=api-gateway -o jsonpath='{.items[0].metadata.name}') \
     -- /bin/sh -c "nc -z -w 3 ${RDS_ENDPOINT} 5432"
   ```

3. Update DNS / Route 53 A record to point to the new Elastic IP or host IP:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id "${ROUTE53_ZONE_ID}" \
     --change-batch file://scripts/dns-cutover.json
   ```

4. Declare incident resolved and initiate post-mortem review per SRE standards.
