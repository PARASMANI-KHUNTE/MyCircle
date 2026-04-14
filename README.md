# MyCircle

**Hyperlocal exchange platform** for neighbors to post and discover jobs, services, items for sale/rent.

Built with a simple idea: **make local collaboration as easy as a scroll**.

---

## Monorepo Structure

```
MyCircle/
├── MyCircleAppSuite/
│   ├── Server/       # Backend API (Node.js + Express)
│   ├── Web/         # Web Frontend (React + Vite)
│   └── Mobile/      # Mobile App (React Native CLI)
├── docs/            # Documentation
└── .gitignore
```

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| **Web Frontend** | React 19, Vite 7, Tailwind CSS 3, Framer Motion 11, Socket.io Client |
| **Mobile** | React Native 0.83, NativeWind, Reanimated 4, FlashList |
| **Backend** | Node.js 18+, Express 5, MongoDB/Mongoose, Socket.io |
| **AI** | Groq (LLM for moderation & suggestions) |
| **Auth** | JWT, Google OAuth (Passport) |
| **Storage** | Cloudinary (images), Firebase (push notifications) |
| **Caching** | Redis (ioredis) |
| **Queue** | BullMQ |

---

## Features

- **Marketplace Feed** — Jobs, Services, Sell, Rent with filters
- **Trust Score** — 0-100 reputation system with tiers (New/Member/Trusted/Verified)
- **Contact Requests** — Pre-approved messaging to reduce spam
- **Real-time Chat** — Socket.io with read receipts, typing indicators
- **Map View** — Interactive Leaflet maps for local discovery
- **AI Content Moderation** — Groq-powered safety checks
- **Push Notifications** — Firebase Cloud Messaging
- **Post Lifecycle** — Active, Paused, Fulfilled, Expired states

---

## Quick Start

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **Redis** (optional, for production rate limiting)

### Environment Variables

Copy `.env.example` to `.env` in `MyCircleAppSuite/Server/`:

```bash
# Required
JWT_SECRET=$(openssl rand -hex 32)
MONGO_URI=mongodb+srv://...
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Optional (AI features)
GROQ_API_KEY=xxx
```

### Install & Run

```bash
# Clone
git clone https://github.com/PARASMANI-KHUNTE/MyCircle.git
cd MyCircle

# Install dependencies
cd MyCircleAppSuite/Server && npm install
cd MyCircleAppSuite/Web && npm install
cd MyCircleAppSuite/Mobile && npm install

# Run development
# Terminal 1: Server
cd MyCircleAppSuite/Server && npm run dev

# Terminal 2: Web
cd MyCircleAppSuite/Web && npm run dev
```

### Mobile Development

```bash
cd MyCircleAppSuite/Mobile

# Start Metro bundler
npm start

# Run on Android
npm run android
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Auth** |
| POST | `/auth/register` | Email registration |
| POST | `/auth/login` | Email login |
| GET | `/auth/google` | Google OAuth init |
| GET | `/auth/google/callback` | Google OAuth callback |
| **Posts** |
| GET | `/api/posts` | Get all posts (feed) |
| POST | `/api/posts` | Create post (auth required) |
| GET | `/api/posts/:id` | Get post by ID |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like post |
| POST | `/api/posts/:id/share` | Share tracking |
| **User** |
| GET | `/api/user/profile` | Get own profile |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/:userId` | Get other user profile |
| POST | `/api/user/block/:userId` | Block user |
| **Contacts** |
| POST | `/api/contacts/request` | Send contact request |
| GET | `/api/contacts/received` | Received requests |
| GET | `/api/contacts/sent` | Sent requests |
| PUT | `/api/contacts/:id/status` | Accept/Reject |
| **Chat** |
| GET | `/api/chat/conversations` | All conversations |
| GET | `/api/chat/messages/:id` | Get messages |
| POST | `/api/chat/message` | Send message |
| **AI** |
| POST | `/api/ai/moderate` | Content safety check |
| POST | `/api/ai/analyze-post` | Post insights |
| POST | `/api/ai/explain-post` | AI summary |
| **Health** |
| GET | `/` | Health check |
| GET | `/live` | Liveness probe |
| GET | `/ready` | Readiness probe |

---

## Security

- JWT tokens with 32+ character secrets
- Rate limiting (production)
- Helmet security headers
- Socket.io authentication
- Input validation with Zod
- NoSQL injection prevention (manual sanitization)

---

## Design

Dark-first, glassmorphism UI with vibrant accents—built for fast, modern scrolling.

---

## License

ISC