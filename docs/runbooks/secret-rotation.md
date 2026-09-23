# Runbook: Routine Secret & Credential Rotation

## 1. Overview and Rotation Schedule

Regular cryptographic hygiene requires proactive secret rotation before expiration or compromise occurs:

| Secret Category | Target Secret | Recommended Cadence | Zero-Downtime Method |
| :--- | :--- | :--- | :--- |
| **Database Credentials** | RDS Master & App Password | 90 Days | Dual-user rotation |
| **Authentication Keys** | JWT Signing Secret | 60 Days | Dual-key verification |
| **Notification Gateway** | SMTP / Sendgrid API Key | 90 Days | Staged credential cutover |
| **GitOps Cryptography** | SOPS Age Key Pair | 180 Days | Dual-recipient in `.sops.yaml` |
| **Observability** | Grafana Admin Password | 90 Days | In-place secret recreation |

---

## 2. Procedure: SOPS Age Key Rotation (Dual Recipient)

To rotate Age keys without breaking existing production secrets:

1. Generate a new Age key:
   ```bash
   age-keygen -o ~/.sops/ate-production-2026.agekey
   NEW_PUBKEY=$(grep "public key:" ~/.sops/ate-production-2026.agekey | cut -d: -f2 | xargs)
   ```

2. Add the new public key as a recipient in `.sops.yaml` alongside the existing one:
   ```yaml
   creation_rules:
     - path_regex: k8s/overlays/production/.*\.enc\.yaml$
       age: >-
         age1existingpublickey...,
         age1newpublickey...
   ```

3. Update the existing encrypted files with the new recipient:
   ```bash
   find k8s/overlays/production -name "secret.enc.yaml" -exec sops updatekeys -y {} +
   ```

4. Append the new private key to AWS Secrets Manager and the cluster `sops-age` secret:
   ```bash
   # Both keys can coexist in age.agekey separated by newlines
   COMBINED_KEYS=$(cat ~/.sops/ate-production-old.agekey ~/.sops/ate-production-2026.agekey)
   kubectl -n flux-system create secret generic sops-age \
     --from-literal=age.agekey="${COMBINED_KEYS}" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

5. Once verified that Flux can decrypt with the new key, remove the deprecated public key from `.sops.yaml` and run `sops updatekeys` again.

---

## 3. Procedure: JWT Secret Rotation (Zero-Downtime)

1. STATE auth service supports primary and secondary verification keys:
   - Primary: Used to issue new tokens.
   - Secondary (Previous): Used to validate existing active tokens during migration.
2. In `k8s/overlays/production/auth-service/secret.enc.yaml`:
   - Set `JWT_PREVIOUS_SECRET` to the current `JWT_SECRET`.
   - Set `JWT_SECRET` to the newly generated key.
3. Decrypt, edit, and encrypt via SOPS:
   ```bash
   sops k8s/overlays/production/auth-service/secret.enc.yaml
   ```
4. Commit to Git. Flux will reconcile and trigger a rolling restart of `auth-service`.
5. After the token TTL (e.g. 24 hours) has elapsed, remove `JWT_PREVIOUS_SECRET`.

---

## 4. Procedure: PostgreSQL App Password Rotation

1. Create a secondary database user with identical privileges:
   ```sql
   CREATE USER appuser_v2 WITH PASSWORD '<NEW_PASSWORD>';
   GRANT ALL PRIVILEGES ON DATABASE appdb TO appuser_v2;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO appuser_v2;
   ```
2. Update the credentials in `k8s/overlays/production/auth-service/secret.enc.yaml` and `api-gateway/secret.enc.yaml`.
3. Commit and let Flux perform a rolling restart.
4. Verify connections from `appuser_v2` in `pg_stat_activity`.
5. Drop the old user once zero active sessions remain:
   ```sql
   DROP USER appuser_v1;
   ```
