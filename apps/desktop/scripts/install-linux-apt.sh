#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${GOUSB_AI_APT_REPO_URL:-https://peiiii.github.io/go-usb-ai/apt}"
KEYRING_PATH="/etc/apt/keyrings/go-usb-ai-archive-keyring.gpg"
SOURCE_LIST_PATH="/etc/apt/sources.list.d/go-usb-ai.list"
PACKAGE_NAME="go-usb-ai-desktop"
SUPPORTED_ARCH="amd64"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to install ${PACKAGE_NAME}." >&2
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "apt-get is required to install ${PACKAGE_NAME}." >&2
  exit 1
fi

ARCH="$(dpkg --print-architecture)"
if [ "${ARCH}" != "${SUPPORTED_ARCH}" ]; then
  echo "Unsupported architecture: ${ARCH}. ${PACKAGE_NAME} is currently published for ${SUPPORTED_ARCH} only." >&2
  exit 1
fi

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo is required when running as a non-root user." >&2
    exit 1
  fi
  SUDO="sudo"
fi

TEMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

echo "[go-usb-ai] configuring APT source at ${REPO_URL}"
${SUDO} mkdir -p /etc/apt/keyrings

curl -fsSL "${REPO_URL}/go-usb-ai-archive-keyring.gpg" -o "${TEMP_DIR}/go-usb-ai-archive-keyring.gpg"
${SUDO} install -m 0644 "${TEMP_DIR}/go-usb-ai-archive-keyring.gpg" "${KEYRING_PATH}"

printf 'deb [arch=%s signed-by=%s] %s stable main\n' "${SUPPORTED_ARCH}" "${KEYRING_PATH}" "${REPO_URL}" \
  | ${SUDO} tee "${SOURCE_LIST_PATH}" >/dev/null

echo "[go-usb-ai] updating package index"
${SUDO} apt-get update

echo "[go-usb-ai] installing ${PACKAGE_NAME}"
${SUDO} apt-get install -y "${PACKAGE_NAME}"

echo "[go-usb-ai] installation complete"
