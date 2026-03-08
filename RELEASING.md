# Releasing

Use the [release checklist issue template](.github/ISSUE_TEMPLATE/release-checklist.md) to track releases.

## Quick Steps

1. Update `package.json` version to `X.Y.Z` (no `v` prefix)
2. Commit and push to `main`
3. Create GitHub Release with tag `vX.Y.Z`
4. Workflow validates version match and uploads assets
5. Verify URLs work (see issue template for links)

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
