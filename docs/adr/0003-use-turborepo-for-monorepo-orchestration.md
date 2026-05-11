# 3. Use Turborepo for Monorepo Orchestration

## Status

Approved

## Context

Our application architecture relies on a PNPM workspace containing both a Next.js frontend and a NestJS backend. Furthermore, the application requires heavy stateful backing services (PostgreSQL and MinIO object storage) to function correctly during local development.

When orchestrating a local development environment with these constraints, several alternative approaches exist:

1. **Fully Dockerized Dev Environment**: Running both the application code and backing services entirely inside Docker. While this guarantees 100% environment parity, it degrades the developer experience (DX) due to slower hot-reloading (HMR) caused by filesystem sync boundaries and complicates debugger attachment.
2. **Raw Workspace Scripts**: Utilizing basic package manager parallelization (e.g., `pnpm -r --parallel dev`). While lightweight, this approach lacks topological awareness (potentially starting the frontend before the backend's database client is generated) and lacks caching, leading to sluggish builds.
3. **Dedicated Wrappers/Makefiles**: Writing custom orchestration scripts or utilizing `Makefiles` to coordinate spinning up Docker containers before starting Node processes. This handles the dependency sequencing but does not solve the lack of build caching and adds maintenance overhead.

To achieve an optimal developer experience, we require a solution that provides the robust caching and topological awareness of an advanced build system, the native execution speed of the host machine for application code, and the isolation of Docker for stateful infrastructure.

## Decision

We will implement the "Gold Standard" DX architecture for modern TypeScript monorepos:

1. **Dockerized Infrastructure**: All stateful backing services (PostgreSQL, MinIO) will run exclusively inside Docker Compose to guarantee environment parity across all machines.
2. **Native Application Execution**: The Next.js and NestJS development servers will run natively on the host machine to maximize hot-reloading speed and enable flawless IDE debugger attachment.
3. **Turborepo Orchestration**: We will introduce `turbo` to manage task execution across the workspace.

To bind this together and eliminate DX friction, the root `dev` script in `package.json` is configured to orchestrate both systems seamlessly:

```json
"dev": "pnpm services:up && turbo run dev"
```

## Consequences

### Positive

- **Zero-Friction Startup**: A developer simply types `pnpm dev` and the entire environment (both Docker infrastructure and native code) bootstraps intelligently.
- **Smart Caching**: Turborepo will cache build outputs, linting results, and type-checks, drastically reducing compute times.
- **Topology Awareness**: Turborepo understands the workspace dependency graph and sequences tasks correctly (e.g., ensuring `build` processes run in the right order).

### Negative

- **Additional Tooling**: Introduces a new tool (`turbo`) and configuration file (`turbo.json`) that team members must understand.
- **Cache Invalidation**: Developers may occasionally need to bypass or clear the Turborepo cache if stale artifacts cause unexpected behavior (using `turbo run dev --force`).
