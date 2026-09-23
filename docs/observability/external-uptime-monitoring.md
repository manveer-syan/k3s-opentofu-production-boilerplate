# External Synthetic Uptime Monitoring Specification

> **Document Version**: 1.0.0  
> **Target Subsystem**: Reliability — External Synthetic Monitoring  
> **Philosophy**: Zero-Internal-Blindspots / Independent Failure Detection  

---

## 1. Architectural Need: Why Internal Monitoring Fails Alone

An internal observability stack (VictoriaMetrics + Grafana) running on the same K3s node as application workloads cannot alert operators when:
1. The EC2 instance suffers an abrupt hardware failure or kernel panic.
2. The AWS Elastic IP / Internet Gateway route table is misconfigured.
3. The DNS records at the domain registrar expire or point to an incorrect IP.
4. The Let's Encrypt TLS certificate expires and blocks user browsers.

**External synthetic uptime monitoring** probes your application endpoints from globally distributed multi-cloud nodes, completely independent of your AWS infrastructure.

---

## 2. Target Probe Endpoints & Acceptance Assertions

| Probe Target | Protocol | Interval | Timeout | Expected HTTP Status | Validation Assertion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `https://ate.manveersyan.com/` | HTTPS (GET) | 60 sec | 5 sec | **200 OK** | HTML contains root React DOM node; TLS certificate valid >= 14 days |
| `https://ate.manveersyan.com/api/health` | HTTPS (GET) | 60 sec | 3 sec | **200 OK** | Response JSON: `{"status":"healthy"}` |
| `https://ate.manveersyan.com/auth/health` | HTTPS (GET) | 60 sec | 3 sec | **200 OK** | Response JSON: `{"status":"healthy"}` |
| `https://ate.manveersyan.com/notifications/health`| HTTPS (GET) | 60 sec | 3 sec | **200 OK** | Response JSON: `{"status":"healthy"}` |

---

## 3. Recommended Cost-Conscious Providers

To preserve the project's FinOps discipline, use a provider with an operational free tier:

* **BetterStack (Uptime)**: Free tier supports up to 10 monitors with 3-minute checks and incident alerting via Email, SMS, and Push notifications.
* **UptimeRobot**: Free tier supports 50 HTTP monitors with 5-minute intervals.
* **AWS Route53 Health Checks**: ~$0.50/month per health check with native AWS CloudWatch alarm integration.

---

## 4. Operational Escalation Matrix

* **1 Consecutive Probe Failure**: Warning alert sent to internal DevOps Slack / Telegram channel.
* **2 Consecutive Probe Failures (from >= 2 distinct geographical regions)**: High-priority page to on-call platform engineer.
* **TLS Certificate Expiring < 14 Days**: Scheduled maintenance notification to review Traefik ACME logs.
