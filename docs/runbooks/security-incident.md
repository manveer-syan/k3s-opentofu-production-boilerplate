# Runbook: Security Incident Response & Credential Compromise

## 1. Overview & Classification

This runbook guides engineers through containing and resolving security compromises involving:
- Accidental commit of plaintext credentials or Age private keys.
- GitLab CI/CD token or API access token compromise.
- Database credential leaks.
- Compromised container host or malicious container breakout attempt.

---

## 2. Phase 1: Immediate Blast Radius Containment (< 15 Minutes)

### Scenario A: SOPS Age Private Key Compromised
If the private key in AWS Secrets Manager or developer workstation is exposed:
1. **Rotate Age Key Immediately**:
   - Generate a brand-new Age key pair:
     ```bash
     age-keygen -o /tmp/new_key.txt
     NEW_PUBLIC_KEY=$(grep "public key:" /tmp/new_key.txt | cut -d: -f2 | xargs)
     NEW_PRIVATE_KEY=$(grep -v "public key:" /tmp/new_key.txt | grep -v "#" | xargs)
     ```
   - Update AWS Secrets Manager with the new private key:
     ```bash
     aws secretsmanager put-secret-value \
       --secret-id "manveersyan-production-sops-age-key" \
       --secret-string "${NEW_PRIVATE_KEY}"
     ```
   - Update in-cluster secret in `flux-system`:
     ```bash
     kubectl -n flux-system create secret generic sops-age \
       --from-literal=age.agekey="${NEW_PRIVATE_KEY}" \
       --dry-run=client -o yaml | kubectl apply -f -
     ```
   - Update `.sops.yaml` with the `${NEW_PUBLIC_KEY}`.
   - Re-encrypt all secrets across `k8s/overlays/production/` and `k8s/overlays/staging/`:
     ```bash
     sops updatekeys k8s/overlays/production/api-gateway/secret.enc.yaml
     sops updatekeys k8s/overlays/production/auth-service/secret.enc.yaml
     sops updatekeys k8s/overlays/production/notification-service/secret.enc.yaml
     sops updatekeys k8s/overlays/production/web-frontend/secret.enc.yaml
     ```
   - Commit and push to Git.

### Scenario B: Database Master Credential Compromised
If RDS database credentials (`db_password`) are leaked:
1. Generate a new high-entropy password:
   ```bash
   NEW_DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
   ```
2. Update RDS master user password via AWS CLI:
   ```bash
   aws rds modify-db-instance \
     --db-instance-identifier ate-production-postgres \
     --master-user-password "${NEW_DB_PASSWORD}" \
     --apply-immediately
   ```
3. Update encrypted secrets in Git via SOPS:
   ```bash
   sops k8s/overlays/production/auth-service/secret.enc.yaml
   # Update DB_PASSWORD field
   ```
4. Push to Git and trigger Flux reconciliation:
   ```bash
   flux reconcile kustomization ate-production --with-source
   ```
5. Restart application pods to pick up the new secret:
   ```bash
   kubectl -n production-manveersyan-group rollout restart deployment auth-service
   ```

### Scenario C: GitLab Deploy Token or Access Token Leaked
1. Revoke the token immediately via GitLab UI:
   - Navigate to `Project Settings > Repository > Deploy Tokens`.
   - Click `Revoke` on the compromised token.
2. Invalidate all active personal access tokens for the compromised identity.
3. Check GitLab audit events for unauthorized commits or registry pulls.

---

## 3. Phase 2: Host & Container Forensics

1. Check for unauthorized interactive shells or process spawns:
   ```bash
   # On EC2 Host
   ps auxf | grep -E 'sh|bash|curl|wget|nc|python'
   ```
2. Verify container runtime integrity:
   ```bash
   sudo k3s crictl ps
   ```
3. Check Kubernetes audit logs and authentication failures:
   ```bash
   journalctl -u k3s --no-pager | grep -i "unauthorized" | tail -n 50
   ```
4. Verify whether any Pod violated restricted security standards:
   ```bash
   ./scripts/security-posture-check.sh
   ```

---

## 4. Phase 3: Post-Incident Remediation & Git History Purge

If plaintext secrets were accidentally committed to Git:
1. Never assume deleting the file in a new commit is sufficient.
2. Run `git-filter-repo` or BFG Repo-Cleaner to rewrite history and excise the secret blobs.
3. Force-push to all remote branches.
4. Rotate any credential that ever existed in that plaintext state regardless of whether the repository was private.
5. File formal Incident Post-Mortem within 48 hours.
