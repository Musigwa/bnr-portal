# BNR Bank Licensing & Compliance Portal

This is a monorepo containing the full-stack application for the Bank Licensing & Compliance Portal.

## Project Structure

- `backend/`: NestJS REST API with PostgreSQL (via Prisma).
- `frontend/`: Next.js 14 App Router with Tailwind CSS and shadcn/ui.
- `DESIGN.md`: Detailed architecture and design decisions.

## Execution & Deployment Strategies

### Environment Variables
Before running the application (either via Docker or natively), you must create the appropriate `.env` file based on `.env.example`:
- For development: Create `.env.development`
- For production: Create `.env.production`

Copy the example file and fill in the values:
```bash
cp .env.example .env.development
```

### 1. Local Environment
You can run the application locally in two ways:

#### A. Using Docker (Recommended)
Run the entire system (Database, Backend, and Frontend) using Docker Compose:
```bash
NODE_ENV=development docker compose -f docker.compose.yml --env-file .env.development --profile development up backend-dev frontend-dev postgres --build
```
The services will be available at:
- **Frontend**: `http://localhost:${NEXT_FRONTEND_PORT}`
- **Backend API**: `http://localhost:${BACKEND_PORT}`
- **Swagger Docs**: `http://localhost:${BACKEND_PORT}/docs`

#### B. Native Development
If you prefer to run services manually:

**Prerequisites:**
- **Node.js** (v18+)
- **pnpm**
- **Docker** (Optional, for quick database setup)
- **PostgreSQL** (If running locally without Docker)

**Backend:**
```bash
cd backend
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm dev
```

### 2. Production Environment
The application is automatically deployed to production via GitHub Actions.
- **Frontend**: [Web App](https://bnr-portal.212.47.77.2.nip.io)
- **API Docs**: [Swagger UI](https://api.bnr-portal.212.47.77.2.nip.io/docs)

## Documentation

For detailed information about the system design, state machine, and roles, please refer to [DESIGN.md](DESIGN.md).
