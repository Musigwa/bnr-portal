# BNR Bank Licensing & Compliance Portal

This is a monorepo containing the full-stack application for the Bank Licensing & Compliance Portal.

## Project Structure

- `backend/`: NestJS REST API with PostgreSQL (via Prisma).
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
This is the fastest way for rapid iteration. We use `pnpm` workspaces to manage both apps from the root.

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Run Everything:**
   From the root folder, run:
   ```bash
   pnpm dev
   ```
   *This will concurrently start the NestJS backend and Next.js frontend, injecting the root `.env.development` variables into both.*

3. **Database Setup:**
   If you need to run Prisma migrations:
   ```bash
   cd backend
   pnpm prisma migrate dev
   ```

### 2. Production Environment

The application is automatically deployed to production via GitHub Actions.

- **Frontend**: [Web App](https://bnr-portal.212.47.77.2.nip.io)
- **API Docs**: [Swagger UI](https://api.bnr-portal.212.47.77.2.nip.io/docs)

## Documentation

For detailed information about the system design, state machine, and roles, please refer to [docs/architecture.md](docs/architecture.md).
