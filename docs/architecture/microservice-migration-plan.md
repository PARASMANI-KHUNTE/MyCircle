# Microservice Migration Plan

Status: Proposed  
Branch: `microservice-migration`  
Baseline: `main`  
Last updated: 2026-11-05

## 1. Goal

Evolve MyCircle from its current modular monolith into independently deployable services without interrupting the web or mobile clients, duplicating business rules, or creating uncontrolled distributed data access.

The migration will use a **strangler pattern**: preserve the existing API as the compatibility boundary, extract one capability at a time, and move traffic only after the new capability meets its functional, operational, and rollback gates.

## 2. Current baseline

- One Node.js + Express backend in `MyCircleAppSuite/Server`.
- MongoDB is the primary store; Redis is used for queues, caching, and rate limiting.
- Socket.io, BullMQ, Cloudinary, Google authentication, Firebase, and AI integrations are already present.
- Web and mobile clients consume the backend and should not need a simultaneous rewrite.
- The backend already has useful module boundaries: auth, users, posts, contacts, chat, notifications, and AI/safety.

## 3. Target architecture

### Edge and platform

- API gateway or routing layer for authentication, rate limiting, request IDs, and compatibility routes.
- Centralized logs, metrics, traces, health checks, and deployment metadata.
- Versioned API contracts and an explicit service-to-service authentication mechanism.

### Initial service candidates

| Service | Owns | Initial extraction priority |
| --- | --- | --- |
| Identity Service | Google/password authentication, users, sessions, JWT issuance | 1 |
| Marketplace Service | Posts, categories, search, post lifecycle, media references | 2 |
| Contact Service | Contact requests, approvals, contact-sharing policy | 3 |
| Communication Service | Conversations, messages, realtime delivery, chat lifecycle | 4 |
| Safety Service | Reports, moderation, violations, trust decisions, AI policy adapters | 5 |
| Notification Service | Notification creation, delivery, read state, preferences | 6 |

These are logical boundaries first. A service is not considered extracted until it has an owned persistence boundary, API contract, operational signals, deployment path, and rollback path.

## 4. Data ownership rules

1. Each service owns its write model and migrations.
2. No service reads another service's database tables or collections directly.
3. Cross-service references use stable IDs and versioned APIs/events.
4. Denormalized read models are allowed only when their refresh and rebuild strategy is documented.
5. Existing MongoDB data remains available during transition, but dual writes must be temporary, observable, and explicitly reconciled.
6. Secrets and provider credentials are scoped to the service that uses them.

## 5. Migration sequence

### Phase 0 - Baseline and guardrails

- Inventory routes, controllers, models, jobs, events, external providers, and client dependencies.
- Define service ownership and API/event naming conventions.
- Add request correlation IDs and structured service metadata to logs.
- Capture baseline latency, error rate, throughput, queue lag, and database usage.
- Add contract and characterization tests around the routes selected for extraction.
- Decide the deployment target, secret-management approach, and service repository strategy.

**Exit gate:** the team can measure current behavior, identify the owner of every extracted capability, and roll back a routing change without data loss.

### Phase 1 - Extract Identity

- Introduce an identity contract behind the existing auth routes.
- Move authentication provider integrations and token/session issuance behind the contract.
- Keep a compatibility adapter so current clients continue using the same API.
- Establish user ID, token claims, expiration, revocation, and service-authentication rules.
- Migrate reads and writes with reconciliation checks before switching traffic.

**Exit gate:** login, token refresh/validation, logout, and protected-route behavior pass contract tests and can be switched between implementations.

### Phase 2 - Extract Marketplace

- Move post CRUD, post lifecycle, category rules, and search-facing queries.
- Keep media storage in Cloudinary, with only references owned by Marketplace.
- Introduce events for post-created, post-updated, post-closed, and post-expired.
- Build read compatibility for existing web and mobile response shapes.

**Exit gate:** post creation and discovery have parity, indexed queries meet baseline latency, and event replay can rebuild dependent projections.

### Phase 3 - Extract Contact and Communication

- Extract contact requests and approvals before moving chat.
- Make approval the only path that exposes contact details.
- Move conversations, messages, Socket.io delivery, and cleanup jobs behind Communication.
- Use an outbox/event relay so approval and conversation creation are recoverable.

**Exit gate:** no unauthorized contact exposure, message delivery is observable, and chat data can be replayed or restored.

### Phase 4 - Extract Safety and Notifications

- Move reports, moderation decisions, violation history, and AI-provider adapters to Safety.
- Move notification fan-out, delivery, read state, and preferences to Notifications.
- Make safety decisions and notification events idempotent.

**Exit gate:** moderation failures fail closed where required, notification retries are bounded, and user-facing behavior remains compatible.

### Phase 5 - Decommission and optimize

- Remove compatibility adapters and monolith routes only after an agreed observation window.
- Remove temporary dual writes and unused indexes/jobs.
- Separate deployment pipelines and scaling policies by service workload.
- Document ownership, on-call responsibilities, recovery procedures, and cost controls.

## 6. Cross-cutting technical work

- **Contracts:** OpenAPI or equivalent request/response contracts, event schemas, compatibility tests, and versioning policy.
- **Reliability:** timeouts, retries with limits, idempotency keys, circuit breakers, dead-letter handling, and graceful degradation.
- **Security:** service identity, least-privilege credentials, secret rotation, audit logs, and privacy review for contact data.
- **Observability:** correlation ID propagation, structured logs, RED metrics, traces, queue metrics, and dashboards.
- **Delivery:** reproducible builds, per-service CI, health/readiness probes, migration checks, canary or percentage routing, and automated rollback.
- **Testing:** unit, contract, integration, end-to-end, migration/reconciliation, failure-injection, and performance tests.

## 7. Definition of done for each service

- Clear owner and bounded responsibility.
- Versioned API and event contracts.
- Independent build, test, deploy, health, and rollback path.
- Owned persistence boundary and documented migration/reconciliation process.
- No direct database access from other services.
- Metrics, logs, traces, alerts, and runbook.
- Client compatibility verified for web and mobile.
- Load, failure, security, and data-integrity checks passed.

## 8. Immediate Phase 0 work

1. Produce a route-to-module inventory and identify extraction seams.
2. Map each model, job, provider, and event to one proposed owner.
3. Record current API response shapes used by web and mobile.
4. Add correlation IDs and service/request metadata to backend logs.
5. Add characterization tests for auth, post creation/discovery, contact approval, and chat access control.
6. Choose the first extraction target after reviewing coupling, risk, and measurable value.

The first implementation should be the baseline and contract work, not a new network hop. No production traffic should be split until the Phase 0 exit gate is met.

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Distributed data inconsistency | Single writer per capability, outbox/events, reconciliation jobs |
| Increased latency and failure surface | Timeouts, bounded retries, caching, circuit breakers, measured canaries |
| Client breakage | Compatibility adapters, contract tests, additive API changes |
| Unauthorized contact exposure | Central policy in Contact Service, negative tests, audit events |
| Operational overload | Extract only after observability and deployment automation are ready |
| Premature service sprawl | Use logical modules first; extract only where ownership or scaling benefits are demonstrated |

## 10. Decision log

- **Migration approach:** strangler pattern over a rewrite.
- **First workstream:** observability, contracts, and dependency inventory.
- **Initial boundary candidates:** Identity, Marketplace, Contact, Communication, Safety, Notifications.
- **Database rule:** service-owned writes and no cross-service database reads.
- **Client strategy:** preserve current client-facing contracts during migration.
