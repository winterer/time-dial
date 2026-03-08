---
name: create-github-release
description: Create and validate GitHub releases for time-dial. Handles version bumping, release note generation, tag creation, and workflow verification. Includes helper scripts for rendering notes and polling Release Assets workflow. Use for: cutting releases, bumping versions, verifying assets/URLs.
---

# Create GitHub Release (time-dial)

Use this skill to create, prepare, or verify a release. The process includes version bumping, release note generation from a canonical template, GitHub release creation, and automated verification of the Release Assets workflow and published artifacts.

## Repository-specific rules

- **Release tag format:** `vX.Y.Z` (e.g., `v0.1.2`)
- **package.json version:** `X.Y.Z` (no `v` prefix)
- **Version sync:** Tag version must match `package.json` version (enforced by workflow)
- **Release workflow:** `.github/workflows/release-assets.yml`
- **Release notes template:** `.github/release-notes-template.md`
- **Published assets:** `time-dial.js` and `time-dial-themes.css` (from `dist/`)
- **npm disclaimer:** Do not claim npm install support in release notes unless explicitly published to npm

## Helper Scripts

Two bash scripts in this skill folder automate key release tasks:

### render-release-notes.sh

Generates release notes from the canonical template by replacing `vX.Y.Z` placeholders.

**Usage:**
```bash
# Output to stdout (for piping to gh release create)
.github/skills/create-github-release/render-release-notes.sh vX.Y.Z

# Output to file (for review/editing)
.github/skills/create-github-release/render-release-notes.sh vX.Y.Z /tmp/release-notes.md
```

**Features:**
- Validates tag format (`vX.Y.Z`)
- Replaces all placeholder occurrences with actual version
- Outputs to stdout by default, or to specified file

### wait-for-release-assets.sh

Polls Release Assets workflow until completion and verifies published artifacts.

**Usage:**
```bash
.github/skills/create-github-release/wait-for-release-assets.sh vX.Y.Z
```

**Features:**
- Polls workflow up to 20 times (200 seconds / ~3 minutes timeout)
- Exits immediately on workflow success or failure
- Verifies release metadata and asset count (expects 2 assets)
- Validates HTTP response codes for asset download URLs (200 or 302)

Use this after `gh release create` to automate end-to-end verification.

## Release Workflow

### Phase 1: Version Selection

**Determine target version before executing any release commands.**

If user provides version:
- Accept `X.Y.Z` or `vX.Y.Z` format (normalize to `vX.Y.Z` internally for tags)
- Proceed to Phase 2

If no version provided:
1. Read current version from `package.json`
2. Present these options (mark patch as recommended):
   - **Patch:** `vX.Y.(Z+1)` (e.g., `1.2.3` → `1.2.4`)
   - **Minor:** `vX.(Y+1).0` (e.g., `1.2.3` → `1.3.0`)
   - **Major:** `v(X+1).0.0` (e.g., `1.2.3` → `2.0.0`)
   - **Custom:** User-specified version
3. Wait for explicit user confirmation
4. Never run mutation commands (`npm version`, `git commit`, `git push`, `gh release create`) until version is confirmed

**Prompt template:**
> Current package.json version is vX.Y.Z. Which target version should I use? Options: patch vX.Y.(Z+1), minor vX.(Y+1).0, major v(X+1).0.0, or a custom version.

### Phase 2: Version Bump & Commit

Update `package.json` and push to `main`:

```bash
# Bump version (updates package.json and package-lock.json)
npm version X.Y.Z --no-git-tag-version

# Commit and push
git add package*.json
git commit -m "chore: release vX.Y.Z"
git push origin main
```

### Phase 3: Release Creation

Create GitHub release with rendered notes from canonical template:

```bash
gh release create vX.Y.Z \
	--target main \
	--title "vX.Y.Z" \
	--notes "$(.github/skills/create-github-release/render-release-notes.sh vX.Y.Z)"
```

This triggers the `.github/workflows/release-assets.yml` workflow automatically, which:
1. Checks out the tagged commit
2. Installs dependencies (`npm ci`)
3. Builds distribution files (`npm run build`)
4. Uploads `time-dial.js` and `time-dial-themes.css` to the release

### Phase 4: Verification

Verify workflow completion and asset availability:

```bash
# Automated verification (recommended)
.github/skills/create-github-release/wait-for-release-assets.sh vX.Y.Z
```

**Manual verification (alternative):**

```bash
# Check workflow status
gh run list --workflow "Release Assets" --limit 1 \
	--json databaseId,displayTitle,status,conclusion,url,createdAt

# Verify release and assets
gh release view vX.Y.Z \
	--json tagName,name,isPrerelease,isDraft,url,publishedAt,assets

# Test asset URLs
curl -I https://github.com/winterer/time-dial/releases/download/vX.Y.Z/time-dial.js
curl -I https://github.com/winterer/time-dial/releases/download/vX.Y.Z/time-dial-themes.css
```

**Success criteria:**
- Workflow status: `completed` with conclusion: `success`
- Asset count: 2 files (`time-dial.js`, `time-dial-themes.css`)
- Asset URLs return HTTP `200` or `302`

## Troubleshooting

### Release Assets workflow fails

Common causes and fixes:

1. **Version mismatch:** Tag version doesn't match `package.json` version
   - Verify: `git show vX.Y.Z:package.json | grep '"version"'`
   - Fix: Delete tag, update `package.json`, commit, recreate release

2. **Build errors:** Local build fails
   - Test: `npm ci && npm run build`
   - Check: `dist/time-dial.js` and `dist/time-dial-themes.css` exist
   - Fix issues, commit, push, recreate release/tag

3. **Missing dist files:** Workflow runs but doesn't upload assets
   - Verify `dist/` exists after build
   - Check workflow logs for upload errors
   - Ensure `vite.config.js` output matches expected paths

### Release notes issues

- Template source: `.github/release-notes-template.md`
- Placeholder format: `vX.Y.Z` (all occurrences replaced)
- Installation methods:
  - **Primary:** jsDelivr CDN (`@latest` or pinned `@vX.Y.Z`)
  - **Optional:** Self-hosted release assets
  - **Avoid:** `npm install` instructions (unless published to npm)

### Recovery steps

If a release needs to be recreated:

```bash
# Delete existing release and tag
gh release delete vX.Y.Z --yes
git push origin :refs/tags/vX.Y.Z

# Fix issues, commit, push
git add .
git commit -m "fix: issue description"
git push origin main

# Recreate release (returns to Phase 3)
gh release create vX.Y.Z \
	--target main \
	--title "vX.Y.Z" \
	--notes "$(.github/skills/create-github-release/render-release-notes.sh vX.Y.Z)"
```