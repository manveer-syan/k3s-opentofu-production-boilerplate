#!/usr/bin/env bash
# ==============================================================================
# Script: Kubernetes Capacity & Allocation Headroom Report
# Path: scripts/k8s-capacity-report.sh
# ==============================================================================

set -euo pipefail

echo "================================================================================"
echo " Project ATE — Kubernetes Workload Capacity & Sizing Audit"
echo "================================================================================"

# Baseline Instance Specifications
declare -A INSTANCE_RAM=(
  ["t3.small"]="2048"
  ["t3.medium"]="4096"
  ["t4g.medium"]="4096"
)

declare -A INSTANCE_CPU=(
  ["t3.small"]="2000"
  ["t3.medium"]="2000"
  ["t4g.medium"]="2000"
)

# K3s & Daemon Overhead (MB & millicores)
SYSTEM_OVERHEAD_RAM=1140
SYSTEM_OVERHEAD_CPU=480

echo ""
echo "--- 1. Static Manifest Resource Allocations ---"

TOTAL_REQ_CPU=0
TOTAL_LIM_CPU=0
TOTAL_REQ_RAM=0
TOTAL_LIM_RAM=0

# Workload configurations (based on hardened base deployments)
declare -A APP_REQ_CPU=( ["web-frontend"]=50 ["api-gateway"]=75 ["auth-service"]=75 ["notification-service"]=50 )
declare -A APP_LIM_CPU=( ["web-frontend"]=250 ["api-gateway"]=500 ["auth-service"]=500 ["notification-service"]=250 )
declare -A APP_REQ_RAM=( ["web-frontend"]=64 ["api-gateway"]=96 ["auth-service"]=96 ["notification-service"]=64 )
declare -A APP_LIM_RAM=( ["web-frontend"]=128 ["api-gateway"]=256 ["auth-service"]=256 ["notification-service"]=128 )

printf "%-25s | %-12s | %-12s | %-12s | %-12s\n" "Workload" "CPU Req (m)" "CPU Lim (m)" "RAM Req (Mi)" "RAM Lim (Mi)"
echo "--------------------------------------------------------------------------------"

for app in web-frontend api-gateway auth-service notification-service; do
  req_cpu=${APP_REQ_CPU[$app]}
  lim_cpu=${APP_LIM_CPU[$app]}
  req_ram=${APP_REQ_RAM[$app]}
  lim_ram=${APP_LIM_RAM[$app]}

  printf "%-25s | %-12s | %-12s | %-12s | %-12s\n" "$app" "$req_cpu" "$lim_cpu" "$req_ram" "$lim_ram"

  TOTAL_REQ_CPU=$((TOTAL_REQ_CPU + req_cpu))
  TOTAL_LIM_CPU=$((TOTAL_LIM_CPU + lim_cpu))
  TOTAL_REQ_RAM=$((TOTAL_REQ_RAM + req_ram))
  TOTAL_LIM_RAM=$((TOTAL_LIM_RAM + lim_ram))
done

echo "--------------------------------------------------------------------------------"
printf "%-25s | %-12s | %-12s | %-12s | %-12s\n" "Subtotal (1 Replica)" "$TOTAL_REQ_CPU" "$TOTAL_LIM_CPU" "$TOTAL_REQ_RAM" "$TOTAL_LIM_RAM"
printf "%-25s | %-12s | %-12s | %-12s | %-12s\n" "Subtotal (2 Replicas)" "$((TOTAL_REQ_CPU * 2))" "$((TOTAL_LIM_CPU * 2))" "$((TOTAL_REQ_RAM * 2))" "$((TOTAL_LIM_RAM * 2))"
printf "%-25s | %-12s | %-12s | %-12s | %-12s\n" "Platform System Overhead" "$SYSTEM_OVERHEAD_CPU" "-" "$SYSTEM_OVERHEAD_RAM" "-"

echo ""
echo "--- 2. Node Headroom Analysis Across Instance Types ---"

for instance in "t3.small" "t3.medium" "t4g.medium"; do
  total_ram=${INSTANCE_RAM[$instance]}
  total_cpu=${INSTANCE_CPU[$instance]}

  # 1 Replica calculation
  used_ram_n1=$((SYSTEM_OVERHEAD_RAM + TOTAL_REQ_RAM))
  headroom_ram_n1=$((total_ram - used_ram_n1))
  pct_headroom_n1=$(( (headroom_ram_n1 * 100) / total_ram ))

  # 2 Replicas calculation
  used_ram_n2=$((SYSTEM_OVERHEAD_RAM + (TOTAL_REQ_RAM * 2) ))
  headroom_ram_n2=$((total_ram - used_ram_n2))
  pct_headroom_n2=$(( (headroom_ram_n2 * 100) / total_ram ))

  echo "Instance: $instance (${total_ram}MB RAM, ${total_cpu}m CPU)"
  echo "  Mode N=1: Used RAM: ${used_ram_n1}MB | Remaining Headroom: ${headroom_ram_n1}MB (${pct_headroom_n1}%)"
  echo "  Mode N=2: Used RAM: ${used_ram_n2}MB | Remaining Headroom: ${headroom_ram_n2}MB (${pct_headroom_n2}%)"
  if [ "$headroom_ram_n2" -lt 300 ]; then
    echo "  Status: WARNING — Low headroom for N=2 replicas. Swap usage expected under load."
  else
    echo "  Status: HEALTHY — Sustainable headroom for production buffer."
  fi
  echo ""
done

echo "================================================================================"
echo " Capacity audit complete."
echo "================================================================================"
