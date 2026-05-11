# BNR Bank Licensing & Compliance Portal

This is a monorepo containing the full-stack application for the Bank Licensing & Compliance Portal.

## Project Structure

- `backend/`: NestJS REST API with PostgreSQL (via Prisma).
- `frontend/`: Next.js 14 App Router with Tailwind CSS and shadcn/ui.
- `DESIGN.md`: Detailed architecture and design decisions.

## How to Run

### Option 1: Using Docker (Recommended)

You can run the entire system (Database, Backend, and Frontend) using Docker Compose:

```bash
docker compose up --build
```

The services will be available at:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001/api`
- **Swagger Docs**: `http://localhost:3001/api/docs`

### Option 2: Local Development

#### Prerequisites
- **Node.js** (v18+)
- **pnpm**
- **Docker** (Optional, for quick database setup or full run)
- **PostgreSQL** (If running locally without Docker)

#### 1. Setup Backend
```bash
cd backend
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

#### 2. Setup Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

## Documentation

For detailed information about the system design, state machine, and roles, please refer to [DESIGN.md](DESIGN.md).
