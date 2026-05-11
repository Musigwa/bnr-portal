# 4. Unified CI/CD Pipeline & GitHub Composite Actions

## Status

Approved

## Context

When designing a CI/CD architecture for a Turborepo-based monorepo, there are two primary ways to structure GitHub Actions:

### 1. The Separated Workflows Approach (The alternative)

In this model, Continuous Integration (`ci.yml` triggered on `pull_request`) and Continuous Deployment (`cd.yml` triggered on `push` to `main`) are kept in entirely separate files.

* **Drawback - Pipeline Drift**: Both workflows require identical environment setup logic (Node installation, caching, dependency fetching). This causes massive YAML duplication, risking pipeline drift if one file is updated but the other is forgotten.
* **Drawback - Semantic Merge Blindspots**: If the CD workflow assumes the `main` branch is safe just because a PR passed CI, it risks deploying broken code caused by semantic conflicts between two simultaneously merged PRs. Re-running the CI quality gate inside the CD workflow fixes this, but drastically worsens the DRY violation.

### 2. The Unified Pipeline Approach (The choice)

In this model, a single `pipeline.yml` handles both `pull_request` and `push` events. A centralized `quality` job runs unconditionally for both events, while deployment jobs natively `need: quality` but possess strict conditional logic (`if: github.event_name == 'push'`) to prevent deployment during PRs.

## Decision

We have decided to adopt the **Unified Pipeline Approach** augmented with **GitHub Composite Actions**.

1. **Unified `pipeline.yml`**: We use a single workflow file to guarantee that the exact same rigorous quality gate (`pnpm verify:all`) runs against both PRs and the final merged commit on the `main` branch. This definitively eliminates semantic merge blindspots.
2. **GitHub Composite Actions**: All Node/pnpm/cache setup boilerplate is abstracted into a local composite action (`.github/actions/setup-node-env/action.yml`). This ensures the setup logic is defined exactly once.
3. **Turborepo Leverage**: Because we run the universal quality gate on `main` immediately after a PR merge, we rely on Turborepo's intelligent caching. The second validation run hits the cache for unaltered code, completing in seconds and rendering the compute cost of this "double check" virtually zero.

## Consequences

### Positive

* **Absolute DRYness**: There is zero duplicated YAML across the CI/CD lifecycle. Setup logic exists in one action; workflow logic exists in one pipeline.
* **Guaranteed Parity**: Deployments cannot occur unless the merged `main` branch mathematically passes the exact same validation rules as the isolated PRs.
* **Linear Visualization**: The GitHub Actions UI renders a clear, linear dependency graph showing deployments safely waiting behind the quality gate.

### Negative

* New developers must familiarize themselves with complex conditional job execution (`if: github.event_name == 'push'`) rather than viewing purely isolated, single-purpose workflow files.
