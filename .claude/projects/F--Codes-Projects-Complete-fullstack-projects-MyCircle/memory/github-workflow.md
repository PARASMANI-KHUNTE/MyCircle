---
name: github-workflow
description: Standard GitHub workflow for issue-driven development
metadata:
  type: project
---

Standard GitHub workflow for this project:

1. **Create GitHub issue** — Define the task/bug with clear description
2. **Create new branch** — `git checkout -b <branch-name>` (e.g., `fix/issue-123`, `feat/new-feature`)
3. **Fix the issue** — Make changes, commit with conventional commits (`fix:`, `feat:`, `chore:`)
4. **Create PR to main** — Push branch, open PR referencing the issue (`Closes #123`)
5. **Merge** — After review/CI passes, merge to main (squash or merge commit)

**Branch naming convention:**
- `fix/<short-description>` — Bug fixes
- `feat/<short-description>` — New features
- `chore/<short-description>` — Maintenance/refactoring
- `docs/<short-description>` — Documentation updates

**Commit message format:**
- `fix: brief description` — Bug fix
- `feat: brief description` — New feature
- `chore: brief description` — Maintenance
- `docs: brief description` — Documentation

**Why:** Keeps history clean, links issues to changes, enables easy rollback
**How to apply:** Follow this sequence for all non-trivial changes; skip for quick typo fixes