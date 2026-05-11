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
- PostgreSQL and MinIO (or run via Docker Compose from the root)

### Environment Variables

**Single Source of Truth:** The project is configured to use environment variables from the monorepo root. You do **not** need to create a `.env` file in this directory.

Instead, ensure you have a `.env.development` file in the **root directory** of the repository:

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

# MinIO Storage Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=bnr_admin
MINIO_SECRET_KEY=bnr_secret_key
MINIO_BUCKET_NAME=bnr-bucket
```

*(Note: Use `127.0.0.1` instead of `localhost` on Mac to avoid connection issues).*

### Run Locally (Native)

To ensure the Docker infrastructure (Database and Object Storage) starts correctly, **always run the development server from the workspace root**:

```bash
cd ..
pnpm install
pnpm dev
```

*This uses Turborepo to seamlessly orchestrate the environment.*

The API will be available at `http://localhost:3001`.
Swagger documentation will be available at `http://localhost:3001/docs`.

### 3. Database Setup:

If you need to run Prisma migrations:

```bash
pnpm --filter @bnr-portal/backend prisma migrate dev
```

> **CRITICAL: Migrations MUST be additive!**
> Because this portal manages strict regulatory and compliance data, you are **NOT ALLOWED** to write destructive migrations.
> Do not use `DROP TABLE` or `DROP COLUMN`. If a column is no longer needed, deprecate it in the application layer instead. Data loss is completely unacceptable.

## Seed Data

The database seeds automatically on first startup in development if no Admin user exists.

Alternatively, you can call the seed endpoint publicly if the database is empty, or as ADMIN if users exist:

```bash
POST /database/seed
# No auth header needed if database has no Admin users!
# Authorization: Bearer <admin_token> (Required if database already has an Admin)
```

### Seed Credentials (Dev)

| Role      | Email              | Password         |
| --------- | ------------------ | ---------------- |
| ADMIN     | admin@bnr.rw       | Admin@Portal2026 |
| APPLICANT | alice.uwera@kcb.rw | KCB@Portal2026   |
| REVIEWER  | jp.habimana@bnr.rw | BNR@Portal2026   |
| APPROVER  | mc.mutoni@bnr.rw   | BNR@Portal2026   |

## Running Tests

```bash
pnpm test
```
