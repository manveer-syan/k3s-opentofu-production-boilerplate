# ==========================================
# Stage 1: Build Go Binary
# ==========================================
FROM golang:1.22-alpine AS builder

# Install build tools & SSL certs
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Cache Go modules
COPY go.mod ./
RUN go mod download

# Copy source code
COPY . .

# Build statically compiled binary without CGO dependencies
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o /app/ate-app main.go

# ==========================================
# Stage 2: Ultra-Minimal Production Runtime (~15MB Image)
# ==========================================
FROM alpine:3.19 AS runtime

RUN apk add --no-cache ca-certificates tzdata curl

WORKDIR /app

# Copy compiled Go binary
COPY --from=builder /app/ate-app /app/ate-app

# Expose HTTP Port
EXPOSE 8080

# Environment variables
ENV PORT=8080

# Container Health check instruction
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Execute binary
CMD ["/app/ate-app"]
