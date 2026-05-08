# ADR 2: Environment Variable Naming Standard for Monorepo

## Status
Approved

## Context
In a monorepo where both Frontend (Next.js) and Backend (NestJS) share the same GitHub environment vault (`production`), we need a clean and scalable way to differentiate their secrets without introducing complex mapping in Docker Compose or losing the security features of Next.js.

## Decision
We establish the following naming standards for environment variables in the project and the GitHub vault:

### 1. Frontend (Next.js)
- **Public Variables**: Must be prefixed with `NEXT_PUBLIC_*` (e.g., `NEXT_PUBLIC_API_URL`). These are bundled by Next.js and exposed to the browser.
- **Secure Variables**: Must be prefixed with `NEXT_*` (e.g., `NEXT_SECRET_KEY`). These remain private to the Next.js server-side and are never exposed to the browser.

### 2. Backend (NestJS)
- **All Variables**: Will have no prefix (e.g., `DB_PASSWORD`, `JWT_SECRET`). They are private to the backend container.

### 3. Storage in Vault
- All secrets live in the same `production` environment on GitHub.
- They are named **exactly** as the app expects them (no extra `FRONTEND_` or `BACKEND_` prefixes added in the vault).

## Consequences

### Benefits
- **No Mapping Needed**: Since the name in the vault matches the name the app expects, variables pass straight through without needing complex mapping in `docker.compose.yml`.
- **Security by Design**: The `NEXT_PUBLIC_` prefix makes it immediately obvious to developers which variables are safe to use in the browser and which are not.
- **Scalable**: Adding a new variable to either app does not require updating CI/CD scripts or compose files.

### Limitations
- Backend variables do not have a prefix, so they rely on good documentation (like comments in `.env` files) to not be confused with shared project variables.
