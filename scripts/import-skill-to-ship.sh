#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Import an Agent Skill from a GitHub repo into a Ship skills folder.

Usage:
  scripts/import-skill-to-ship.sh <owner/repo> <skill-id> [options]

Options:
  --ref <git-ref>          Git ref to clone (default: main)
  --dest <path>            Destination skills directory (default: ~/.ship/skills)
  --repo-path <path>       Subpath in repo to search (default: .)
  --force                  Overwrite destination if it already exists
  --keep-tmp               Keep temp clone directory for inspection
  -h, --help               Show this help message

Examples:
  scripts/import-skill-to-ship.sh vercel-labs/agent-skills vercel-react-best-practices
  scripts/import-skill-to-ship.sh anthropics/skills mcp-builder --repo-path skills --ref main
EOF
}

if [[ $# -lt 2 ]]; then
  usage
  exit 1
fi

REPO="$1"
SKILL_ID="$2"
shift 2

REF="main"
DEST_DIR="${HOME:-$PWD}/.ship/skills"
REPO_PATH="."
FORCE="false"
KEEP_TMP="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref)
      REF="${2:-}"
      shift 2
      ;;
    --dest)
      DEST_DIR="${2:-}"
      shift 2
      ;;
    --repo-path)
      REPO_PATH="${2:-}"
      shift 2
      ;;
    --force)
      FORCE="true"
      shift
      ;;
    --keep-tmp)
      KEEP_TMP="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$REF" || -z "$DEST_DIR" || -z "$REPO_PATH" ]]; then
  echo "Invalid empty argument." >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  if [[ "$KEEP_TMP" == "true" ]]; then
    echo "[ship] kept temp directory: $TMP_DIR"
  else
    rm -rf "$TMP_DIR"
  fi
}
trap cleanup EXIT

REPO_URL="https://github.com/${REPO}.git"
echo "[ship] cloning ${REPO_URL}@${REF} ..."
git clone --depth 1 --branch "$REF" "$REPO_URL" "$TMP_DIR/repo" >/dev/null 2>&1

SEARCH_ROOT="$TMP_DIR/repo/$REPO_PATH"
if [[ ! -d "$SEARCH_ROOT" ]]; then
  echo "[ship] repo path not found: $REPO_PATH" >&2
  exit 1
fi

MATCH_DIRS=()
while IFS= read -r skill_file; do
  dir="$(dirname "$skill_file")"
  base="$(basename "$dir")"
  if [[ "$base" == "$SKILL_ID" ]]; then
    MATCH_DIRS+=("$dir")
  fi
done < <(find "$SEARCH_ROOT" -type f -name "SKILL.md")

if [[ ${#MATCH_DIRS[@]} -eq 0 ]]; then
  echo "[ship] skill '$SKILL_ID' not found in ${REPO}/${REPO_PATH}" >&2
  echo "[ship] available skill IDs:" >&2
  find "$SEARCH_ROOT" -type f -name "SKILL.md" -print \
    | sed 's#/SKILL.md$##' \
    | xargs -I{} basename "{}" \
    | sort -u \
    | sed 's/^/  - /' >&2
  exit 1
fi

SRC_DIR="${MATCH_DIRS[0]}"
if [[ ${#MATCH_DIRS[@]} -gt 1 ]]; then
  echo "[ship] warning: multiple matches for '$SKILL_ID'; using: $SRC_DIR" >&2
fi

mkdir -p "$DEST_DIR"
CANONICAL_ID="$(awk '
  BEGIN { in_fm = 0 }
  /^---[[:space:]]*$/ {
    in_fm++
    next
  }
  in_fm == 1 && $1 == "name:" {
    sub(/^name:[[:space:]]*/, "", $0)
    gsub(/["'\''[:space:]]/, "", $0)
    print $0
    exit
  }
' "$SRC_DIR/SKILL.md")"

if [[ -z "${CANONICAL_ID:-}" ]]; then
  CANONICAL_ID="$SKILL_ID"
fi

DEST_SKILL_DIR="$DEST_DIR/$CANONICAL_ID"

if [[ -e "$DEST_SKILL_DIR" ]]; then
  if [[ "$FORCE" != "true" ]]; then
    echo "[ship] destination exists: $DEST_SKILL_DIR (use --force to overwrite)" >&2
    exit 1
  fi
  rm -rf "$DEST_SKILL_DIR"
fi

cp -R "$SRC_DIR" "$DEST_SKILL_DIR"
echo "[ship] imported skill '$SKILL_ID' (canonical: '$CANONICAL_ID') from '$REPO' -> '$DEST_SKILL_DIR'"
