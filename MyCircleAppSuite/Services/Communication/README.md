# Communication Service (Microservice)

The **Communication Service** powers real-time chat, conversations, and direct messaging between users with standalone WebSocket and Socket.io integration.

## Responsibilities
- 1-on-1 direct conversations and post-related inquiries
- Message history and pagination
- Real-time event broadcasting over Socket.io (`message:received`)
- Room management by authenticated user ID
- Operational health probes and request tracing

## Specifications
- **Port:** `5003`
- **Database:** MongoDB (`mycircle_communication`)
- **Key Models:** `Conversation.js`, `Message.js`

## Endpoints

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Operational liveness probe |
| `GET` | `/health/ready` | Public | Operational readiness probe |
| `GET` | `/api/chat/conversations` | Protected | List all conversations for authenticated user |
| `GET` | `/api/chat/messages/:id` | Protected | Fetch message history for a conversation |
| `POST`| `/api/chat/messages` | Protected | Send a message and emit real-time socket notification |

## Running Locally

```bash
cd MyCircleAppSuite/Services/Communication
cp .env.example .env
npm install
npm run dev
```

## Running Tests

```bash
npm test
```
