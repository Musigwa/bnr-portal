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

Please refer to the **root `README.md`** for instructions on how to generate the required environment variables using the interactive `pnpm env:generate` wizard.

_(Note: Use `127.0.0.1` instead of `localhost` on Mac to avoid connection issues)._

### Run Locally (Native)

To ensure the Docker infrastructure (Database and Object Storage) starts correctly, **always run the development server from the workspace root**:

```bash
cd ..
pnpm install
pnpm dev
```

_This uses Turborepo to seamlessly orchestrate the environment._

The API will be available at `http://localhost:3001`.
Swagger documentation will be available at `http://localhost:3001/docs`.

### Testing Production Binaries Locally

The easiest way to test the compiled production binary locally is to run the unified start command from the **workspace root**. This will automatically boot your Docker infrastructure, inject the environment, and run the binary safely:

```bash
cd ..
pnpm build
pnpm start
```

**Advanced (Isolated Testing):**
If you need to strictly test this specific package's raw binary in complete isolation (without the root orchestrator), **do not run `pnpm start` directly.** The script is designed exclusively for the production Docker container and relies entirely on OS-level environment variables.

To test it natively, explicitly source your `.env.development` variables into your shell first:

```bash
env $(grep -v '^#' ../.env.development | xargs) pnpm start
```

### 3. Database Setup:

If you need to run Prisma migrations:

```bash
pnpm --filter @bnr-portal/backend prisma migrate dev
```

> **CRITICAL: Migrations MUST be additive!**
> Because this portal manages strict regulatory and compliance data, you are **NOT ALLOWED** to write destructive migrations.
> Do not use `DROP TABLE` or `DROP COLUMN`. If a column is no longer needed, deprecate it in the application layer instead. Data loss is completely unacceptable.

## Seed Data

The database seeds automatically on **first startup in all environments** (Development and Production) if no Admin user exists.

When you deploy the application to a fresh production environment, the backend will automatically detect the empty database and create the initial Admin user and some sample data.

### Seed Credentials

| Role      | Email                 | Password         |
| --------- | --------------------- | ---------------- |
| ADMIN     | admin@bnr.rw          | Admin@Portal2026 |
| APPLICANT | applicant@testbank.rw | Password@2026    |
| REVIEWER  | reviewer@bnr.rw       | Password@2026    |
| APPROVER  | approver@bnr.rw       | Password@2026    |

## Running Tests

```bash
pnpm test
```
