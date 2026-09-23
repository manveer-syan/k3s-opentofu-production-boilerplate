# Architectural Blueprint: High Availability (HA) Evolution Roadmap

## 1. Executive Summary & Design Decision

Project ATE intentionally operates in **Mode A (Cost-Optimized Single Node)** to maintain infrastructure expenses below $40/month while serving early-stage production workloads. 

This document defines the evolutionary roadmap from **Mode A** to **Mode B (High Availability Multi-Node)**, outlining trigger criteria, component topologies, and migration mechanics without abandoning K3s, OpenTofu, or Flux.

---

## 2. Comparison Matrix: Mode A vs. Mode B

| Architectural Dimension | Mode A (Current Cost-Optimized) | Mode B (Enterprise HA Multi-Node) |
| :--- | :--- | :--- |
| **Compute Topology** | Single EC2 `t3.small` / `t3.medium` | 3 Control Plane / Worker Nodes (`t3.medium` or `t4g.medium`) |
| **Availability Zones** | Single AWS AZ (e.g. `us-east-1a`) | Multi-AZ (Distributed across `us-east-1a`, `1b`, `1c`) |
| **Datastore** | Embedded SQLite in K3s + Single RDS | K3s with external RDS PostgreSQL (Kine datastore) + Multi-AZ RDS |
| **Ingress Load Balancing** | Host-level Elastic IP / Traefik hostPort | AWS Network Load Balancer (NLB) spanning 3 AZs |
| **Pod Scheduling Resilience** | Single replica per service (`minAvailable: 0` PDB) | Multi-replica (>= 2) with PodAntiAffinity & TopologySpreadConstraints |
| **Disruption Protection** | Standard RollingUpdate (`maxSurge: 1, maxUnavailable: 0`) | Strict PodDisruptionBudgets (`minAvailable: 1`) |
| **Monthly Cost Estimate** | **~$36.50 / month** | **~$155.00 / month** |
| **SLA Guarantee** | 99.0% (Single-node hypervisor boundary) | 99.95% (Resilient to AZ or instance failure) |

---

## 3. Migration Trigger Criteria

Organizations should migrate to Mode B when any of the following triggers are met:
1. **Traffic Scale**: Sustained concurrent request rates exceed 250 requests/sec, causing CPU credit exhaustion on single-node instances.
2. **Business SLA Commitment**: Contractual commitments require >= 99.9% uptime, which cannot be guaranteed across AWS single-AZ maintenance events.
3. **Budget Readiness**: Operating budget allows for ~$150-$200/month infrastructure expenditure.
4. **Zero-Maintenance Downtime**: Requirements demand zero API dropouts during OS kernel upgrades and K3s binary upgrades.

---

## 4. Mode B Architecture & Topology Specification

```
                                +---------------------------+
                                |      AWS Route 53 DNS     |
                                +-------------+-------------+
                                              |
                                              v
                                +---------------------------+
                                |  AWS Network Load Balancer|
                                |       (Multi-AZ)          |
                                +-------------+-------------+
                                              |
                       +----------------------+----------------------+
                       |                      |                      |
                       v                      v                      v
              +------------------+   +------------------+   +------------------+
              | EC2 Node 1 (AZ-a)|   | EC2 Node 2 (AZ-b)|   | EC2 Node 3 (AZ-c)|
              |   (t3.medium)    |   |   (t3.medium)    |   |   (t3.medium)    |
              |                  |   |                  |   |                  |
              | Traefik Ingress  |   | Traefik Ingress  |   | Traefik Ingress  |
              | FATE (Replica 1) |   | FATE (Replica 2) |   | FATE (Replica 3) |
              | GATE (Replica 1) |   | GATE (Replica 2) |   | GATE (Replica 3) |
              | STATE (Replica 1)|   | STATE (Replica 2)|   | STATE (Replica 3)|
              | DATE (Replica 1) |   | DATE (Replica 2) |   | DATE (Replica 3) |
              +--------+---------+   +--------+---------+   +--------+---------+
                       |                      |                      |
                       +----------------------+----------------------+
                                              |
                                              v
                                +---------------------------+
                                |  AWS RDS PostgreSQL 15.7  |
                                |         Multi-AZ          |
                                | (Kine Cluster Datastore + |
                                |   Application Datastore)  |
                                +---------------------------+
```

### 4.1 Datastore Architecture: Kine with PostgreSQL
Rather than running an in-cluster embedded etcd cluster (which requires strict disk I/O latency < 10ms and high RAM overhead), Mode B utilizes **Kine** (built into K3s) pointing to the already existing AWS RDS PostgreSQL instance:
```bash
INSTALL_K3S_EXEC="server --datastore-endpoint='postgres://kine_user:pass@ate-prod-db.us-east-1.rds.amazonaws.com:5432/k3s_kine' --tls-san=ate-internal.cluster"
```
Benefits:
- Control plane state is backed by AWS RDS Multi-AZ durability and automated backups.
- EC2 worker nodes are completely stateless.
- Nodes can be destroyed and recreated at will with zero loss of Kubernetes cluster state.

### 4.2 Ingress Architecture: AWS NLB
- OpenTofu provisions an AWS Network Load Balancer (NLB) in the public subnets across 3 AZs.
- The NLB forwards TCP ports 80 and 443 directly to NodePorts or HostPorts on the 3 EC2 nodes where Traefik handles SSL termination.

---

## 5. Required Kubernetes Manifest Updates for Mode B

### 5.1 Topology Spread Constraints
Added to microservice deployments to guarantee pods never pack onto the same host:

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: "topology.kubernetes.io/zone"
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: api-gateway
  - maxSkew: 1
    topologyKey: "kubernetes.io/hostname"
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels:
        app: api-gateway
```

### 5.2 PodDisruptionBudgets (Re-Enabled in Mode B)
In Mode B with 3 replicas per service, PDBs can safely enforce high availability during node drains:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-gateway-pdb
  namespace: production-manveersyan-group
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api-gateway
```

---

## 6. Phased Implementation Roadmap

1. **Phase 1 (IaC Expansion)**:
   - Update `terraform/modules/vpc` to configure 3 public subnets and 3 private subnets across 3 AZs.
   - Update `terraform/modules/rds` to enable `multi_az = true`.
   - Add NLB module forwarding traffic to EC2 target groups.
2. **Phase 2 (K3s Kine Bootstrapping)**:
   - Initialize PostgreSQL database `k3s_kine` in RDS.
   - Provision 3 EC2 instances in an Auto Scaling Group across the 3 subnets.
   - Bootstrap K3s server on each node pointing to the Kine endpoint.
3. **Phase 3 (GitOps Overlay)**:
   - Create `k8s/overlays/production-ha/` with replica count = 3, topology spread constraints, and PDBs.
   - Switch Flux Kustomization target to `production-ha`.
