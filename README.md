# BNR Bank Licensing & Compliance Portal

This is a monorepo containing the full-stack application for the Bank Licensing & Compliance Portal.

## Project Structure

- `backend/`: NestJS REST API with PostgreSQL (via Prisma) and MinIO object storage.
- `frontend/`: Next.js App Router with Tailwind CSS and shadcn/ui.
- `docs/architecture.md`: Detailed architecture and design decisions.

## Execution & Deployment Strategies

### Environment Variables

The project uses a **Single Source of Truth** for environment variables. All variables are managed at the monorepo root.

1. Create your environment files from the example:

   - For development: Create `.env.development`
   - For production: Create `.env.production`
2. Copy the example file and fill in the values:

   ```bash
   cp .env.example .env.development
   ```

**Note:** You no longer need to copy `.env` files into the `frontend` or `backend` subdirectories for local development. The `dev` scripts are configured to load them from the root. For production builds and runtime (e.g., Docker), the environment is managed by the host/orchestrator.

### 1. Local Environment

#### A. Using Docker (Recommended)

Run the entire system (Database, Backend, and Frontend) using Docker Compose:

```bash
NODE_ENV=development docker compose -f docker.compose.yml --env-file .env.development --profile development up backend-dev frontend-dev postgres --build
```

#### B. Native Development

This is the fastest way for rapid iteration. We use `pnpm` workspaces and `turbo` to orchestrate both apps from the root.

1. **Install Dependencies:**

   ```bash
   pnpm install
   ```
2. **Run Everything:**
   From the root folder, run:

   ```bash
   pnpm dev
   ```

   *This will concurrently start the PostgreSQL and MinIO Docker containers in the background, and then use Turborepo to seamlessly start the Next.js and NestJS servers in parallel, injecting the root `.env.development` variables into both.*
3. **Database Setup:**
   If you need to run Prisma migrations:

   ```bash
   pnpm --filter @bnr-portal/backend prisma migrate dev
   ```

   > **CRITICAL: Migrations MUST be additive!**
   > Because this portal manages strict regulatory data, destructive migrations (`DROP TABLE`, `DROP COLUMN`) are strictly forbidden. If a column is deprecated, handle it in the application layer. Data loss is completely unacceptable.
   >
4. **Testing Accounts & Database Seeding:**
   Because there is currently no public "Sign Up" UI, local development heavily relies on the automated database seeder. Upon first boot, the backend automatically seeds the database with standard testing accounts. All accounts use the password: `Password@2026`

   - `applicant@testbank.rw` (Role: APPLICANT)
   - `reviewer@bnr.rw` (Role: REVIEWER)
   - `approver@bnr.rw` (Role: APPROVER)
   - `admin@bnr.rw` (Role: ADMIN) - Password: `Admin@Portal2026`

   **Resetting the Local Database:**
   If your database falls out of sync or you need to restore the pristine seed state, you must bypass the strict WORM compliance triggers.

   *Method 1 (Docker Volume Reset - Recommended):*
   Stop `pnpm dev`, wipe the Postgres volume, and restart:

   ```bash
   docker compose -f docker.compose.yml --env-file .env.development down -v
   pnpm dev
   ```

   *Method 2 (Using Swagger UI):*
   Because the API is fully documented, you can easily perform the reset directly from your browser:
   1. Open the Swagger UI at [http://localhost:3002/docs](http://localhost:3002/docs)
   2. Go to the `Auth` section and execute `POST /auth/login` using the Admin credentials:
      ```json
      {
        "email": "admin@bnr.rw",
        "password": "Admin@Portal2026"
      }
      ```
   3. Copy the `accessToken` from the response.
   4. Scroll to the top, click the **Authorize** button (the padlock), and paste your token.
   5. Scroll to the `Database` section and execute `POST /database/reset` to safely truncate the data.
   6. Finally, execute `POST /database/seed` to rehydrate the database with your fresh testing accounts.

### 2. Production Environment

The application is automatically deployed to production via GitHub Actions.

> **⚠️ Important SSL Certificate Notice**Since our deployment uses `nip.io` with self-signed certificates, your browser will initially block connections to the backend API. To use the application, you **must** first access the backend Swagger UI, accept the security warning ("Proceed to unsafe"), and **try out at least one endpoint** (e.g., a simple GET request) to unlock full access before opening the Web App.
>
> 1. **API Docs (Access First)**: [Swagger UI](https://api.bnr-portal.212.47.77.2.nip.io/docs)
> 2. **Frontend**: [Web App](https://bnr-portal.212.47.77.2.nip.io)

## Documentation

For detailed information about the system design, state machine, and roles, please refer to [docs/architecture.md](docs/architecture.md).
