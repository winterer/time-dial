#!/usr/bin/env bash
# Wait for Release Assets workflow to complete and verify release assets
# Usage: ./wait-for-release-assets.sh <tag>
# Example: ./wait-for-release-assets.sh v0.1.2

set -e

TAG="${1:-}"
if [[ -z "$TAG" ]]; then
  echo "Error: Tag version required" >&2
  echo "Usage: $0 <tag>" >&2
  echo "Example: $0 v0.1.2" >&2
  exit 1
fi

echo "Waiting for Release Assets workflow to complete for $TAG..."

# Poll workflow status up to 20 times (200 seconds / ~3 minutes)
for i in {1..20}; do
  json=$(gh run list --workflow "Release Assets" --limit 1 --json databaseId,displayTitle,status,conclusion,url,createdAt)
  status=$(printf '%s' "$json" | jq -r '.[0].status')
  conclusion=$(printf '%s' "$json" | jq -r '.[0].conclusion')
  
  echo "Iteration $i: status=$status, conclusion=$conclusion"
  
  if [[ "$status" == "completed" ]]; then
    if [[ "$conclusion" == "success" ]]; then
      echo "✓ Release Assets workflow completed successfully"
      break
    else
      echo "✗ Release Assets workflow failed with conclusion=$conclusion" >&2
      echo "  View details: $(printf '%s' "$json" | jq -r '.[0].url')" >&2
      exit 1
    fi
  fi
  
  sleep 10
done

# Verify workflow actually completed
status=$(gh run list --workflow "Release Assets" --limit 1 --json status --jq '.[0].status')
if [[ "$status" != "completed" ]]; then
  echo "✗ Timed out waiting for Release Assets workflow" >&2
  exit 1
fi

echo ""
echo "Fetching release metadata for $TAG..."

# Get release details
release_json=$(gh release view "$TAG" --json tagName,name,isPrerelease,isDraft,url,publishedAt,assets)
echo "$release_json" | jq .

# Verify assets are present
asset_count=$(echo "$release_json" | jq '.assets | length')
if [[ "$asset_count" -lt 2 ]]; then
  echo "✗ Expected 2 assets, found $asset_count" >&2
  exit 1
fi

echo ""
echo "Verifying asset URLs..."

# Extract and verify each asset URL
echo "$release_json" | jq -r '.assets[].url' | while read -r url; do
  asset_name=$(basename "$url")
  http_status=$(curl -I -s -o /dev/null -w '%{http_code}' "$url")
  if [[ "$http_status" =~ ^(200|302)$ ]]; then
    echo "✓ $asset_name → HTTP $http_status"
  else
    echo "✗ $asset_name → HTTP $http_status (expected 200 or 302)" >&2
    exit 1
  fi
done

echo ""
echo "✓ Release $TAG verified successfully"
echo "  URL: $(echo "$release_json" | jq -r '.url')"
