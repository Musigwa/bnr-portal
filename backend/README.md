# BNR Bank Licensing & Compliance Portal - Backend

This is the backend REST API for the Bank Licensing & Compliance Portal, built with NestJS.

## Stack
- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (Access + Refresh tokens)

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL (or run via Docker)

### Environment Variables
Create a `.env` file in this directory (or use `.env.development` in root if running via Docker) with the following content:

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=bnr
DB_PASSWORD=bnr_secret
DB_NAME=bnr_portal
JWT_SECRET=change_in_production
JWT_REFRESH_SECRET=change_in_production
PORT=3001
NODE_ENV=development
```
*(Note: Use `127.0.0.1` instead of `localhost` on Mac to avoid connection issues).*

### Run Locally (Native)

```bash
pnpm install
npx prisma migrate dev
pnpm dev
```

The API will be available at `http://localhost:3001`.
Swagger documentation will be available at `http://localhost:3001/docs`.

## Seed Data

The database seeds automatically on first startup in development if no Admin user exists.

Alternatively, you can call the seed endpoint publicly if the database is empty, or as ADMIN if users exist:

```bash
POST /database/seed
# No auth header needed if database has no Admin users!
# Authorization: Bearer <admin_token> (Required if database already has an Admin)
```

### Seed Credentials (Dev)

| Role      | Email                 | Password   |
| --------- | --------------------- | ---------- |
| ADMIN     | admin@bnr.rw          | Admin@1234 |
| APPLICANT | applicant@example.com | Test@1234  |
| REVIEWER  | reviewer@bnr.rw       | Test@1234  |
| APPROVER  | approver@bnr.rw       | Test@1234  |

## Running Tests

```bash
pnpm test
```
