#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[smoke] running ship migrate"
cargo run -p cli -- migrate

echo "[smoke] listing migrated workflow entities"
cargo run -p cli -- issue list || true
cargo run -p cli -- spec list || true
cargo run -p cli -- feature list || true
cargo run -p cli -- release list || true

echo "[smoke] verifying required namespace directories"
test -d .ship/workflow/issues
test -d .ship/workflow/specs
test -d .ship/workflow/features
test -d .ship/project/adrs
test -d .ship/project/releases
test -f .ship/ship.db

echo "[smoke] migration smoke checks passed"
