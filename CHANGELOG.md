# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Root orchestration scripts for installing, running, testing and building the apps.
- CI workflow for Server tests, Web lint/build and Mobile lint/typecheck.
- Issue templates, pull request template, Dependabot configuration and security policy.
- Consolidated documentation under `docs/` and report tooling under `tools/reporting/`.

### Changed

- Moved report-generation scripts and their dependencies out of the repository root.
- Rewrote the root README with accurate setup instructions and repository layout.
- Cleaned stale CodeRabbit path filters.
- Fixed all Mobile ESLint errors and enabled mobile lint in the root lint script.
- Stopped tracking compiled `*.apk`/`*.aab` bundles and removed the 79 MB APK from the index. The file remains in earlier Git history; purge it with `git filter-repo`/BFG before publishing if repository size matters.

### Removed

- Temporary report artifacts and duplicate report exports.
- Tracked `models.zip` archive.

## [0.1.0]

- Initial MyCircle platform with Server, Web and Mobile applications.
