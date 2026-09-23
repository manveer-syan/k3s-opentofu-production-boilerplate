# TLS & Certificate Lifecycle Management

> **Document Version**: 1.0.0  
> **Security Domain**: Cryptographic Transport Security / Public Key Infrastructure (PKI)  
> **Target Ingress**: K3s Traefik Ingress Controller (Ports 80 & 443)  

---

## 1. Architectural Decisions & Termination Boundary

### 1.1 Termination Point
TLS terminates at the **Traefik L7 Ingress Controller** running inside the single-node K3s cluster. 
Traffic between external clients and the EC2 Elastic IP is encrypted over HTTPS (port 443). Internal traffic between Traefik and cluster backend services flows over the isolated pod virtual overlay network (`10.42.0.0/16`), protected by micro-segmented NetworkPolicies.

### 1.2 Certificate Management: Traefik Native ACME vs cert-manager

| Criterion | Traefik Native ACME (Recommended for t3.small) | cert-manager Operator |
| :--- | :--- | :--- |
| **Memory Footprint** | **0 MB extra RAM** (Built directly into K3s Traefik daemon) | **~120–150 MB RAM** (3 controller pods: `controller`, `cainjector`, `webhook`) |
| **Operational Overhead**| Lightweight declarative configuration in `/etc/rancher/k3s/config.yaml` | Requires maintaining CRDs (`Issuer`, `Certificate`, `Order`) |
| **Suitability** | **Optimal for single-node resource-constrained clusters** | Recommended for multi-cluster enterprise deployments |

---

## 2. Declarative K3s Traefik ACME Configuration

To enable automated Let's Encrypt certificate issuance on the K3s host:

Create or update `/var/lib/rancher/k3s/server/manifests/traefik-config.yaml`:

```yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    additionalArguments:
      - "--certificatesresolvers.letsencrypt.acme.email=devops@manveersyan.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/data/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
```

And in `k8s/base/ingress/ingress.yaml`, attach the resolver:

```yaml
metadata:
  annotations:
    traefik.ingress.kubernetes.io/router.tls.certresolver: letsencrypt
```

---

## 3. Automated Renewal & Storage

* **Issuing Authority**: Let's Encrypt Production CA (`https://acme-v02.api.letsencrypt.org/directory`).
* **Validation Method**: HTTP-01 challenge over port 80 (automatically routed by Traefik without downtime).
* **Renewal Threshold**: Evaluated daily; certificates are automatically renewed **30 days prior to expiration** (standard 90-day validity window).
* **Storage**: Cryptographic private keys and certificates are stored in `/data/acme.json` with strict `0600` permissions.

---

## 4. Renewal Failure Detection & Monitoring

1. **Prometheus Alerting**:
   Prometheus / VictoriaMetrics queries the ingress TLS expiration:
   * **Warning Alert**: Triggers if validity < 30 days.
   * **Critical Alert**: Triggers if validity < 7 days (`CertificateExpiringSoon`).
2. **External Blackbox Monitoring**:
   External uptime probes (UptimeRobot / BetterStack) perform daily TLS handshake validation against `https://ate.manveersyan.com` and alert if certificate expiration is under 14 days.

---

## 5. Break-Glass Manual Certificate Renewal

If automated ACME challenges fail (e.g. due to DNS changes or rate limits):

```bash
# 1. Manually generate or obtain external certificate (certbot standalone)
sudo certbot certonly --standalone -d ate.manveersyan.com

# 2. Inject the certificate directly into Kubernetes as a TLS Secret
kubectl create secret tls ate-tls-cert \
  --cert=/etc/letsencrypt/live/ate.manveersyan.com/fullchain.pem \
  --key=/etc/letsencrypt/live/ate.manveersyan.com/privkey.pem \
  --namespace=manveersyan-group \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Traefik automatically reloads the Secret dynamically without restart
kubectl get secret ate-tls-cert -n manveersyan-group
```
