# AGENTS.md

## Purpose

This repository contains Catdoku, a small browser logic game. `SPEC.md` is the authoritative product and engineering specification. Read it in full before making changes.

## Core rules for agents

1. Follow `SPEC.md`.
2. Keep the implementation small.
3. Do not add unrelated features.
4. Do not copy third-party game code, puzzle data, branding, screenshots, visual assets, or text.
5. Keep game-engine logic independent from the DOM.
6. Prefer pure functions.
7. Prefer zero runtime dependencies.
8. Do not introduce a frontend framework.
9. Do not hard-code one board size.
10. Do not store or rely on a hidden solution for gameplay.
11. Generated and built-in puzzles must have exactly one solution.
12. Do not weaken tests merely to make them pass.
13. Never disable linting or type checking to work around an issue.
14. Keep changes easy to review.

## Working method

For substantial changes:
1. inspect existing code
2. state a concise plan
3. implement the smallest coherent slice
4. add/update tests
5. run tests immediately
6. continue only when the slice works
7. run all quality gates before completion

Do not perform large speculative rewrites.

## Architecture boundaries

### `src/game/`

Contains model types, rules, state logic, solver, validator, generator, and deterministic random utilities. It must not access the DOM, use browser UI APIs, or import from `src/ui/`.

### `src/ui/`

May render state, bind events, display conflicts, and update controls. It must not duplicate solver logic or authoritative rules.

### `src/puzzles/`

Contains original puzzle definitions only. Every committed puzzle must pass uniqueness validation.

## Solver

Enforce one cat per row, column, and region plus no touching including diagonals. Prefer one selected column per row. `countSolutions(puzzle, 2)` must stop after two solutions. Correctness beats micro-optimization.

## Generator

Must support deterministic seeds, create valid placements, create exactly `size` orthogonally connected regions, put exactly one solution cat in each region, validate uniqueness with the solver, retry non-unique constructions, and fail descriptively after `maxAttempts`.

Do not implement a fake generator returning fixed puzzles.

## Tests

Use Vitest. Game-logic changes require tests. Solver changes require solvable/unsolvable/unique/multiple cases. Generator changes require deterministic seed, connectivity, and uniqueness tests. Built-in puzzles must all be covered by validation tests. Avoid flaky timing assertions.

## Required quality gates

Before finishing:

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run build
```

Fix actual causes of failures; do not report success with known failures.

## Dependencies

First ask whether browser/TypeScript capabilities suffice. Expected dev dependencies are Vite, TypeScript, Vitest, ESLint, and Prettier. Runtime dependencies should ideally remain empty. Explain any runtime dependency in the PR summary.

## Style

Use descriptive names, small functions, explicit types where useful, immutable updates where practical, and clear errors. Avoid unnecessary classes, giant utility modules, deeply nested conditionals, magic constants, broad `any`, and assertions that hide type problems.

## UI

Must be original, mobile-first, responsive, accessible, usable without external resources, and tracking-free. Use CSS Grid. Do not imitate another game's exact styling.

## Privacy

Normal gameplay makes no third-party requests. Do not add analytics, telemetry, trackers, ads, external fonts, accounts, or cloud persistence. Use local browser storage only.

## Docker

Production runtime is Nginx serving static files. Node is build-time only. Compose binds `127.0.0.1:3002:80`.

## PR guidance

Prefer logical commits. Final summary should state what was implemented, architecture decisions, tests, exact verification commands, known limitations, and deliberate deviations from `SPEC.md`. Do not claim unimplemented features.

## Stop conditions

Stop and explain rather than guessing if a requirement requires copying proprietary content, repository instructions materially conflict, a dependency introduces tracking, secrets would be exposed, or unavailable infrastructure credentials are required.

For normal technical ambiguity choose the simplest reasonable interpretation and document it.

## Definition of agent success

Success means the implementation matches `SPEC.md`, tests cover behavior, quality gates pass, code remains understandable, and the app remains independently deployable.
