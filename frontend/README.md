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

Instead, ensure you have a `.env.development` file in the **root directory** of the repository:

```env
NEXT_FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Run Development Server

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production Build

The project is configured to use **Next.js Standalone** output for production, which reduces the Docker image size significantly by removing unnecessary `node_modules`.
