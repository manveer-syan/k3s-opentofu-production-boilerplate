# Runbook: SOPS Age Private Key Disaster Recovery & Lifecycle

> **Runbook ID**: RB-SEC-002  
> **Severity**: CRITICAL  
> **Target Key**: Mozilla SOPS Age Private Key (`AGE-SECRET-KEY-1...`)  
> **Recovery Store**: AWS Secrets Manager (KMS Encrypted)  

---

## 1. Context & Threat Model

The SOPS Age private key is the master cryptographic key that unlocks all production secrets within Project ATE:
* Database credentials (`DATABASE_PASSWORD`)
* JWT token signing secrets (`JWT_SECRET`)
* SMTP credentials and email verification tokens
* Grafana administrative credentials

### The Disaster Scenario
If the EC2 instance hosting K3s is destroyed, the local node filesystem is lost. If the Age private key only existed on the node, **the GitOps pipeline is permanently broken and cannot reconstruct the production environment from Git.**

### Security Invariants
* The Age private key **MUST NEVER** be committed to Git.
* The Age private key **MUST NEVER** be hardcoded in Terraform `.tfvars` or unencrypted state.
* The Age private key **MUST NEVER** be embedded in Docker images or EC2 `user_data` templates.

---

## 2. Secure Storage Architecture in AWS Secrets Manager

The master copy of the Age private key is secured in **AWS Secrets Manager**, encrypted under AWS KMS:

* **Secret Name**: `manveersyan-prod-sops-age-key`
* **Region**: `us-east-1`
* **Access Control**: Restricted strictly to authorized DevOps IAM identities and the EC2 instance profile (`manveersyan-prod-ec2-role`) via IAM policy statement:
  ```json
  {
    "Effect": "Allow",
    "Action": [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ],
    "Resource": "arn:aws:secretsmanager:*:*:secret:manveersyan-*-sops-age-key*"
  }
  ```

---

## 3. Initial Setup & Upload (One-Time Execution)

From the authorized administrative workstation possessing the primary Age key (`~/.config/sops/age/keys.txt`):

```bash
# Verify the local key file exists
head -n 2 ~/.config/sops/age/keys.txt

# Create the secret in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "manveersyan-prod-sops-age-key" \
  --description "Project ATE Master SOPS Age Private Key for GitOps In-Memory Decryption" \
  --secret-string file://~/.config/sops/age/keys.txt \
  --region us-east-1
```

---

## 4. Disaster Recovery & Cluster Rebuilding Procedure

When a new EC2 instance is launched or a fresh K3s cluster is bootstrapped:

### Step 1: Ensure Flux v2 is Installed
```bash
flux install \
  --namespace=flux-system \
  --components=source-controller,kustomize-controller
```

### Step 2: Fetch Key from AWS Secrets Manager Directly into Cluster Memory
Execute this pipe command. **Notice that the private key is never written to disk**:

```bash
aws secretsmanager get-secret-value \
  --secret-id "manveersyan-prod-sops-age-key" \
  --query 'SecretString' \
  --output text \
  --region us-east-1 | \
kubectl create secret generic sops-age \
  --namespace=flux-system \
  --from-file=age.agekey=/dev/stdin
```

### Step 3: Verify In-Cluster Secret Creation
```bash
kubectl get secret sops-age -n flux-system -o yaml | grep "age.agekey:"
```

### Step 4: Apply GitOps Sync
```bash
kubectl apply -f gitops/flux/ate-sync.yaml
flux reconcile kustomization ate-production --with-source
```

---

## 5. Routine Key Rotation Procedure

To rotate the Age key pair without downtime:

1. **Generate New Key Pair on Workstation**:
   ```bash
   age-keygen -o ~/.config/sops/age/keys-new.txt
   NEW_PUBKEY=$(grep "public key:" ~/.config/sops/age/keys-new.txt | cut -d: -f2 | xargs)
   ```

2. **Update `.sops.yaml` with Both Old and New Public Keys**:
   ```yaml
   creation_rules:
     - path_regex: .*\.enc\.yaml$
       encrypted_regex: '^(data|stringData)$'
       age: >-
         <OLD_PUBKEY>,
         <NEW_PUBKEY>
   ```

3. **Re-encrypt All Existing Secrets**:
   ```bash
   for file in $(find k8s/overlays -name "secret.enc.yaml"); do
     sops updatekeys -y "$file"
   done
   ```

4. **Update AWS Secrets Manager**:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id "manveersyan-prod-sops-age-key" \
     --secret-string file://~/.config/sops/age/keys-new.txt \
     --region us-east-1
   ```

5. **Update Cluster Secret**:
   ```bash
   kubectl create secret generic sops-age \
     --namespace=flux-system \
     --from-file=age.agekey=~/.config/sops/age/keys-new.txt \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

6. **Remove Old Key from `.sops.yaml` & Commit Changes**:
   Once verified, remove the old public key from `.sops.yaml` and re-run `sops updatekeys`.

---

## 6. Key Compromise Emergency Response

If the Age private key is suspected of being compromised:
1. Immediately declare a **P1 Security Incident** (follow `docs/runbooks/security-incident.md`).
2. Generate a new Age key pair immediately.
3. Rotate all underlying passwords (RDS database, JWT secret, SMTP credentials) in addition to the Age key, because ciphertext in Git may have been decrypted by the adversary.
4. Update AWS Secrets Manager and K3s `sops-age` secret.
5. Re-encrypt all `secret.enc.yaml` files and push to Git.
