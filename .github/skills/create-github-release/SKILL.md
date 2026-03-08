---
name: create-github-release
description: Create and validate a GitHub release for time-dial using the repository's Release Assets workflow. Use when asked to cut a release, draft release notes, bump versions, or verify release assets/URLs. Keywords: release, tag, gh cli, changelog, version bump, GitHub Releases, workflow.
---

# Create GitHub Release (time-dial)

Use this skill when a user asks to create, prepare, or verify a release for this repository.

## Repository-specific rules

- Release tag format: `vX.Y.Z`
- `package.json` version format: `X.Y.Z` (no `v` prefix)
- Tag version **must** match `package.json` version (enforced by workflow)
- Release workflow: `.github/workflows/release-assets.yml`
- Canonical release notes template: `.github/release-notes-template.md`
- Uploaded assets come from `dist/`:
	- `time-dial.js`
	- `time-dial-themes.css`
- Do **not** claim npm install support in release notes unless explicitly published to npm.

## Required inputs and clarification behavior

- Required input: target release version/tag.
- If the user provides `X.Y.Z`, normalize internally to `vX.Y.Z` for tag operations.
- If the user provides `vX.Y.Z`, use it as-is.
- If no version is provided:
	1. Read `package.json` and extract the current version.
	2. Compute and present these choices:
		- next patch version (for example, `1.2.3` -> `1.2.4`)
		- next minor version (for example, `1.2.3` -> `1.3.0`)
		- next major version (for example, `1.2.3` -> `2.0.0`)
		- free-form custom version input
	3. Mark patch bump as the default suggested option.
	4. Ask for explicit user selection/confirmation before running any release command.
- Use this prompt style when missing: `Current package.json version is vX.Y.Z. Which target version should I use? Options: patch vX.Y.(Z+1), minor vX.(Y+1).0, major v(X+1).0.0, or a custom version.`
- Never run release mutation commands (`npm version`, `git commit`, `git push`, `gh release create`) until version is explicit/confirmed.

## Required process

1. Read `package.json` and confirm current version.
2. If needed, bump version with `npm version X.Y.Z --no-git-tag-version`.
3. Commit and push the version bump to `main`.
4. Render release notes from `.github/release-notes-template.md` by replacing `vX.Y.Z`.
5. Create GitHub release with tag `vX.Y.Z` (from `main`) using `--notes-file`.
6. Verify the `Release Assets` workflow run completed successfully.
7. Verify release assets are present and URLs resolve.

## Preferred CLI commands

```bash
# 1) Bump version (if requested)
npm version X.Y.Z --no-git-tag-version

# 2) Commit + push
git add package*.json
git commit -m "chore: release vX.Y.Z"
git push origin main

# 3) Render release notes from canonical template
TAG="vX.Y.Z"
sed "s/vX.Y.Z/${TAG}/g" .github/release-notes-template.md > "/tmp/time-dial-release-notes-${TAG}.md"

# 4) Create release
gh release create vX.Y.Z \
	--target main \
	--title "vX.Y.Z" \
	--notes-file "/tmp/time-dial-release-notes-${TAG}.md"
```

## Machine-readable verification

Use JSON output so assistants/tools can parse results.

```bash
# Workflow status
gh run list --workflow "Release Assets" --limit 1 \
	--json databaseId,displayTitle,status,conclusion,url,createdAt

# Release metadata
gh release view vX.Y.Z \
	--json tagName,name,isPrerelease,isDraft,url,publishedAt,assets
```

Optional compact summaries:

```bash
gh run list --workflow "Release Assets" --limit 1 --json databaseId,status,conclusion,url \
	--jq '.[0] | "run=\(.databaseId) status=\(.status) conclusion=\(.conclusion) url=\(.url)"'

gh release view vX.Y.Z --json tagName,isDraft,isPrerelease,publishedAt,url,assets \
	--jq '"tag=\(.tagName) draft=\(.isDraft) prerelease=\(.isPrerelease) publishedAt=\(.publishedAt) assets=\(.assets|length) url=\(.url)"'
```

## Release notes guidance for this repo

Installation guidance should be:

- Primary: jsDelivr (`@latest` and optionally pinned `@vX.Y.Z`)
- Optional: self-host downloaded release assets
- Avoid `npm install time-dial` in notes unless npm publishing is confirmed

Use `.github/release-notes-template.md` as the canonical source of release-note content.

## Failure handling

If the release workflow fails:

1. Check mismatch between `package.json` and tag version first.
2. Ensure tag starts with `v` and matches the version exactly.
3. Re-run local build (`npm ci && npm run build`) to reproduce.
4. Fix, push, and recreate release/tag only after verification.