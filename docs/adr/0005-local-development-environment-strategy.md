# ADR 0005: Local Development Environment Strategy

**Status:** Approved

## Context

We need to establish a standard, high-performance local development environment that minimizes friction for engineers while accurately reflecting our infrastructure dependencies. We have two primary approaches for running our Node.js application services (frontend and backend) locally:

1. **Fully Dockerized (Containerized Code & Infrastructure):** Run both the Node.js applications and the external dependencies (PostgreSQL, MinIO) via Docker Compose.
2. **Hybrid Native Execution (Native Code, Containerized Infrastructure):** Run the Node.js application code natively on the host machine using `pnpm`, while isolating only stateful external dependencies (PostgreSQL, MinIO) inside Docker Compose.

## Trade-off Analysis

### Option 1: Fully Dockerized

- **Pros:**
  - "One-click" setup: Developers do not need to manage Node.js versions or run `pnpm install` locally.
  - Parity: The local environment most closely mimics the production Docker containers.
- **Cons:**
  - **Filesystem Penalties:** To support hot reloading, Docker on host operating systems like macOS and Windows must map tens of thousands of files across the OS-VM virtualization boundary (e.g., via `virtiofs` or gRPC). This virtualization overhead causes high CPU usage, massive battery drain, and frequently breaks file watchers like `nodemon` and Next.js Fast Refresh.
  - **Tooling Disconnect:** Modern developer tools (IDEs, debuggers, language servers) expect to run natively. When code is isolated inside a container, attaching a debugger requires complicated remote-debugging ports, and IDEs cannot accurately resolve types without running redundant local `pnpm install`s anyway.
  - **Speed:** Rebuilding containers to catch new dependencies is significantly slower than native execution.

### Option 2: Hybrid Native Execution

- **Pros:**
  - **Instant Feedback:** Hot reloading is instantaneous and file watchers operate with zero virtualization overhead.
  - **Tooling Harmony:** Debuggers, IDEs, and linters work out-of-the-box natively.
  - **Resource Efficiency:** Battery life and CPU fan noise are vastly improved during development.
- **Cons:**
  - Developers must maintain Node.js and `pnpm` natively on their machines.

## Decision

We have officially adopted the **Hybrid Native Execution** strategy.

1. **Docker is strictly for Infrastructure:** Docker Compose is only used to spin up stateful dependencies and external services (PostgreSQL, MinIO).
2. **Native Execution for Application Code:** The Node.js application layer (both Frontend and Backend) must be executed natively on the developer's host machine using `pnpm`.

## Consequences

- We accept the requirement that developers must install their own Node environment. To mitigate version mismatch risks, we use `engine-strict` in `package.json` to enforce consistent Node and pnpm versions across the team.
- The `docker.compose.yml` file remains focused, lean, and highly performant.
