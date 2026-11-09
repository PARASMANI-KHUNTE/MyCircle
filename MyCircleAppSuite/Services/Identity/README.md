# Identity Service (Microservice)

The **Identity Service** is the core authentication, authorization, and user profile microservice for the MyCircle platform. It owns user persistence, credential verification, and JWT claims issuance.

## Responsibilities
- User registration and password authentication (bcrypt)
- Google OAuth provider delegation and session issuance
- Standardized JWT claims creation (`sub`, `email`, `displayName`, `service: identity-service`)
- User profile CRUD, public profile sanitization, and reputation tracking
- Liveness and readiness operational health endpoints

## Specifications
- **Port:** `5001`
- **Database:** MongoDB (`mycircle_identity`)
- **Key Models:** `User.js`

## Endpoints

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Operational liveness probe |
| `GET` | `/health/ready` | Public | Operational readiness probe |
| `POST`| `/auth/register` | Public | Register new user account |
| `POST`| `/auth/login` | Public | Authenticate user with email and password |
| `GET` | `/api/user/profile` | Protected | Fetch authenticated user profile |
| `PUT` | `/api/user/profile` | Protected | Update profile (bio, skills, phone, name) |
| `GET` | `/api/user/:id` | Public | Fetch sanitized public profile |

## Running Locally

```bash
cd MyCircleAppSuite/Services/Identity
cp .env.example .env
npm install
npm run dev
```

## Running Tests

```bash
npm test
```
