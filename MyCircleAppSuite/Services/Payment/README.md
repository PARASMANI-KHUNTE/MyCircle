# Payment Service (Microservice)

The **Payment Service** provides escrow payment protection, order checkout intents, commission calculations, and seller payouts for marketplace transactions.

## Responsibilities
- Escrow protection: funds held safely until buyer confirms receipt
- Payment Intent initialization with gateway client secrets
- Automatic commission deduction (default 5%)
- Seller bank connected account management
- Dispute logging and immutable payment audit trail
- Operational health probes and request tracing

## Specifications
- **Port:** `5006`
- **Database:** MongoDB (`mycircle_payment`)
- **Key Models:** `Order.js`, `SellerAccount.js`, `PaymentAuditLog.js`

## Endpoints

| Method | Path | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/live` | Public | Operational liveness probe |
| `GET` | `/health/ready` | Public | Operational readiness probe |
| `POST`| `/api/payments/create-intent` | Protected | Create order and payment intent for checkout |
| `POST`| `/api/payments/orders/:id/confirm-delivery` | Protected | Buyer confirms receipt -> funds released to seller |
| `GET` | `/api/payments/orders` | Protected | List orders by role (`buyer` or `seller`) |

## Running Locally

```bash
cd MyCircleAppSuite/Services/Payment
cp .env.example .env
npm install
npm run dev
```

## Running Tests

```bash
npm test
```
