# K3s Secrets Encryption at Rest — Architecture & Operation Runbook

> **Document Version**: 1.0.0  
> **Target Distribution**: Lightweight Kubernetes (K3s v1.28+)  
> **Security Domain**: Datastore Encryption at Rest / Defense-in-Depth  

---

## 1. Overview & Threat Model

In Project ATE, secrets are encrypted inside Git using **Mozilla SOPS + Age** and decrypted in-memory by **Flux v2 native SOPS provider** during reconciliation. However, once applied to the Kubernetes API server, Kubernetes `Secret` resources are stored inside the K3s datastore (embedded SQLite or Kine/etcd).

Without encryption at rest:
* Any process, backup, or unauthorized actor with filesystem access to `/var/lib/rancher/k3s/server/` or snapshot volumes can read plaintext tokens, passwords, and private keys directly from the datastore.

With **K3s Secrets Encryption at Rest**:
* All Kubernetes `Secret` payloads are encrypted before being committed to the datastore using AES-CBC (with PKCS#7 padding) or AES-GCM (with 32-byte keys).
* The encryption configuration and active keys are isolated under `/var/lib/rancher/k3s/server/cred/`.

```text
Git (SOPS Encrypted)
   │
   ▼
Flux v2 (Native In-Memory SOPS Decrypt)
   │
   ▼
K3s API Server (Decrypted in RAM)
   │
   ▼ AES-CBC / AES-GCM Encryption Provider
K3s Datastore (SQLite / Kine) -> Fully Encrypted at Rest
```

---

## 2. Declarative K3s Configuration

K3s provides native, automated lifecycle management for secrets encryption via the `--secrets-encryption` configuration flag.

### 2.1 Server Configuration File
On the EC2 host, ensure `/etc/rancher/k3s/config.yaml` contains:

```yaml
# /etc/rancher/k3s/config.yaml
write-kubeconfig-mode: "0644"
secrets-encryption: true
```

When K3s starts with `secrets-encryption: true`:
1. It automatically generates an encryption configuration file located at:
   `/var/lib/rancher/k3s/server/cred/encryption-config.json`
2. It secures the file with strict permissions (`0600`, owned by `root:root`).
3. It initializes the primary AES key and configures the `aescbc` provider as the active encryption provider for all `Secret` resources.

---

## 3. Operational CLI Management

K3s provides first-class CLI commands for inspecting and rotating datastore encryption keys.

### 3.1 Check Encryption Status
Run on the K3s server host:

```bash
sudo k3s secrets-encrypt status
```

**Expected Output:**
```text
Encryption Status: Enabled
Current Rotation Stage: reencrypt_finished
Server Encryption Hashes:
- ip-10-0-1-50: aescbc-key-2026-09-23T12:00:00 [Active]
```

### 3.2 Key Rotation Procedure

To rotate the datastore encryption key without downtime:

1. **Stage 1: Generate New Key**
   ```bash
   sudo k3s secrets-encrypt rotate
   ```
   *Generates a new key and sets it as the primary write key; previous keys remain valid for decryption.*

2. **Stage 2: Re-encrypt Existing Secrets**
   ```bash
   sudo k3s secrets-encrypt reencrypt
   ```
   *Iterates over all existing Secret objects in the datastore, rewrites them using the new active key, and removes deprecated keys.*

3. **Stage 3: Verify Completion**
   ```bash
   sudo k3s secrets-encrypt status
   ```
   *Confirm `Current Rotation Stage: reencrypt_finished`.*

---

## 4. Verification & Validation Commands

To verify that secrets are indeed encrypted in the underlying datastore and not stored in plaintext:

```bash
# 1. Query the SQLite database directly for any Secret record
sudo sqlite3 /var/lib/rancher/k3s/server/db/state.db \
  "SELECT substr(value, 1, 60) FROM kine WHERE name LIKE '%/secrets/%' LIMIT 1;"
```

**Expected Verification Result:**
The output should begin with `k8s:enc:aescbc:v1:` or similar encryption prefix followed by ciphertext bytes, confirming that plaintext base64 data is not stored in the database.

---

## 5. Disaster Recovery & Backup Integrity

1. **Filesystem Backup Requirements**:
   When taking EBS snapshots or backing up `/var/lib/rancher/k3s/`, the credential directory `/var/lib/rancher/k3s/server/cred/` **must** be preserved. Restoring a K3s database without its corresponding `encryption-config.json` will make all secrets unrecoverable.
2. **Emergency Key Recovery**:
   The active encryption key hash is recorded in `/var/lib/rancher/k3s/server/cred/encryption-state.json`. In the event of catastrophic server recreation, the key can be reinjected from an encrypted backup into `/var/lib/rancher/k3s/server/cred/`.
