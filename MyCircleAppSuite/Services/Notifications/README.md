# Notification Service (Microservice)

The **Notification Service** delivers in-app activity feeds and tracks read state for interactions across the MyCircle platform.

## Responsibilities
- Creation and dispatch of activity notifications (contact requests, chat alerts, status changes)
- Real-time unread badge counts
- Mark single or bulk mark-all-read operations
- Operational health probes and request tracing

## Specifications
- **Port:** `5005`
- **Database:** MongoDB (`mycircle_notifications`)
- **Key Models:** `Notification.js`

## Endpoints

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Operational liveness probe |
| `GET` | `/health/ready` | Public | Operational readiness probe |
| `GET` | `/api/notifications` | Protected | Fetch paginated notification feed and unread count |
| `PUT` | `/api/notifications/:id/read` | Protected | Mark single notification as read |
| `PUT` | `/api/notifications/read-all` | Protected | Mark all user notifications as read |

## Running Locally

```bash
cd MyCircleAppSuite/Services/Notifications
cp .env.example .env
npm install
npm run dev
```

## Running Tests

```bash
npm test
```
