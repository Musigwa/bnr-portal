# BNR Bank Licensing & Compliance Portal

A full-stack portal for the National Bank of Rwanda to manage bank licensing applications end-to-end.

## Stack

- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma, JWT
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Infrastructure**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Node.js 20+
- pnpm

### Run with Docker

```bash
docker compose up --build
```

- API: http://localhost:3001/api
- Swagger docs: http://localhost:3001/api/docs
- Frontend: http://localhost:3000

### Run locally

**Backend:**

```bash
cd backend
cp .env.example .env        # fill in your DB credentials
pnpm install
npx prisma migrate deploy
pnpm run dev
```

**Frontend:**

```bash
cd frontend
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL
pnpm install
pnpm run dev
```

## Seed Data

The database seeds automatically on first startup in development.

Alternatively, call the seed endpoint as ADMIN:

```bash
POST /api/database/seed
Authorization: Bearer <admin_token>
```

### Seed credentials

| Role      | Email                 | Password   |
| --------- | --------------------- | ---------- |
| ADMIN     | admin@bnr.rw          | Admin@1234 |
| APPLICANT | applicant@example.com | Test@1234  |
| REVIEWER  | reviewer@bnr.rw       | Test@1234  |
| APPROVER  | approver@bnr.rw       | Test@1234  |

## Running Tests

```bash
cd backend
pnpm test
```

### Test coverage

- `state-machine.spec.ts` — all valid/invalid transitions, terminal states
- `auth.spec.ts` — role boundary assertions
- `concurrency.spec.ts` — simultaneous approval handling

## API Documentation

Full interactive docs available at `/api/docs` (Swagger UI) when the server is running.

## Environment Variables

**Backend `.env`:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=bnr
DB_PASSWORD=bnr_secret
DB_NAME=bnr_portal
JWT_SECRET=change_in_production
JWT_REFRESH_SECRET=change_in_production
PORT=3001
NODE_ENV=development
```

## Design Decisions

See [DESIGN.md](./DESIGN.md) for full architecture, state machine, role design, and trade-off analysis.
