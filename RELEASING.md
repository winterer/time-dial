# Releasing

Use the [release checklist issue template](.github/ISSUE_TEMPLATE/release-checklist.md) to track releases.

## Quick Steps

1. Update `package.json` version to `X.Y.Z` (no `v` prefix)
2. Commit and push to `main`
3. Create GitHub Release with tag `vX.Y.Z`
4. Workflow validates version match and uploads assets
5. Verify URLs work (see issue template for links)

## Release via gh CLI

Prerequisites:

- Install and authenticate GitHub CLI: `gh auth login`
- Work from a clean branch synced with `main`

Example release flow for `vX.Y.Z`:

```bash
# 1) Bump package.json version (no git tag from npm)
npm version X.Y.Z --no-git-tag-version

# 2) Commit and push version change
git add package*.json
git commit -m "chore: release vX.Y.Z"
git push origin main

# 3) Create GitHub release (this also creates tag vX.Y.Z from main)
#    Keep notes empty to let the workflow prefill from template.
gh release create vX.Y.Z \
	--target main \
	--title "vX.Y.Z" \
	--notes ""
```

Optional checks:

```bash
# Latest Release Assets workflow run (structured output)
gh run list --workflow "Release Assets" --limit 1 --json databaseId,displayTitle,status,conclusion,url,createdAt

# Release metadata (structured output)
gh release view vX.Y.Z --json tagName,name,isPrerelease,isDraft,url,publishedAt,assets
```

## Versioning Rules

- `package.json`: `X.Y.Z`
- Git tags: `vX.Y.Z`
- Release workflow enforces match

## What Happens on Release

The `Release Assets` workflow automatically:

- Verifies tag version (`vX.Y.Z`) matches `package.json` (`X.Y.Z`)
- Builds production assets with `npm run build`
- Uploads `time-dial.js` and `time-dial-themes.css` to the release

## Post-Release Verification

Check these URLs after workflow completes:

- **Version-pinned:** `https://github.com/winterer/time-dial/releases/download/vX.Y.Z/time-dial.js`
- **Latest (non-prerelease only):** `https://github.com/winterer/time-dial/releases/latest/download/time-dial.js`

If publishing as a prerelease, the `latest` alias won't update.

## Release Notes Template

Copy/paste this in future releases and replace `vX.Y.Z`:

## Installation

### CDN (jsDelivr)

```html
<!-- Latest published version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/winterer/time-dial@latest/src/time-dial-themes.css">
<script src="https://cdn.jsdelivr.net/gh/winterer/time-dial@latest/src/time-dial.js"></script>
```

```html
<!-- Version pinned -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/winterer/time-dial@vX.Y.Z/src/time-dial-themes.css">
<script src="https://cdn.jsdelivr.net/gh/winterer/time-dial@vX.Y.Z/src/time-dial.js"></script>
```

### Self-Host Minified Release Assets (Optional)
Download release assets and serve them from your own server/CDN:

```html
<link rel="stylesheet" href="/assets/time-dial-themes.css">
<script src="/assets/time-dial.js"></script>
```

> Do not include `npm install time-dial` in release notes until an npm package is actually published.
