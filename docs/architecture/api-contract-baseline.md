# API Contract Baseline

Status: Phase 0 characterization  
Branch: `microservice-migration`  
Last updated: 2026-11-05

The current web and mobile clients use the monolith's routes below. These mounts are compatibility boundaries during migration; extracted services must preserve them through gateway routes or adapters until clients are deliberately versioned.

| Client-facing mount | Current module | Planned owner | Migration rule |
| --- | --- | --- | --- |
| `/auth` | `authRoutes` | Identity | Preserve token and login response shapes |
| `/api/user` | `userRoutes` | Identity | Preserve user/profile identifiers and auth behavior |
| `/api/posts` | `postRoutes` | Marketplace | Preserve pagination, post IDs, and media references |
| `/api/contacts` | `contactRoutes` | Contact | Preserve approval/status transitions and privacy rules |
| `/api/chat` | `chatRoutes` | Communication | Preserve conversation/message IDs and access checks |
| `/api/notifications` | `notificationRoutes` | Notifications | Preserve notification IDs, read state, and ordering |
| `/api/ai` | `aiRoutes` | Safety | Preserve authenticated failure behavior and moderation decisions |
| `/`, `/health` | bootstrap/health routes | Platform edge | Keep liveness and readiness stable for deployment tooling |

## Stable cross-service response requirements

Every request must:

- Return or propagate an `x-request-id` response header.
- Include `requestId` in structured error responses.
- Use the existing `{ success, msg, error, requestId }` error fields for API failures.
- Preserve HTTP status codes when traffic is moved behind an adapter.
- Propagate correlation context to downstream calls and emitted events.

## Characterization coverage

The backend tests currently cover:

- Request ID acceptance, replacement of unsafe IDs, propagation, and completion logging.
- Stable error response fields and request-scoped error logging.
- Existing validation error behavior and asynchronous error forwarding.

This is a baseline, not a complete OpenAPI specification. Detailed request and response schemas should be added for the first extraction target after the route usage inventory is completed.
