# MyCircle

[![CI](https://github.com/PARASMANI-KHUNTE/MyCircle/actions/workflows/ci.yml/badge.svg)](https://github.com/PARASMANI-KHUNTE/MyCircle/actions/workflows/ci.yml)

MyCircle is a hyperlocal exchange platform for jobs, services, sales, rentals and barter. It ships as a single repository containing a REST/realtime API, a React web client and a React Native mobile app.

## Repository layout

```text
MyCircle/
├── MyCircleAppSuite/
│   ├── Server/        # Node.js + Express API (MongoDB, Redis, Socket.io)
│   ├── Web/           # React + Vite + Tailwind web client
│   └── Mobile/        # React Native (bare) + TypeScript mobile app
├── docs/
│   ├── architecture/  # System design, database design, workflows
│   ├── guides/        # Feature, testing and operations documentation
│   ├── analysis/      # Codebase analysis
│   └── reports/       # Project reports and exports
├── tools/
│   └── reporting/     # Python report-generation tooling
├── .github/           # CI, issue/PR templates, Dependabot
└── package.json       # Root orchestration scripts
```

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm 10+
- MongoDB 7 (local or Docker)
- Redis 7 (optional locally, required for queues/rate limiting in production)

## Quick start

```bash
# install dependencies for every app
npm run install:all

# configure environment variables
cp MyCircleAppSuite/Server/.env.example MyCircleAppSuite/Server/.env
cp MyCircleAppSuite/Web/.env.example   MyCircleAppSuite/Web/.env
cp MyCircleAppSuite/Mobile/.env.example MyCircleAppSuite/Mobile/.env

# start the full backend stack (MongoDB + Redis + API + worker)
npm run docker:up

# start the web client
npm run dev:web
```

Refer to the per-app README files for platform-specific setup:

- [`MyCircleAppSuite/Server`](MyCircleAppSuite/Server)
- [`MyCircleAppSuite/Web`](MyCircleAppSuite/Web)
- [`MyCircleAppSuite/Mobile`](MyCircleAppSuite/Mobile)

## Root scripts

| Script | Description |
| --- | --- |
| `npm run install:all` | Install dependencies for Server, Web and Mobile |
| `npm run dev:server` | Start the API in watch mode |
| `npm run dev:web` | Start the Vite dev server |
| `npm run start:mobile` | Start the React Native Metro bundler |
| `npm run build` | Build the web client (`build:web`) |
| `npm run build:android` | Build the Android release APK locally (not committed) |
| `npm run lint` | Lint the web and mobile clients |
| `npm run lint:mobile` | Lint the mobile app only |
| `npm run typecheck:mobile` | Type-check the mobile app |
| `npm test` | Run the server test suite |
| `npm run test:mobile` | Run the mobile smoke test (requires native mocks) |
| `npm run docker:up` | Start the server stack with Docker Compose |
| `npm run docker:down` | Stop the server stack |

## Documentation

Start at [`docs/README.md`](docs/README.md).

## Container images

The API and worker images are defined by `MyCircleAppSuite/Server/Dockerfile` and orchestrated by `MyCircleAppSuite/Server/docker-compose.yml`.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). For security issues, follow [`SECURITY.md`](SECURITY.md).
