# MyCircle

[![CI](https://github.com/PARASMANI-KHUNTE/MyCircle/actions/workflows/ci.yml/badge.svg)](https://github.com/PARASMANI-KHUNTE/MyCircle/actions/workflows/ci.yml)

MyCircle is a hyperlocal exchange platform for jobs, services, sales, rentals, and barter. It features a modern microservice-ready architecture powered by a Strangler Fig API Gateway, distributed services, a React web client, and a React Native bare mobile app.

---

## Architecture Overview

```
                         [ React Web / Mobile Apps ]
                                      │
                                      ▼
             [ API Gateway / Facade (Port 5000) - Express Strangler ]
               ├── Health Probes: /health/live, /health/ready, /health/services
               ├── Distributed Tracing: x-request-id correlation injection
               └── Dynamic Strangler Proxy to Extracted Microservices
                                      │
    ┌──────────────┬──────────────────┼─────────────────┬──────────────┐
    ▼              ▼                  ▼                 ▼              ▼
[ Identity ]  [ Marketplace ]  [ Communication ]   [ Contact ]  [ Notifications ]
  Port: 5001    Port: 5002        Port: 5003          Port: 5004   Port: 5005
  DB: identity  DB: marketplace   DB: communication   DB: contact  DB: notifications
```

---

## Repository Layout

```text
MyCircle/
├── MyCircleAppSuite/
│   ├── Server/            # API Gateway & Monolith compatibility layer
│   ├── Services/          # Extracted Domain Microservices
│   │   ├── Identity/      # Auth, Google OAuth & User Profiles (Port 5001)
│   │   ├── Marketplace/   # Posts, Geospatial Search & Categories (Port 5002)
│   │   ├── Communication/ # Standalone Socket.io Chat & Messaging (Port 5003)
│   │   ├── Contact/       # Contact Requests & Privacy Gate (Port 5004)
│   │   └── Notifications/ # In-App Activity & Notifications (Port 5005)
│   ├── Web/               # React 19 + Vite web client
│   └── Mobile/            # React Native (bare) + TypeScript mobile app
├── docs/                  # Architecture, system design & migration plans
├── docker-compose.microservices.yml # Full microservices orchestration
└── package.json           # Root orchestration scripts
```

---

## Microservices Fleet

Each microservice runs independently with its own database, health checks, and test suite:

- [**Identity Service**](MyCircleAppSuite/Services/Identity/README.md) (`Port 5001`): User registration, passwords, Google OAuth, JWT claims.
- [**Marketplace Service**](MyCircleAppSuite/Services/Marketplace/README.md) (`Port 5002`): Post lifecycle, 2dsphere location queries, category filters.
- [**Communication Service**](MyCircleAppSuite/Services/Communication/README.md) (`Port 5003`): Socket.io real-time chat, conversations, and message history.
- [**Contact Service**](MyCircleAppSuite/Services/Contact/README.md) (`Port 5004`): Mutual consent contact requests and trust verification.
- [**Notification Service**](MyCircleAppSuite/Services/Notifications/README.md) (`Port 5005`): Real-time user notification feed and unread status.

---

## High-Performance Algorithms & Data Structures (DSA)

Integrated under `MyCircleAppSuite/Server/src/utils/dsa`:
* **`FastKeywordTrie` (Prefix Tree):** Linear $O(N)$ profanity and content moderation.
* **`calculateHaversineDistance`:** Exact $O(1)$ spherical geodesic distance between GPS coordinates.
* **`MinHeap` / `getTopK`:** Optimal $O(N \log K)$ Top-K search and ranking.
* **`LRUCache`:** Fixed-memory $O(1)$ Doubly Linked List + HashMap cache.

---

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm 10+
- MongoDB 7+ (local or Docker)
- Redis 7+

---

## Quick Start

### 1. Monolith / Local Gateway Mode
```bash
# Install dependencies for all apps and microservices
npm run install:all

# Configure environment files
cp MyCircleAppSuite/Server/.env.example MyCircleAppSuite/Server/.env
cp MyCircleAppSuite/Web/.env.example   MyCircleAppSuite/Web/.env
cp MyCircleAppSuite/Mobile/.env.example MyCircleAppSuite/Mobile/.env

# Start web client
npm run dev:web
```

### 2. Full Microservices Fleet (Docker Compose)
To boot all 5 microservices, databases, Redis, and the API Gateway in one command:
```bash
docker compose -f docker-compose.microservices.yml up --build
```

---

## Root Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev:server` | Start the API Gateway in watch mode |
| `npm run dev:web` | Start the Vite React web client |
| `npm run start:mobile` | Start the React Native Metro bundler |
| `npm run build:web` | Build the web production bundle |
| `npm run lint` | Lint web and mobile codebases |
| `npm run typecheck:mobile` | Typecheck mobile app (`tsc --noEmit`) |
| `npm test` | Run the full Server & DSA test suite |
| `npm run test:mobile` | Run mobile Jest test suite with native mocks |
