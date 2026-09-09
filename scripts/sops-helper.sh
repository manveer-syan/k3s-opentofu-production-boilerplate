#!/usr/bin/env bash
# ==============================================================================
# Mozilla SOPS Age Secrets Helper Script (Zero-Plaintext-Disk)
# Path: ate/scripts/sops-helper.sh
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOPS_CONFIG="${ROOT_DIR}/.sops.yaml"

if [ -z "${SOPS_AGE_KEY:-}" ] && [ -f "${HOME}/.config/sops/age/keys.txt" ]; then
  export SOPS_AGE_KEY_FILE="${HOME}/.config/sops/age/keys.txt"
fi

usage() {
  echo "Usage: $0 {edit|encrypt-file|view} [file-path]"
  echo "  edit         : Interactively edit a SOPS-encrypted file in-memory using SOPS"
  echo "  encrypt-file : Encrypt an unencrypted manifest directly into SOPS format"
  echo "  view         : Stream decrypted content to stdout without writing to disk"
  exit 1
}

if [ $# -lt 1 ]; then
  usage
fi

case "$1" in
  edit)
    if [ $# -lt 2 ]; then
      echo "Usage: $0 edit <path-to-encrypted-file>"
      exit 1
    fi
    sops --config "${SOPS_CONFIG}" "$2"
    ;;

  encrypt-file)
    if [ $# -lt 2 ]; then
      echo "Usage: $0 encrypt-file <path-to-plaintext-file> <path-to-encrypted-output>"
      exit 1
    fi
    sops --config "${SOPS_CONFIG}" --encrypt "$2" > "$3"
    echo "Encrypted $2 -> $3"
    ;;

  view)
    if [ $# -lt 2 ]; then
      echo "Usage: $0 view <path-to-encrypted-file>"
      exit 1
    fi
    sops --config "${SOPS_CONFIG}" --decrypt "$2"
    ;;

  *)
    usage
    ;;
esac
