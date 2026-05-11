# ADR 1: Docker Compose Port Mapping and Environment Strategy

## Status

Approved

## Context

We need a lean, secure, and flexible way to handle environment variables and port mappings in a monorepo with separate development and production profiles. We want to avoid port conflicts on the VPS and ensure a smooth developer experience on local machines.

## Decision

We establish the following standards for Docker Compose and environment variables, organized by environment and service role:

### 1. Development Environment

#### 1.1 Applications (Backend/Frontend)

- **Port Mapping**: Use the same port for both host and container: `"${PORT}:${PORT}"` (e.g., `3001:3001`).
- **Why**: This works because we pass the variable to the app inside the container, allowing both sides to move together if the port is changed.

#### 1.2 App Dependency Services (Postgres)

- **Port Mapping**: Use variable host ports and fixed container ports: `"${DB_PORT}:5432"`.
- **Why**: The right side is locked to `5432` because official database images have fixed listening ports. In development, `DB_PORT` can be set to `5432` or any other port to avoid conflicts on your host machine, while the right side remains fixed to `5432`.

### 2. Production Environment

#### 2.1 Applications

- **Port Mapping**: Use dynamic host ports and fixed container ports: `"0:3001"`.
- **Why**: Docker automatically assigns a random available port on the VPS, avoiding conflicts. This is also **Zero Downtime friendly** (especially in a Blue/Green strategy), as it allows starting a new container on a new random port before stopping the old one. A proxy service like **(Caddy)** can handle routing using service discovery strategy.

#### 2.2 App Dependency Services (Postgres)

- **Port Mapping**: Use variable host ports and fixed container ports: `"${DB_PORT}:5432"`.
- **Why**: In production, `DB_PORT` is set to `0` for dynamic mapping, letting Docker assign a random port while keeping the internal port at `5432`.

### 3. General Standards

#### 3.1 Connection Strings (`DATABASE_URL`)

- **Strategy**: Constructed directly inside `docker.compose.yml` for the backend using `postgres:5432`.
- **Why**: This ensures that apps running inside Docker connect reliably to the database container in the same network, regardless of what the host port is set to.

#### 3.2 Isolation Standard

- **Strategy**: If a service runs in Docker, it expects its direct dependencies (like the DB) to be in the same Docker network.
- **Why**: Mixing and matching (e.g., Frontend Native + Backend Docker) is supported, but a containerized service should not depend on external services outside its stack unless explicitly configured.

## Consequences

### Benefits

- **No port conflicts on the VPS**: Dynamic ports prevent conflicts between different apps or deployments.
- **Zero Downtime friendly**: Enables Blue/Green strategy by allowing parallel execution on different ports.
- **Safe and foolproof database connections**: Hardcoding the internal port prevents breaking connections from the environment file.
- **Clear separation of concerns**: Host ports and container ports are decoupled.
- **Flexible development**: Allows changing host ports on your Mac/PC without breaking the containerized app.

### Limitations

- **Requires a reverse proxy (like Caddy)** on the VPS to handle routing to dynamic ports.
- **Enforces stack isolation**: Containerized services cannot easily connect to external databases without manually overriding the `DATABASE_URL` strategy.
