# PayMatch API

**Payment Reconciliation Platform** — Built for the DevCareer × Nomba Hackathon 2026.

A secure, scalable NestJS backend foundation demonstrating production-ready engineering practices and readiness for Nomba API integration.

---

## Architecture

```
src/
├── auth/           # Authentication module (register/login)
├── common/         # Shared utilities, filters, constants, interfaces
├── config/         # Environment configuration
├── customers/      # Customer management module
├── dashboard/      # Dashboard summary and metrics
├── health/         # Health check endpoints
├── invoices/       # Invoice management module
├── nomba/          # Nomba integration services (reusable)
├── payments/       # Payment transaction module
├── prisma/         # Database service (Prisma ORM)
├── shared/         # Cross-cutting concerns (logging)
└── webhook/        # Nomba webhook handling
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Feature-first modules** | Each module is self-contained with controller, service, DTOs — enables independent development |
| **Prisma ORM** | Type-safe database access with auto-generated client and migration support |
| **Global validation pipe** | All DTOs validated automatically — whitelist strips unknown properties |
| **Global exception filter** | Standardized error responses across all endpoints |
| **Structured logging** | Request/response logging with sensitive data sanitization |
| **Helmet middleware** | Security headers for production readiness |
| **Swagger documentation** | Auto-generated API docs at `/api/docs` |
| **Nomba service abstractions** | Interfaces and services ready for OAuth, virtual accounts, transactions, webhook verification |

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 5
- **Validation:** class-validator + class-transformer
- **Security:** Helmet, CORS, HMAC SHA-256
- **Documentation:** Swagger/OpenAPI

---

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/somod-gif/PayMatch-Backend.git
cd paymatch-backend
npm install
```

### 2. Configure environment

Create a `.env` file in the project root with your credentials:

```env
PORT=5000
CORS_ORIGIN=*
DATABASE_URL=postgresql://user:password@host:5432/database
NOMBA_ACCOUNT_ID=
NOMBA_SUB_ACCOUNT_ID=
NOMBA_CLIENT_ID=
NOMBA_PRIVATE_KEY=
NOMBA_WEBHOOK_SECRET=your-webhook-secret
```

> **SECURITY:** Never commit `.env` to version control. Keep all secrets local.

### 3. Set up database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev --name init

# (Optional) Seed sample data
npx prisma db seed
```

### 4. Start development server

```bash
npm run start:dev
```

---

## API Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check status |
| GET | `/` | API information |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register a new customer |
| POST | `/api/v1/auth/login` | Customer login (placeholder) |

### Customers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/customers` | List all customers |
| POST | `/api/v1/customers` | Create a customer |
| GET | `/api/v1/customers/:id` | Get customer by ID |
| PATCH | `/api/v1/customers/:id` | Update customer |
| DELETE | `/api/v1/customers/:id` | Deactivate customer |

### Invoices

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/invoices` | List all invoices |
| POST | `/api/v1/invoices` | Create an invoice |
| GET | `/api/v1/invoices/:id` | Get invoice by ID |
| PATCH | `/api/v1/invoices/:id` | Update invoice |

### Virtual Accounts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/virtual-accounts` | List all virtual accounts |
| POST | `/api/v1/virtual-accounts` | Create a virtual account for an invoice |

### Payments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/payments` | List payments (with filters) |
| POST | `/api/v1/payments` | Record a payment |
| GET | `/api/v1/payments/:id` | Get payment by ID |
| GET | `/api/v1/payments/reference/:ref` | Get payment by reference |
| GET | `/api/v1/payments/link/:invoiceNumber` | Get payment link for an invoice |
| GET | `/api/v1/payments/share/:invoiceNumber` | Get payment share information |
| POST | `/api/v1/payments/send-email/:invoiceNumber` | Send invoice email to customer |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/dashboard/summary` | Dashboard metrics summary |

### Webhooks ⚠️ (No version prefix)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/nomba` | Receive Nomba webhook events |

> **IMPORTANT:** The webhook endpoint `POST /webhooks/nomba` is a production integration already registered with Nomba. It must NOT be prefixed with `/api/v1` or any versioned route. Backward compatibility is mandatory.

### Documentation

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/docs` | Swagger API documentation |

---

## Nomba Integration Foundation

The following reusable services are prepared for Nomba API integration:

| Service | Purpose | Status |
|---------|---------|--------|
| `NombaAuthService` | OAuth authentication with token caching | Placeholder |
| `NombaVirtualAccountService` | Virtual account creation and management | Placeholder |
| `NombaTransactionService` | Payment initiation and transfer processing | Placeholder |
| `NombaWebhookVerificationService` | HMAC SHA-256 signature verification | Implemented |

Each service uses TypeScript interfaces defined in `src/nomba/interfaces/nomba.interface.ts` and is ready for actual HTTP implementation after Stage 1.

---

## Security

- **Helmet** — Sets secure HTTP headers
- **CORS** — Configurable origin restrictions
- **ValidationPipe** — Input validation and sanitization
- **HMAC SHA-256** — Webhook signature verification
- **Request logging** — Structured logging with sensitive data redaction
- **Environment variables** — All secrets managed via `.env`

---

## Scripts

```bash
npm run start:dev    # Development with hot reload
npm run build        # Production build
npm run start:prod   # Run production build
npm run lint         # Lint code
npm run test         # Run unit tests
npm run test:e2e     # Run e2e tests
```

### Database CLI

```bash
npx prisma generate          # Generate Prisma Client
npx prisma migrate dev       # Run migrations
npx prisma studio            # Open Prisma Studio GUI
```

---

## Deployment

### Build

```bash
npm run build
```

### Run

```bash
npm run start:prod
```

### Environment Variables

Ensure all required environment variables are set in your deployment environment (see `.env.example`).

---

## Project Status

**Stage 1 — Build Progress** ✅

- [x] Modular NestJS architecture
- [x] Configuration module with environment variables
- [x] Health check endpoints
- [x] Nomba webhook endpoint with HMAC verification
- [x] Idempotent webhook handling
- [x] Structured logging and error handling
- [x] Prisma ORM with PostgreSQL models
- [x] Auth, Customers, Invoices, Payments, Dashboard modules
- [x] Nomba integration services (OAuth, Virtual Accounts, Transactions)
- [x] Swagger API documentation
- [x] Security (Helmet, CORS, ValidationPipe)
- [x] Deployment readiness

---

## License

MIT — Built for the DevCareer × Nomba Hackathon 2026.