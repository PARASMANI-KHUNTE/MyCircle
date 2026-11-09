# Marketplace Service (Microservice)

The **Marketplace Service** handles posts, listings, geospatial discovery, and category management for hyperlocal item sales, services, barter, and rentals.

## Responsibilities
- Post creation, retrieval, updates, and archival
- Geospatial location indexing (`2dsphere` Point `[longitude, latitude]`)
- Radius proximity discovery and text search
- Post category categorization and view count metrics
- Operational health probes and request tracing

## Specifications
- **Port:** `5002`
- **Database:** MongoDB (`mycircle_marketplace`)
- **Key Models:** `Post.js`

## Endpoints

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Operational liveness probe |
| `GET` | `/health/ready` | Public | Operational readiness probe |
| `GET` | `/api/posts` | Public | Search and discover posts with geospatial filters (`radius`, `coords`) |
| `GET` | `/api/posts/:id` | Public | Retrieve single post details |
| `POST`| `/api/posts` | Protected | Create a new post listing |

## Running Locally

```bash
cd MyCircleAppSuite/Services/Marketplace
cp .env.example .env
npm install
npm run dev
```

## Running Tests

```bash
npm test
```
