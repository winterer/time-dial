#!/usr/bin/env bash
# Render release notes from canonical template
# Usage: ./render-release-notes.sh <tag> [output-file]
# Example: ./render-release-notes.sh v0.1.2
# Example: ./render-release-notes.sh v0.1.2 /tmp/notes.md

set -e

TAG="${1:-}"
OUTPUT_FILE="${2:-}"

if [[ -z "$TAG" ]]; then
  echo "Error: Tag version required" >&2
  echo "Usage: $0 <tag> [output-file]" >&2
  echo "Example: $0 v0.1.2" >&2
  echo "Example: $0 v0.1.2 /tmp/release-notes.md" >&2
  exit 1
fi

# Validate tag format (vX.Y.Z)
if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Tag must follow format vX.Y.Z (e.g., v0.1.2)" >&2
  exit 1
fi

# Find repo root (look for .git directory)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TEMPLATE_PATH="$REPO_ROOT/.github/release-notes-template.md"

if [[ ! -f "$TEMPLATE_PATH" ]]; then
  echo "Error: Template not found at $TEMPLATE_PATH" >&2
  exit 1
fi

# Render notes by replacing vX.Y.Z with actual tag
if [[ -n "$OUTPUT_FILE" ]]; then
  sed "s/vX.Y.Z/${TAG}/g" "$TEMPLATE_PATH" > "$OUTPUT_FILE"
  echo "✓ Release notes rendered to: $OUTPUT_FILE"
else
  sed "s/vX.Y.Z/${TAG}/g" "$TEMPLATE_PATH"
fi
