# Contact Service (Microservice)

The **Contact Service** manages the contact exchange lifecycle, ensuring mutual consent before revealing private phone numbers or personal details.

## Responsibilities
- Creation and management of contact requests for marketplace posts
- Status lifecycle: `pending` -> `accepted` / `rejected` / `expired`
- Privacy gate: phone numbers and private details remain obscured until mutual agreement
- Operational health probes and request tracing

## Specifications
- **Port:** `5004`
- **Database:** MongoDB (`mycircle_contact`)
- **Key Models:** `ContactRequest.js`

## Endpoints

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Operational liveness probe |
| `GET` | `/health/ready` | Public | Operational readiness probe |
| `POST`| `/api/contacts/request` | Protected | Send contact request for a post |
| `GET` | `/api/contacts/requests` | Protected | List incoming and outgoing contact requests |
| `PUT` | `/api/contacts/requests/:id/respond`| Protected | Accept or reject a contact request |

## Running Locally

```bash
cd MyCircleAppSuite/Services/Contact
cp .env.example .env
npm install
npm run dev
```

## Running Tests

```bash
npm test
```
