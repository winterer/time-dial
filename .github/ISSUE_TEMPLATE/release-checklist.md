---
name: 🚀 Release checklist
about: Track a safe and consistent release of time-dial artifacts
title: "Release vX.Y.Z"
labels: ["release"]
assignees: []
---

## Release Summary

- Target version (`package.json`): `X.Y.Z`
- Release tag: `vX.Y.Z`
- Release type: <!-- stable | prerelease -->

## Pre-release Checks

- [ ] `package.json` version is updated to `X.Y.Z` (no `v` prefix)
- [ ] All release-related changes are merged to `main`
- [ ] Local build succeeds (`npm run build`)

## Create Release

- [ ] Create GitHub Release from tag `vX.Y.Z`
- [ ] Mark as **non-prerelease** if release is stable, otherwise mark as **prerelease**

## CI Validation (Release Assets workflow)

- [ ] Workflow run succeeds
- [ ] `time-dial.js` uploaded as release asset
- [ ] `time-dial-themes.css` uploaded as release asset

## Post-release Verification

- [ ] Version-pinned JS link works:
      `https://github.com/winterer/time-dial/releases/download/vX.Y.Z/time-dial.js`
- [ ] Version-pinned CSS link works:
      `https://github.com/winterer/time-dial/releases/download/vX.Y.Z/time-dial-themes.css`
- [ ] `latest` links work (stable releases only):
      `https://github.com/winterer/time-dial/releases/latest/download/time-dial.js`
      `https://github.com/winterer/time-dial/releases/latest/download/time-dial-themes.css`

## Optional Follow-ups

- [ ] Update release notes with install snippets
- [ ] Close related release issue(s)
