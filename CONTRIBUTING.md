# Contributing to MyCircle

Thanks for your interest in improving MyCircle. This guide covers the local workflow and the checks we expect before a pull request is merged.

## Getting started

1. Use Node.js 20 (`nvm use` reads `.nvmrc`).
2. Install dependencies for every app:

   ```bash
   npm run install:all
   ```

3. Create a local environment file for each app from its `.env.example`.
4. Start the backend stack with `npm run docker:up` (MongoDB + Redis + API + worker).

## Branching

- Branch from `main`.
- Use a descriptive prefix: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
- Keep pull requests focused on a single concern.

## Commit messages

Follow Conventional Commits where practical, for example:

```text
feat(web): add distance filter to explore map
fix(server): expire stale contact requests
docs: consolidate architecture documentation
```

## Local checks

Run the checks that match the code you changed:

```bash
npm run lint        # web + mobile lint
npm test            # server tests
npm run test:mobile # mobile smoke test (requires native mocks)
npm run build       # web build + Android release
```

Individual apps:

```bash
npm --prefix MyCircleAppSuite/Web run lint
npm --prefix MyCircleAppSuite/Web run build
npm --prefix MyCircleAppSuite/Server test
npm run typecheck:mobile
```

## Pull requests

- Fill in the pull request template.
- Describe the problem, the solution and any follow-up work.
- Link related issues.
- Confirm CI is green before requesting review.
- Do not commit secrets, `.env` files or generated artifacts (`dist/`, build logs, APKs).

## Code style

- JavaScript/TypeScript: ESLint configs live in each app.
- Server: CommonJS modules, async handlers wrapped with `asyncHandler`.
- Formatting is enforced by `.editorconfig`; avoid unrelated reformatting.

## Documentation

- Architecture and guides live in `docs/`.
- Update `docs/README.md` when adding or moving documents.
- Report-generation tooling lives in `tools/reporting/`.
