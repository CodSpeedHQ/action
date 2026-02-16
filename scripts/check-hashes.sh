#!/bin/bash
# Usage: ./scripts/check-hashes.sh
# Verifies that all hashes in .codspeed-runner-installer-hashes.json match the
# actual SHA256 of the corresponding installer downloaded from GitHub releases.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HASHES_FILE="$SCRIPT_DIR/../.codspeed-runner-installer-hashes.json"

if [ ! -f "$HASHES_FILE" ]; then
  echo "Error: $HASHES_FILE not found"
  exit 1
fi

VERSIONS=$(jq -r 'keys_unsorted[]' "$HASHES_FILE")
TOTAL=$(echo "$VERSIONS" | wc -l | tr -d ' ')
FAILED=0
PASSED=0

echo "Checking $TOTAL installer hashes..."
echo

for VERSION in $VERSIONS; do
  EXPECTED_HASH=$(jq -r --arg v "$VERSION" '.[$v]' "$HASHES_FILE")
  URL="https://github.com/CodSpeedHQ/codspeed/releases/download/v${VERSION}/codspeed-runner-installer.sh"

  INSTALLER_TMP=$(mktemp)
  trap 'rm -f $INSTALLER_TMP' EXIT

  if ! curl -fsSL "$URL" -o "$INSTALLER_TMP" 2>/dev/null; then
    echo "FAIL  $VERSION - download failed ($URL)"
    FAILED=$((FAILED + 1))
    continue
  fi

  ACTUAL_HASH=$(sha256sum "$INSTALLER_TMP" | awk '{print $1}')
  rm -f "$INSTALLER_TMP"

  if [ "$ACTUAL_HASH" = "$EXPECTED_HASH" ]; then
    echo "OK    $VERSION"
    PASSED=$((PASSED + 1))
  else
    echo "FAIL  $VERSION - expected $EXPECTED_HASH, got $ACTUAL_HASH"
    FAILED=$((FAILED + 1))
  fi
done

echo
echo "$PASSED/$TOTAL passed, $FAILED failed"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
