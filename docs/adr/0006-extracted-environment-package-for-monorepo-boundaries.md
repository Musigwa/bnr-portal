# ADR 0006: Environment Validation Package Extraction

## Status

Approved

## Context

We need a strict, unified single source of truth for environment variable validation across all applications in the monorepo (Backend, Frontend). 

If a shared Joi schema (`environment.schema.ts`) lives at the monorepo root and is imported via relative paths (e.g., `../../environment.schema.ts`), the NestJS TypeScript compiler (`tsc`) traces the import path outside of the `backend/src` workspace boundary. This causes it to reconstruct the entire relative folder tree inside the compiled `dist/` output directory (resulting in `dist/backend/src/main.js` instead of the standard `dist/main.js`), completely breaking our Docker deployments and Prisma schema paths.

## Options Considered

1. **Option 1: Keep schema in root and use path mapping (`tsconfig.json` paths)**
   - *Pros:* Relatively quick to implement, keeps the file at the root.
   - *Cons:* The TypeScript compiler still treats it as a local source file during the final build step, which often still results in mangled `dist/` output structures depending on the bundler.

2. **Option 2: Duplicate the schema in both frontend and backend**
   - *Pros:* Solves the compilation boundary issue entirely as no files cross workspace boundaries.
   - *Cons:* Violates the DRY principle. Requires maintaining two identical schemas, leading to inevitable divergence and runtime crashes if one application forgets to update a variable.

3. **Option 3: Extract into a dedicated internal workspace package (`packages/env`)**
   - *Pros:* Forces the TypeScript compiler to treat it as a standard external `node_modules` dependency. Perfectly preserves the `dist/main.js` output structure. Integrates natively with `turbo prune` for highly optimized Docker builds.
   - *Cons:* Requires maintaining an extra `package.json` and ensuring monorepo tooling (linting, formatting, typechecking) targets the new package correctly.

## Decision

We chose **Option 3: Extract into a dedicated internal workspace package (`@bnr-portal/env`)**.

## Consequences

### Benefits

- **Clean Compilation Outputs**: NestJS and Next.js compilers output their exact expected structures (`dist/main.js` and `.next/`) without relative path bleeding.
- **Optimized Docker Builds**: `turbo prune` natively handles extracting this shared package into the Docker build context without requiring messy, manual `COPY` instructions in the Dockerfiles.
- **Strict Enforcement**: By extracting it to a package, we easily bundled the `validateEnvironment` helper and the CLI wizard (`pnpm env:generate`) into the same isolated domain.
- **Blueprint for the Future**: We now have a standard, tested pattern for creating future shared libraries (e.g., UI components, shared DTOs).

### Limitations

- **Maintenance Overhead**: Requires managing a separate `package.json`, `tsconfig.json`, and ensuring global monorepo CI scripts (`lint`, `format`) correctly target the `packages/env` directory symmetrically.
