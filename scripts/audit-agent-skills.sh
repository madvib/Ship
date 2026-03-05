#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-${HOME:-$PWD}/.ship/skills}"

if [[ ! -d "$ROOT" ]]; then
  echo "skills root not found: $ROOT" >&2
  exit 1
fi

status=0

for dir in "$ROOT"/*; do
  [[ -d "$dir" ]] || continue
  id="$(basename "$dir")"
  skill="$dir/SKILL.md"

  if [[ ! -f "$skill" ]]; then
    echo "FAIL $id: missing SKILL.md"
    status=1
    continue
  fi

  if ! head -n1 "$skill" | rg -q '^---$'; then
    echo "FAIL $id: SKILL.md missing opening frontmatter delimiter"
    status=1
    continue
  fi

  if ! rg -q '^---$' "$skill"; then
    echo "FAIL $id: SKILL.md missing frontmatter delimiter"
    status=1
    continue
  fi

  name="$(awk '
    BEGIN { fm = 0 }
    /^---[[:space:]]*$/ { fm++; next }
    fm == 1 && /^name:[[:space:]]*/ {
      sub(/^name:[[:space:]]*/, "", $0)
      gsub(/^[\"'"'"'"'"'"'"'"'"' ]+|[\"'"'"'"'"'"'"'"'"' ]+$/, "", $0)
      print
      exit
    }
  ' "$skill")"

  if [[ -z "$name" ]]; then
    echo "FAIL $id: missing frontmatter name"
    status=1
    continue
  fi

  if ! printf '%s' "$name" | rg -q '^[a-z0-9]+(-[a-z0-9]+)*$'; then
    echo "FAIL $id: invalid name '$name' (expected lowercase-hyphen)"
    status=1
    continue
  fi

  if [[ ${#name} -gt 64 ]]; then
    echo "FAIL $id: name exceeds 64 chars"
    status=1
    continue
  fi

  if [[ "$name" != "$id" ]]; then
    echo "FAIL $id: frontmatter name '$name' does not match directory"
    status=1
    continue
  fi

  if ! awk '
    BEGIN { fm = 0; ok = 0 }
    /^---[[:space:]]*$/ { fm++; next }
    fm == 1 && /^description:[[:space:]]*/ { ok = 1 }
    END { exit(ok ? 0 : 1) }
  ' "$skill"; then
    echo "FAIL $id: missing frontmatter description"
    status=1
    continue
  fi

  extra="$(find "$dir" -mindepth 1 -maxdepth 1 -type f ! -name 'SKILL.md' -print | sed "s#^$dir/##" | tr '\n' ',' | sed 's/,$//')"
  if [[ -n "$extra" ]]; then
    echo "WARN $id: extra files not required by spec: $extra"
  else
    echo "PASS $id"
  fi
done

exit "$status"
