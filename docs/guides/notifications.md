# Notifications

## Delivery path

1. A controller calls `createNotification(io, payload)`.
2. The notification is saved with a stable `event` name as well as the legacy `type`.
3. When `REDIS_URL` is configured, the payload is published to the `mycircle:notifications`
   Redis channel. Every server instance subscribes and emits `new_notification` to its local
   `user:<recipientId>` room. This keeps realtime delivery working under PM2 cluster mode and
   for notifications created by the background worker.
4. Without Redis, the server emits directly to the local Socket.IO room (development fallback).

## Event contract

Clients route on `event` first and fall back to `type`/`link` for older notifications.

| Event | Source | Client destination |
|-------|--------|--------------------|
| `new_application` | Contact request on a job post | Requests |
| `contact_request` | Contact request on a non-job post | Requests |
| `application_accepted` | Request accepted | Chat (or Requests without a conversation) |
| `application_rejected` | Request rejected | Requests |
| `post_status_changed` | Post status/toggle route | Post details |
| `message`, `like`, `comment`, `system` | Derived from legacy `type` | Chat / post details / fallback |

Realtime payloads include `_id`, `type`, `event`, `title`, `message`, `link`, `postId`,
`conversationId`, `relatedId`, `read`, and `createdAt`.

## REST endpoints

- `GET /api/notifications` — paginated list with `X-Total-Count` / `X-Has-More` headers.
- `GET /api/notifications/unread-count` — `{ "count": number }`; used for the global badge.
- `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`.
- `POST /api/notifications/device-token` — `{ "token": string, "platform": "ios" | "android" | "web" }`.
- `DELETE /api/notifications/device-token` — `{ "token"?: string }`; omit `token` to clear all.
- `DELETE /api/notifications/delete-all`, `DELETE /api/notifications/:id`.

## Client behavior

- Web and mobile reconnect Socket.IO indefinitely with exponential backoff and both polling and
  WebSocket transports. On every successful (re)connect they refetch the notification list and
  unread count so events missed while offline are recovered.
- Incoming notifications are deduplicated by `_id`; the unread count comes from the server rather
  than the currently loaded page.
- Mobile requests notification permission on startup, displays a high-importance local heads-up
  notification for socket events, and registers/deregisters the FCM token with the server across
  login/logout. Native FCM delivery additionally requires `google-services.json` (Android) and a
  configured `GoogleService-Info.plist` / APNs capability (iOS).
