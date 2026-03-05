#!/usr/bin/env bash
set -euo pipefail

# Run tests with an isolated Ship global dir so no state leaks into ~/.ship.
# The directory is removed automatically when tests finish.

TMP_ROOT="${TMPDIR:-/tmp}"
RUN_ROOT="$(mktemp -d "$TMP_ROOT/ship-test-global.XXXXXX")"
trap 'rm -rf "$RUN_ROOT"' EXIT

export SHIP_GLOBAL_DIR="$RUN_ROOT/.ship"
mkdir -p "$SHIP_GLOBAL_DIR"

exec cargo test "$@"
