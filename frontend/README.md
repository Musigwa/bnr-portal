# BNR Bank Licensing & Compliance Portal - Frontend

This is the frontend application for the Bank Licensing & Compliance Portal, built with Next.js.

## Stack

- **Framework**: Next.js App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Environment Variables

**Single Source of Truth:** The project is configured to use environment variables from the monorepo root. You do **not** need to create a `.env.development` file in this directory.

Please refer to the **root `README.md`** for instructions on how to generate the required environment variables using the interactive `pnpm env:generate` wizard.

### Run Development Server

To ensure the backend and required Docker infrastructure start correctly alongside the frontend, **always run the development server from the workspace root**:

```bash
cd ..
pnpm install
pnpm dev
```

_This uses Turborepo to seamlessly orchestrate the environment._

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Build

The project is configured to use **Next.js Standalone** output for production, which reduces the Docker image size significantly by removing unnecessary `node_modules`.

### Testing Production Binaries Locally

The easiest way to test the compiled production binary locally is to run the unified start command from the **workspace root**. This will automatically boot your Docker infrastructure, inject the environment, and run the binary safely:

```bash
cd ..
pnpm build
pnpm start
```

**Advanced (Isolated Testing):**
If you need to strictly test this specific package's raw binary in complete isolation (without the root orchestrator), **do not run `pnpm start` directly.** The script is designed exclusively for the production Docker container and relies entirely on OS-level environment variables (like `NEXT_FRONTEND_PORT`).

To test it natively, explicitly source your `.env.development` variables into your shell first:

```bash
env $(grep -v '^#' ../.env.development | xargs) pnpm start
```
