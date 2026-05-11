# BNR Bank Licensing & Compliance Portal — Design Document

## 1. Architecture

### Overview

The system is a monorepo with two independently deployable services:

- **Backend**: NestJS REST API, PostgreSQL via Prisma ORM, JWT authentication
- **Frontend**: Next.js App Router, Tailwind CSS, shadcn/ui

### Why NestJS

NestJS enforces module boundaries that map cleanly to bounded contexts — Auth, Applications, Documents, Audit are each self-contained. Dependency injection makes testing straightforward. The decorator-based approach keeps cross-cutting concerns (guards, filters, pipes) out of business logic.

### Why PostgreSQL

ACID compliance is non-negotiable for a regulatory system. Row-level locking (`SELECT FOR UPDATE`) enables correct concurrent access handling. Sequences provide gap-free, atomic reference number generation.

---

## 2. Data Model

### Key design decisions

- `version` column on `Application` enables optimistic locking
- `AuditLog` has no `updatedAt` — the schema itself signals immutability
- `Document.isSuperseded` preserves full version history while making current version obvious
- `RefreshToken.lookupKey` enables O(1) token lookup without exposing the full token

### Schema summary

| Table        | Purpose                             |
| ------------ | ----------------------------------- |
| User         | Identity and role                   |
| Institution  | Bank, financial entity applying     |
| Application  | Core entity, owns the state machine |
| Document     | File metadata + versioning          |
| AuditLog     | Append-only event log               |
| RefreshToken | Session management                  |

---

## 3. State Machine

### Transition rules

| Transition      | From         | To           | Actor     | Additional rule           |
| --------------- | ------------ | ------------ | --------- | ------------------------- |
| SUBMIT          | DRAFT        | SUBMITTED    | APPLICANT | Must own application      |
| ASSIGN_REVIEWER | SUBMITTED    | UNDER_REVIEW | REVIEWER  | Assigns themselves        |
| REQUEST_INFO    | UNDER_REVIEW | PENDING_INFO | REVIEWER  | Must be assigned reviewer |
| COMPLETE_REVIEW | UNDER_REVIEW | REVIEWED     | REVIEWER  | Must be assigned reviewer |
| RESUBMIT        | PENDING_INFO | UNDER_REVIEW | APPLICANT | Must own application      |
| APPROVE         | REVIEWED     | APPROVED     | APPROVER  | Must NOT be the reviewer  |
| REJECT          | REVIEWED     | REJECTED     | APPROVER  | Must NOT be the reviewer  |

### Terminal states

APPROVED and REJECTED are permanent. Once reached, no transition is permitted regardless of actor or role. Enforced at the API level — not just UI.

---

## 4. Roles

| Role      | Can do                                                            | Cannot do                                       |
| --------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| APPLICANT | Create/edit DRAFT, upload documents, submit, resubmit             | Review, approve, reject, see other applications |
| REVIEWER  | View all applications, assign self, request info, complete review | Approve, reject, manage users                   |
| APPROVER  | Approve or reject REVIEWED applications they did not review       | Review, assign, manage users                    |
| ADMIN     | Manage users, view all applications and audit logs, seed/reset DB | Approve, reject, review (operational role only) |

### Why Reviewer and Approver are separate roles

The four-eyes principle: the person who forms an opinion on an application (reviewer) cannot be the same person who makes the binding decision (approver). This is enforced at three levels:

1. Role-based guard — REVIEWER role cannot call approve/reject endpoints
2. Business logic — `assertNotReviewer()` checks `application.reviewerId !== user.id` before any approval
3. The check survives even if a user somehow holds both roles in future — the per-application reviewer ID is always checked

---

## 5. Non-Negotiable Requirements — Implementation

### Authentication

**Choice: JWT with short-lived access tokens (15min) + refresh tokens (7 days)**

**Justification**: Stateless access tokens scale horizontally without shared session storage. Short expiry limits blast radius of token theft. Refresh tokens are stored as bcrypt hashes with a plaintext lookup key — O(1) lookup without storing raw tokens.

Session-based auth was rejected: requires sticky sessions or shared Redis, adds operational complexity for no benefit at this scale.

### Concurrent access

Every state transition uses a Prisma transaction with `SELECT FOR UPDATE` to acquire a row-level lock. The update includes a `version` check — if the version has changed since the lock was acquired, the update returns null and a `ConflictException` (409) is thrown. The second concurrent request fails cleanly without corrupting state.

### Audit trail tamper-proofing

Two independent layers:

1. **API layer**: No UPDATE or DELETE routes exist for AuditLog. `AuditService` exposes only `log()` and `getByApplication()`.
2. **Database layer**: `REVOKE DELETE, UPDATE, TRUNCATE ON "AuditLog" FROM bnr` — the application database user physically cannot modify audit records even if the API is bypassed.

**Acknowledged limitation:** A PostgreSQL superuser could still modify records. In a production system this would be addressed with a write-once ledger service or an append-only external log (e.g. CloudTrail, immutable S3).

### Illegal state transitions

Rejected at the service layer via `assertValidTransition()` before any database write. Returns HTTP 422 Unprocessable Entity. The UI cannot override this — direct API calls are equally rejected.

### Document versioning

When a document with the same filename is uploaded, the previous version is marked `isSuperseded=true`. All versions remain in the database and are accessible via the version history. Current versions are surfaced by default.

---

## 6. Production-Ready Enhancements

The following architectural and UX enhancements have been successfully implemented to ensure an industrial-grade, scalable production platform:

### 6.1 Implemented Infrastructure & UX Features

- **Multi-Stage Docker Builds**: Dockerfiles have been optimized to separate build dependencies from runtime, utilizing Alpine base images and `pnpm` caching. They also leverage `turbo prune` to natively isolate and inject internal workspace dependencies (like `@bnr-portal/env`) without manual file copying.
- **Next.js Standalone Output**: `next.config.ts` is configured with `output: 'standalone'` to produce a minimal production bundle without needing the full `node_modules` directory in the final container image.
- **Advanced Frontend Analytics & UX**: The dashboard features complex data aggregation, dynamic custom date-range global filtering, and unified UI styling.
- **Object Storage Migration**: Transitioned from local filesystem storage to MinIO (S3-compatible API), enabling robust, scalable document management using `StreamingService` for zero-memory footprint uploads.
- **Inline Document Previews**: Leveraged native browser capabilities to render Blob Object URLs directly in new tabs, avoiding heavy external PDF/Image viewer libraries while keeping interactions entirely within the browser context.

### 6.2 Future Roadmap (Security & Compliance)

- **Field-Level Encryption**: Implement encryption at rest for sensitive financial data (e.g., proposed capital, registration numbers) using Prisma middleware or native database encryption.
- **Token Blacklisting**: Use Redis to store revoked tokens for immediate access token invalidation on logout.
- **Granular Permissions (ABAC)**: Transition from simple Role-Based Access Control (RBAC) to Attribute-Based Access Control (ABAC) to allow policies like "Reviewer can only see applications in their assigned region".

### 6.3 Future Roadmap (Performance & Scalability)

- **Pagination**: Implement cursor-based pagination on all list endpoints (Applications, Audit Logs) to prevent performance degradation as data grows.
- **Asynchronous Processing**: Offload non-blocking tasks (if introduced, a good example would be a mailing service, or the file upload/downlaod for large file streams) to a message queue (e.g., BullMQ with Redis).

### 6.4 Future Roadmap (Observability & Testing)

- **Integration Testing**: Implement a dedicated test database (or use Testcontainers) to run end-to-end integration tests in CI.
- **OpenTelemetry**: Integrate tracing and metrics to monitor system health and API latency in production.

### 6.5 Future Roadmap (Data Integrity & Migrations)

- **Expand-Contract Pattern (Parallel Change)**: To maintain our strict "Additive Migrations Only" policy while allowing necessary database schema evolution without downtime, future complex schema changes will strictly follow the three-phase **Expand-Contract** methodology:
  1. **Expand**: Introduce the new database column/table alongside the old one. Update the application to write to both the old and new structures (dual-writes) while continuing to read from the old.
  2. **Backfill**: Run a background migration script to securely copy and transform historical data from the old structure into the new structure. Switch application reads to the new structure once data is verified.
  3. **Contract**: Remove the dual-write logic from the application. Once deployed and stable, create a final migration to safely drop the deprecated column/table.

---

## 7. Security & Environment Architecture

### Environment Configuration
**Choice: Central Joi Schema in an Internal Package (`@bnr-portal/env`)**
- The environment validation schema (`schema.ts`) and its CLI generation scripts have been cleanly extracted into a dedicated workspace package (`packages/env`). This prevents TypeScript compilers from improperly nesting build outputs (`dist/backend/src`) when attempting to resolve relative paths outside application boundaries.
- No fallback values (`|| 5`) exist in the application code. If a value is required, it must be validated by the Joi schema and injected.
- To handle `.env` files universally without runtime crashes, empty strings (`""`) are natively stripped in a shared `validateEnvironment` helper before Joi validation, treating them as strictly omitted.

### Rate Limiting (Throttling)
**Choice: Dual-Bucket Global Strategy with Strict Overrides**
- **Global Buckets**: The application globally enforces a `short` bucket (blocks rapid micro-spikes) and a `long` bucket (blocks sustained scraping) simultaneously.
- **Strict Override (`@StrictThrottle`)**: Highly sensitive endpoints (e.g., `/auth/login`) intercept the `short` bucket to enforce extremely tight configurations (e.g., 5 requests per 60 seconds).
- **Dynamic Configuration Safety**: Even on strict endpoints, the global `long` bucket is never explicitly disabled (`SkipThrottle`). Because the strict limits are defined dynamically via environment variables, operations teams could alter them to be less restrictive than the global limits. Keeping the `long` bucket active ensures sustained protection is never accidentally bypassed due to environment misconfiguration.
