# Software Supply Chain Security & Provenance Specification

> **Document Version**: 1.0.0  
> **Security Standards**: SLSA Framework (Level 2/3) / NIST SP 800-218 (SSDF)  
> **Target Toolchain**: GitLab CI, Trivy, Syft, Cosign, and GitLab Container Registry  

---

## 1. Supply Chain Architecture & Trust Chain

The Project ATE software supply chain enforces end-to-end provenance: every binary running inside production Kubernetes can be cryptographically traced to an exact Git commit SHA, build log, and vulnerability audit:

```text
Source Code (Git Commit SHA)
   │
   ▼
GitLab CI (Hermetic Docker Build)
   │
   ├──► 1. Trivy Vulnerability Scan (Block on HIGH/CRITICAL)
   ├──► 2. CycloneDX SBOM Generation (Full dependency tree)
   ├──► 3. Cosign Cryptographic Signature (Image integrity proof)
   │
   ▼
GitLab Container Registry (registry.gitlab.com/manveersyan-group/<service>:<commit-sha>)
   │
   ▼
GitOps Overlay Promotion (newTag: <commit-sha>)
   │
   ▼
In-Cluster Runtime (K3s + Kyverno Image Validation)
```

---

## 2. Immutable Image Tagging vs. `:latest`

### The Security Risk of `:latest`
1. **Non-Deterministic Rollouts**: Pods restarting across nodes pull different underlying layers if `:latest` is overwritten in the registry.
2. **Rollback Impossibility**: If a bad image is pushed to `:latest`, rolling back a Deployment fails because Kubernetes sees no change in the image string.
3. **Forensic Blindness**: Incident responders cannot determine what exact source code version is running inside a compromised container.

### Mandatory Tagging Standard
* **Production & Staging**: Images are tagged strictly with the immutable Git commit short SHA (`$CI_COMMIT_SHORT_SHA`) or semantic release version (e.g., `v1.2.0`).
* **Enforcement**: Kyverno ClusterPolicy `disallow-latest-tag` audits and blocks any pod spec containing `:latest` in `manveersyan-group`.

---

## 3. Software Bill of Materials (SBOM)

An SBOM is generated for every container image artifact using Trivy in CycloneDX JSON format:

```bash
trivy image --input image.tar --format cyclonedx --output sbom.cdx.json
```

* **Storage**: Retained as an immutable build artifact in GitLab CI for 30 days and linked to the image release.
* **Format**: CycloneDX v1.4+ / SPDX compliant.
* **Audit Value**: Allows immediate querying for newly disclosed zero-day CVEs (e.g. Log4j, OpenSSL) across all historical builds without re-scanning images.

---

## 4. Cryptographic Image Signing with Cosign

Production container images are signed before being pushed to the container registry using **Sigstore / Cosign**:

### Verification Command
Cluster operators and CI runners can verify image signatures out-of-band:

```bash
# Verify image signature against Cosign public key or GitLab OIDC identity
cosign verify \
  --key cosign.pub \
  registry.gitlab.com/manveersyan-group/api-gateway:v1.0.0
```

---

## 5. Container Registry Security & Lifecycle Rules

1. **Access Control**: All repositories under `registry.gitlab.com/manveersyan-group/` are set to **Private**.
2. **Authentication**:
   * CI uses ephemeral `$CI_JOB_TOKEN` (short-lived, scoped to pipeline execution).
   * K3s cluster nodes pull using a dedicated, read-only GitLab Deploy Token stored in the `regcred` Kubernetes Secret.
3. **Image Retention & Cleanup Policy**:
   * Keep the last 10 versions of tagged application releases.
   * Remove untagged image layers older than 14 days.
   * Tagged release tags (`v*`) are protected and immutable.
