# Microservice Boundary Inventory

Status: Phase 0 baseline  
Branch: `microservice-migration`  
Last updated: 2026-11-05

This inventory records the current HTTP entry points and the proposed ownership boundary before any traffic is moved. It is intentionally a logical map of the modular monolith, not a claim that these are already deployable services.

## HTTP route map

| Current mount | Route module | Primary responsibility | Proposed owner |
| --- | --- | --- | --- |
| `/auth` | `src/routes/authRoutes.js` | Login, registration, OAuth, sessions | Identity |
| `/api/posts` | `src/routes/postRoutes.js` | Post CRUD, discovery, lifecycle | Marketplace |
| `/api/contacts` | `src/routes/contactRoutes.js` | Contact requests and approvals | Contact |
| `/api/user` | `src/routes/userRoutes.js` | Profiles, social graph, user settings | Identity |
| `/api/chat` | `src/routes/chatRoutes.js` | Conversations, messages, realtime access | Communication |
| `/api/notifications` | `src/routes/notificationRoutes.js` | Notification retrieval and read state | Notifications |
| `/api/ai` | `src/routes/aiRoutes.js` | AI-assisted analysis and content decisions | Safety |
| `/` | `src/routes/healthRoutes.js` and bootstrap routes | Health, redirects, process liveness | Platform/API edge |

## Current persistence map

| Model | Current role | Proposed owner |
| --- | --- | --- |
| `User` | Identity, profile, social graph, reputation | Identity |
| `Post` | Marketplace listing and engagement | Marketplace |
| `ContactRequest` | Approval workflow and contact-sharing state | Contact |
| `Conversation` | Conversation lifecycle and participants | Communication |
| `Message` | Message content and delivery state | Communication |
| `Notification` | User notification state | Notifications |

Safety currently cuts across user-generated content, reports, moderation utilities, AI routes, and trust scoring. It should first be isolated as a policy/module boundary before it receives an independent database.

## Cross-cutting dependencies

| Dependency | Current use | Migration constraint |
| --- | --- | --- |
| MongoDB/Mongoose | All domain models | No cross-service collection reads after extraction |
| Redis/Ioredis | Cache, rate limiting, BullMQ | Assign queues and keys to an owning service |
| Socket.io | Realtime chat and presence | Communication owns connection authorization and events |
| Cloudinary | User and post media | Marketplace/Identity store references, not provider state |
| Google/Firebase | Authentication and identity integrations | Identity owns provider credentials |
| Groq/AI utilities | Safety/content analysis | Safety owns provider adapter and policy |

## First extraction recommendation

Start with **Identity** only after Phase 0 contract tests cover authentication and protected-route behavior. Marketplace has the clearest business boundary, but Identity establishes the token and service-authentication contract required by every later extraction. Until then, keep all current routes behind the monolith API and use the request context middleware for trace continuity.
