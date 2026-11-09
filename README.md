# MyCircle Backend Architecture, Microservices & API Documentation

[![CI](https://github.com/PARASMANI-KHUNTE/MyCircle/actions/workflows/ci.yml/badge.svg)](https://github.com/PARASMANI-KHUNTE/MyCircle/actions/workflows/ci.yml)

MyCircle is a hyperlocal community exchange platform for items, services, events, rentals, and barter. The backend features a modern **Strangler Fig Microservices Architecture** fronted by an API Gateway façade, distributed domain services, a high-performance Data Structures & Algorithms (DSA) optimization suite, and end-to-end distributed tracing.

---

## 1. System Architecture

```
                             [ Clients: Web & Mobile ]
                                         │
                                         ▼
            [ API Gateway / Strangler Façade (Port 5000) - Express ]
             ├── Health Probes: /health/live, /health/ready, /health/services
             ├── Distributed Tracing: Injects and propagates x-request-id
             └── Dynamic Proxying to Extracted Microservices
                                         │
 ┌─────────────┬─────────────┬───────────┼───────────┬─────────────┬─────────────┐
 ▼             ▼             ▼           ▼           ▼             ▼             ▼
[Identity] [Marketplace]  [Comm]     [Contact]  [Notifications] [Payment]     [DSA Suite]
Port: 5001  Port: 5002   Port: 5003  Port: 5004  Port: 5005     Port: 5006    O(1)/O(N)
```

### Key Architectural Characteristics
- **Strangler Fig Gateway (`Port 5000`):** Proxies traffic to dedicated microservices via environment configuration (`IDENTITY_SERVICE_URL`, `MARKETPLACE_SERVICE_URL`, etc.) with automatic fallback to monolith routes.
- **Independent Persistence:** Every microservice has its own isolated MongoDB database instance.
- **Distributed Request Correlation:** Every request carries an `x-request-id` header across all internal service boundaries.
- **Centralized Security Layer (`Services/Common`):** Production secret enforcement, rate-limiting safeguards, bounded pagination, and sanitized structured error handling.

---

## 2. Microservice Fleet & Complete API Reference

### 🛡️ 1. Identity Service (`Port 5001` | DB: `mycircle_identity`)
*Path: `MyCircleAppSuite/Services/Identity`*  
Owns user registration, credential verification, Google OAuth delegation, JWT claims issuance, and user profile management.

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Liveness probe returning service status |
| `GET` | `/health/ready` | Public | Readiness probe confirming operational state |
| `POST`| `/auth/register` | Public | Register new account (`displayName`, `email`, `password`) |
| `POST`| `/auth/login` | Public | Authenticate user with email and password |
| `POST`| `/auth/refresh` | Public | Refresh access token using rotating refresh token |
| `POST`| `/auth/logout` | Bearer | Revoke current refresh token |
| `POST`| `/auth/logout-all` | Bearer | Revoke all refresh tokens for user |
| `GET` | `/api/user/profile` | Bearer | Fetch authenticated user's private profile |
| `PUT` | `/api/user/profile` | Bearer | Update profile details (`displayName`, `bio`, `phone`, `skills`) |
| `GET` | `/api/user/:id` | Public | Fetch sanitized public profile with reputation score |

---

### 🛒 2. Marketplace Service (`Port 5002` | DB: `mycircle_marketplace`)
*Path: `MyCircleAppSuite/Services/Marketplace`*  
Owns post listings, category taxonomy, and real-time geospatial discovery.

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Liveness probe returning service status |
| `GET` | `/health/ready` | Public | Readiness probe confirming operational state |
| `GET` | `/api/posts` | Public | Search and discover listings with geospatial proximity filters (`longitude`, `latitude`, `radius`), category, type, and keyword search |
| `GET` | `/api/posts/:id` | Public | Retrieve detailed post metadata and author snapshot |
| `POST`| `/api/posts` | Bearer | Create a new listing (`type`, `title`, `description`, `price`, `location`, `coordinates`, `images`) |

---

### 💬 3. Communication Service (`Port 5003` | DB: `mycircle_communication`)
*Path: `MyCircleAppSuite/Services/Communication`*  
Powers real-time messaging, conversation channels, and standalone Socket.io event broadcasting.

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Liveness probe returning service status |
| `GET` | `/health/ready` | Public | Readiness probe confirming operational state |
| `GET` | `/api/chat/conversations` | Bearer | List recent conversations for the authenticated user |
| `GET` | `/api/chat/messages/:id` | Bearer | Retrieve paginated message history for a conversation |
| `POST`| `/api/chat/messages` | Bearer | Send a text message and broadcast real-time `message:received` socket event |

---

### 🤝 4. Contact Service (`Port 5004` | DB: `mycircle_contact`)
*Path: `MyCircleAppSuite/Services/Contact`*  
Manages contact requests, trust verification, and privacy-preserving mutual consent gates.

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Liveness probe returning service status |
| `GET` | `/health/ready` | Public | Readiness probe confirming operational state |
| `POST`| `/api/contacts/request` | Bearer | Submit a contact request for a marketplace post |
| `GET` | `/api/contacts/requests` | Bearer | List user's contact requests (`?type=incoming`, `outgoing`, or `all`) |
| `PUT` | `/api/contacts/requests/:id/respond` | Bearer | Accept or reject a pending contact request |

---

### 🔔 5. Notification Service (`Port 5005` | DB: `mycircle_notifications`)
*Path: `MyCircleAppSuite/Services/Notifications`*  
Delivers in-app activity feeds, real-time unread counts, and delivery status tracking.

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Liveness probe returning service status |
| `GET` | `/health/ready` | Public | Readiness probe confirming operational state |
| `GET` | `/api/notifications` | Bearer | Fetch paginated notification feed and unread badge count |
| `PUT` | `/api/notifications/:id/read` | Bearer | Mark a single notification as read |
| `PUT` | `/api/notifications/read-all` | Bearer | Mark all notifications for the current user as read |

---

### 💳 6. Payment & Escrow Service (`Port 5006` | DB: `mycircle_payment`)
*Path: `MyCircleAppSuite/Services/Payment`*  
Provides end-to-end buyer escrow protection, wallet management, payment intents, Stripe Connect for seller payouts, and platform take-rate (commission).

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Liveness probe returning service status |
| `GET` | `/health/ready` | Public | Readiness probe confirming operational state |
| `GET` | `/api/payments/wallet` | Bearer | Get user wallet (balance, pending balance, currency, Stripe account ID) |
| `POST`| `/api/payments/wallet/topup` | Bearer | Create Stripe PaymentIntent for wallet top-up (₹10-₹50,000) |
| `POST`| `/api/payments/wallet/topup/confirm` | Bearer | Confirm top-up and credit wallet balance |
| `POST`| `/api/payments/stripe/connect` | Bearer | Create/return Stripe Connect Express onboarding link for sellers |
| `GET` | `/api/payments/stripe/connect/status` | Bearer | Check Stripe Connect account status (payouts enabled, details submitted) |
| `POST`| `/api/payments/escrow/create` | Bearer | Create escrow for post purchase (reserves buyer funds, returns clientSecret) |
| `POST`| `/api/payments/create-intent` | Bearer | Alias for `/escrow/create` (web client compatibility) |
| `POST`| `/api/payments/escrow/:escrowId/confirm` | Bearer | Confirm payment (buyer) — moves escrow to `held` state |
| `POST`| `/api/payments/escrow/:escrowId/release` | Bearer | Release escrow to seller — transfers to seller wallet + Stripe payout |
| `POST`| `/api/payments/escrow/:escrowId/refund` | Bearer | Refund escrow to buyer (buyer if pending/funded, admin any state) |
| `GET` | `/api/payments/escrow/history` | Bearer | List user's escrow history (`?role=buyer|seller|both`) |
| `GET` | `/api/payments/escrow/:escrowId` | Bearer | Get single escrow details (buyer/seller/admin only) |

---

## 3. Mobile Application (`MyCircleAppSuite/Mobile`)

React Native (bare workflow) with Expo modules, TypeScript, and modern architecture.

### Key Features Implemented
- **Dual-Token Authentication** — Short-lived JWT access tokens (15min) + rotating refresh tokens (30 days) stored in `react-native-keychain` (hardware-backed Keystore/Keychain)
- **Automatic Token Refresh** — Axios interceptors with request queuing during refresh (no race conditions)
- **Socket.io Real-time** — Authenticated WebSocket with auto-reconnect, typing indicators, presence
- **Push Notifications** — FCM via `@react-native-firebase/messaging` + `notifee` for native display, deep linking from quit/background/foreground states
- **Escrow Checkout Flow** — Integrated with Payment Service API (create escrow → confirm → approve contact)
- **Wallet Management** — Balance display, top-up via Stripe, Stripe Connect onboarding for sellers
- **Type-Safe Navigation** — React Navigation v6 with typed route params

### Mobile Tech Stack
| Category | Technology |
| :--- | :--- |
| Framework | React Native 0.76+ (bare), TypeScript |
| Navigation | React Navigation v6 (Stack + Tab) |
| State | React Context + TanStack Query |
| Auth Storage | `react-native-keychain` |
| HTTP Client | Axios (auto-refresh interceptors) |
| Real-time | Socket.io Client |
| Push | `@react-native-firebase/messaging`, `notifee` |
| Animations | Reanimated 3, React Native Gesture Handler |
| UI Icons | Lucide React Native |
| Testing | Jest + React Native Testing Library |

### Mobile Scripts
```bash
# TypeScript check
npm run typecheck

# Run tests
npm test

# Lint
npm run lint

# Start Metro
npm start

# Android
npm run android
npm run android:win

# iOS
npm run ios

# Build
npm run build:android:release
npm run build:android:debug
```

---

## 4. High-Performance Algorithms & Data Structures (DSA)

Located in `MyCircleAppSuite/Server/src/utils/dsa`:

1. **`FastKeywordTrie` (Prefix Tree):**
   - **Complexity:** $O(N)$ linear time where $N$ is text character length.
   - **Purpose:** Multi-pattern profanity and content moderation without repetitive regex scans.
2. **`calculateHaversineDistance`:**
   - **Complexity:** $O(1)$ constant time.
   - **Purpose:** Precise spherical geodesic distance math between GPS coordinates `[lon, lat]` in meters.
3. **`MinHeap` & `getTopK`:**
   - **Complexity:** $O(N \log K)$ time and $O(K)$ space.
   - **Purpose:** Optimal Top-$K$ ranking for trending items, search relevance, and leaderboards.
4. **`LRUCache`:**
   - **Complexity:** Strict $O(1)$ for both `get` and `put`.
   - **Purpose:** Memory-bounded Doubly Linked List + HashMap cache preventing RAM leaks.

---

## 5. Multi-Container Orchestration (`docker-compose.microservices.yml`)

Start the complete distributed backend fleet (6 microservices, 6 MongoDB instances, Redis, and the API Gateway) with one command:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

### Service Port Map

| Component | Port | Internal Docker Network Host |
| :--- | :---: | :--- |
| **API Gateway** | `5000` | `api-gateway` |
| **Identity Service** | `5001` | `identity-service:5001` |
| **Marketplace Service** | `5002` | `marketplace-service:5002` |
| **Communication Service**| `5003` | `communication-service:5003` |
| **Contact Service** | `5004` | `contact-service:5004` |
| **Notification Service** | `5005` | `notifications-service:5005` |
| **Payment Service** | `5006` | `payment-service:5006` |
| **Redis** | `6379` | `mycircle-redis:6379` |

---

## 6. Verification & Testing

Every microservice and the central gateway include automated test suites:

```bash
# Run Server & DSA test suite (40 tests across 12 suites)
npm test

# Run all microservice test suites individually
npm --prefix MyCircleAppSuite/Services/Identity test
npm --prefix MyCircleAppSuite/Services/Marketplace test
npm --prefix MyCircleAppSuite/Services/Communication test
npm --prefix MyCircleAppSuite/Services/Contact test
npm --prefix MyCircleAppSuite/Services/Notifications test
npm --prefix MyCircleAppSuite/Services/Payment test

# Mobile
cd MyCircleAppSuite/Mobile
npm run typecheck
npm test
npm run lint

# Web
npm run build:web
```

---

## 7. Authentication Flow (Dual-Token)

```
┌─────────────┐     POST /auth/login     ┌──────────────────┐
│   Client    │ ──────────────────────► │  Identity Service │
└─────────────┘                          └────────┬─────────┘
                                                   │
                          { accessToken, refreshToken }
                          (access: 15min, refresh: 30 days)
                                                   ▼
┌─────────────┐     x-auth-token header    ┌──────────────────┐
│   Client    │ ◄───────────────────────── │  API Gateway     │
└─────────────┘  (auto-refreshed on 401)   └──────────────────┘
```

- **Access Token**: 15 min expiry, HS256, contains `{ id, email, role, iat, exp }`
- **Refresh Token**: 30 days, rotated on each use, stored hashed (scrypt) in DB
- **Security**: Refresh token rotation prevents replay; DB compromise leaks only hashes

---

## 8. Project Structure

```
MyCircle/
├── MyCircleAppSuite/
│   ├── Server/                    # Monolith / API Gateway (Port 5000)
│   │   ├── src/
│   │   │   ├── config/            # DB, Firebase, Passport, Service Contracts
│   │   │   ├── controllers/       # Route handlers (auth, post, chat, payment, etc.)
│   │   │   ├── middleware/        # Auth, serviceRouter, errorHandler, rateLimit
│   │   │   ├── models/            # Mongoose models (User, Post, Wallet, EscrowTransaction)
│   │   │   ├── routes/            # Express routers
│   │   │   ├── services/          # Business logic (tokenService, platform services)
│   │   │   └── utils/             # DSA, asyncHandler, ApiError, validation
│   │   └── __tests__/             # 40 tests across 12 suites
│   ├── Mobile/                    # React Native App
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI (CheckoutModal, GlassView, etc.)
│   │   │   ├── context/           # AuthContext, SocketContext, NotificationContext
│   │   │   ├── navigation/        # Typed React Navigation
│   │   │   ├── screens/           # All app screens
│   │   │   ├── services/          # api.ts, chat.ts, notificationService.ts, aiService.ts
│   │   │   ├── utils/             # Helpers, formatters
│   │   │   └── theme/             # Design tokens, colors
│   │   └── __tests__/             # Jest tests
│   ├── Web/                       # React Web App (Vite)
│   └── Services/                  # Extracted Microservices (Identity, Marketplace, etc.)
│       ├── Identity/
│       ├── Marketplace/
│       ├── Communication/
│       ├── Contact/
│       ├── Notifications/
│       └── Payment/
├── docker-compose.microservices.yml
└── README.md
```