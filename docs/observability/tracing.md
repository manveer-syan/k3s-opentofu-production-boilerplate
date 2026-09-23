# Distributed Tracing Architecture (OpenTelemetry & Tempo)

> **Document Version**: 1.0.0  
> **Target Subsystem**: Observability — Distributed Tracing  
> **Standard**: OpenTelemetry (OTel) / W3C TraceContext  

---

## 1. End-to-End Tracing Topology

In Project ATE, user interactions traverse multiple services:
FATE (Browser UI) -> GATE (API Gateway) -> STATE (Auth) / DATE (Notifications) -> PostgreSQL RDS.

Distributed tracing ensures that an individual user request can be tracked across the network hops with an immutable `trace_id`:

```text
Browser Client (FATE)
   │
   ▼ HTTP GET /api/v1/profile  [traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01]
Traefik Ingress Controller
   │
   ▼ Pass W3C Context
GATE (API Gateway - Root Span)
   ├──► HTTP POST /auth/validate  ────► STATE (Auth Service - Child Span)
   ├──► SQL SELECT * FROM users   ────► PostgreSQL RDS (DB Span)
   └──► HTTP POST /notify/confirm ────► DATE (Notification Service - Worker Span)
```

---

## 2. W3C Trace Context Header Propagation

All Go microservices propagate the official W3C Distributed Tracing specification headers:
* **`traceparent`**: Encodes version (`00`), 16-byte trace ID, 8-byte parent span ID, and trace flags (`01` = sampled).
  Example: `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`
* **`tracestate`**: Carries vendor-specific routing metadata without altering the trace ID.

### Go HTTP Client Context Injection Example
```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/propagation"
)

// InjectTraceContext injects traceparent into outbound HTTP requests
func InjectTraceContext(ctx context.Context, req *http.Request) {
    otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))
}
```

---

## 3. Environment-Based Sampling Configuration

To prevent high trace volumes from overwhelming node CPU and network bandwidth:

* **Production Environment**:
  ```bash
  OTEL_TRACES_SAMPLER=parentbased_traceidratio
  OTEL_TRACES_SAMPLER_ARG=0.10 # 10% probabilistic sampling
  ```
* **Staging Environment**:
  ```bash
  OTEL_TRACES_SAMPLER=always_on # 100% full sampling for debuggability
  ```

---

## 4. Correlating Traces with Logs in Grafana

By injecting the active `trace_id` and `span_id` into every structured JSON log line, Grafana enables seamless 1-click navigation between metric spikes, error logs, and distributed trace flamegraphs.
