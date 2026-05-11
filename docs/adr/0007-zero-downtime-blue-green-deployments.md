# ADR 0007: Zero-Downtime Blue/Green Deployments

## Status

Approved

## Context

In an enterprise environment like the BNR portal, any downtime during a production deployment is unacceptable. Previously, the pipeline executed a standard `docker compose down && docker compose up -d` sequence or simple container restart, resulting in 5-15 seconds of API downtime while the new Node.js/Next.js applications booted up. This could cause dropped requests or temporary 502 errors for active users.

We needed a resilient, zero-downtime deployment mechanism that natively supports rolling updates without the complexity of a massive orchestration engine like Kubernetes.

## Decision

We have implemented a **Blue/Green Deployment Strategy** orchestrated entirely through bash scripting and a dynamically reloaded Caddy reverse proxy (`.github/scripts/deploy-blue-green.sh`).

1. **Active/Idle Slots**: At any given time, the active application runs in either a "Blue" or "Green" container slot.
2. **Parallel Booting**: When a deployment triggers, the script identifies the idle slot and launches the new Docker container using the new image tag. The active container continues serving production traffic uninterrupted.
3. **Rigorous Health Checks**: The script actively polls the new container's internal health check endpoints until the framework (NestJS or Next.js) has completely initialized.
4. **Atomic Traffic Switch**: Once healthy, the script rewrites the Caddy configuration file for the specific service and executes an atomic `caddy reload`. Traffic is instantly cut over to the new container.
5. **Contract/Cleanup**: After a brief sleep interval, the script gracefully shuts down and removes the old container, freeing up the port and resources for the next deployment.

### Trustless Pipeline Integration

Our CI/CD pipeline enforces **Strict Sequential Deployment** (Backend *then* Frontend). The backend deployment must complete successfully before the frontend deployment begins. This mathematically prevents version mismatches where a new frontend attempts to consume an API endpoint that has not yet finished booting.

## Consequences

### Positive
* **Zero Downtime**: Users never see a 502 Bad Gateway during deployments.
* **Instant Rollbacks**: Because the traffic switch is handled via an atomic Caddyfile swap, if the health check fails, the active container is never touched, and the deployment is cleanly aborted.
* **No Orchestration Bloat**: We achieve Kubernetes-level zero-downtime rollouts using native Docker Compose and bash, keeping operational complexity and server overhead extremely low.
* **Automatic Port Resolution**: Ephemeral ports (`"0:${PORT}"`) are used to prevent port conflicts on the host when Blue and Green containers run simultaneously. The script dynamically extracts the assigned port.

### Negative
* **Resource Overhead**: During the deployment transition (approx. 2-4 minutes), both the Blue and Green containers run concurrently. The VPS must have enough RAM/CPU to support running 2x the application layer temporarily.
* **Deployment Time**: Because the script waits for health checks and gracefully switches traffic, a full pipeline execution takes longer (~8 minutes) compared to a hard restart. This is a deliberate tradeoff of speed for safety.
