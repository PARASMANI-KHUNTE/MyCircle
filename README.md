# MyCircle

MyCircle is a hyperlocal exchange platform with separate backend, web, and mobile applications in one repository.

## Project structure

```text
MyCircle/
├── MyCircleAppSuite/
│   ├── Server/   # Node.js + Express API
│   ├── Web/      # React + Vite web client
│   └── Mobile/   # React Native mobile app
├── docs/
│   └── reports/  # Project reports and supporting report docs
└── .gitignore
```

## Prerequisites

- Node.js 20+ (mobile requires Node >=20)
- npm
- MongoDB (for server)
- Optional: Redis (rate limiting/queue behavior in production-like setups)

## Environment setup

- Server: copy `/home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Server/.env.example` to `.env`
- Web: copy `/home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Web/.env.example` to `.env` if needed
- Mobile: copy `/home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Mobile/.env.example` to `.env` if needed

## Install dependencies

```bash
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Server && npm install
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Web && npm install
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Mobile && npm install
```

## Development

```bash
# API server
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Server && npm run dev

# Web app
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Web && npm run dev

# Mobile metro server
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Mobile && npm start
```

## Testing

```bash
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Server && npm test
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Mobile && npm test
```

## Linting

```bash
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Web && npm run lint
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Mobile && npm run lint
```

## Build

```bash
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Web && npm run build
cd /home/runner/work/MyCircle/MyCircle/MyCircleAppSuite/Mobile && npm run build:android:debug
```

## Notes

- Repository cleanup keeps runtime code paths unchanged and removes local/generated artifacts from version control.
- Additional app-specific details are in each app's local README file.
