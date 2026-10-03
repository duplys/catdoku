# Catdoku — Product & Engineering Specification

## 1. Purpose

Catdoku is a small, advertisement-free, privacy-friendly browser puzzle game inspired by the general “one marker per row/column/region, no-touching” logic-puzzle family.

The implementation must be original:
- Do not copy Meowdoku source code, assets, branding, level data, screenshots, sounds, or text.
- Do not use the name “Meowdoku” in the product UI.
- Do not scrape or reproduce third-party puzzle sets.
- Use only original code, original visual assets, and generated or hand-authored original puzzles.

The application is intended to be self-hosted on a Hetzner VPS and served via Docker + Nginx. It must work well on desktop and mobile browsers.

The first release should be intentionally small, robust, testable, and easy to maintain.

## 2. Primary goals

Version 1 must provide:

1. Responsive single-player puzzle UI.
2. Square board divided into irregular connected colored regions.
3. Exactly one cat per row.
4. Exactly one cat per column.
5. Exactly one cat per region.
6. Cats may not touch, including diagonally.
7. Cell states: empty, excluded/X, cat.
8. Undo and redo.
9. Restart puzzle.
10. Automatic completion detection.
11. Immediate rule-conflict detection.
12. At least 10 original puzzles.
13. Solver that can count solutions.
14. Puzzle validation including uniqueness checking.
15. Generator capable of creating valid unique puzzles.
16. Unit tests for rules, solver, generator, validator, and state transitions.
17. Static production build.
18. Docker image using Nginx.
19. Documentation for local development and Hetzner deployment.
20. No ads, analytics, cookies, accounts, external APIs, or trackers.

## 3. Non-goals for Version 1

Do not implement user accounts, cloud saves, multiplayer, leaderboards, paid features, ads, push notifications, server-side database/game logic, external APIs, social login, daily-puzzle backend, sharing backend, complex animation frameworks, or a frontend framework unless technically necessary and documented. Keep Version 1 simple.

## 4. Technology stack

Use Node.js 22+, TypeScript, Vite, vanilla browser APIs, CSS Grid, Vitest, ESLint, and Prettier. Avoid a frontend framework. Production output must be static HTML/CSS/JS.

The game engine, solver, validator, and generator must be independent of the browser UI.

## 5. Repository layout

Prefer:

```text
catdoku/
├── AGENTS.md
├── SPEC.md
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── .prettierrc
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── nginx/default.conf
├── public/favicon.svg
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── styles/main.css
│   ├── game/
│   │   ├── types.ts
│   │   ├── rules.ts
│   │   ├── state.ts
│   │   ├── solver.ts
│   │   ├── validator.ts
│   │   ├── generator.ts
│   │   └── random.ts
│   ├── ui/
│   │   ├── board.ts
│   │   ├── controls.ts
│   │   ├── status.ts
│   │   └── icons.ts
│   └── puzzles/
│       ├── index.ts
│       └── builtins.ts
└── tests/
    ├── rules.test.ts
    ├── state.test.ts
    ├── solver.test.ts
    ├── validator.test.ts
    └── generator.test.ts
```

Small justified deviations are acceptable.

## 6. Domain model

```ts
export interface Position {
  row: number;
  col: number;
}

export type CellMark = "empty" | "excluded" | "cat";

export interface Puzzle {
  id: string;
  title?: string;
  size: number;
  regions: number[][];
  difficulty?: "easy" | "medium" | "hard";
  seed?: string;
}
```

Puzzle invariants:
- `regions.length === size`
- every region row has length `size`
- region IDs are integers
- exactly `size` distinct region IDs
- every region is orthogonally connected
- every cell belongs to one region

A solution must not be required for gameplay.

Suggested state:

```ts
export interface GameState {
  puzzle: Puzzle;
  marks: CellMark[][];
  history: CellMark[][][];
  future: CellMark[][][];
  startedAt: number;
  completedAt?: number;
}
```

The representation may be improved while remaining readable/testable.

## 7. Game rules

A completed board is valid iff:

A. Every row contains exactly one cat.
B. Every column contains exactly one cat.
C. Every region contains exactly one cat.
D. No two cats occupy neighboring cells, including diagonals.

For distinct cats `a` and `b`, they touch when:

```ts
Math.abs(a.row - b.row) <= 1 &&
Math.abs(a.col - b.col) <= 1
```

Encode the rule directly.

## 8. Interaction

Default tap/click cycle:

```text
empty -> excluded -> cat -> empty
```

Right-click-to-X and keyboard shortcuts are optional.

Conflicting moves must be allowed rather than silently prevented. Keep the mark, highlight conflicts, and show a concise status.

## 9. Visual design

Create an original, modern, minimal, calm, mobile-first design. Do not imitate Meowdoku's exact identity.

Use CSS Grid. Give each region a soft background color and a clear boundary; never rely on color alone. Use an original inline SVG cat or Unicode cat emoji. Render exclusions as a clear X.

Accessibility requirements: semantic buttons, aria-labels for cells, visible focus indicators, sufficient contrast, keyboard accessibility, and respect for prefers-reduced-motion.

## 10. Responsive behavior

Primary target is modern mobile browsers, especially iPhone-sized screens, plus tablet and desktop. Board remains square, fits viewport width, has no horizontal scrolling, and keeps usable touch targets.

Engine must support sizes 5x5 through 11x11 without hard-coding a size.

## 11. Rules engine

`src/game/rules.ts` exposes pure functions such as:

```ts
getCats(marks): Position[]
getRowCatCount(marks, row): number
getColumnCatCount(marks, col): number
getRegionCatCount(puzzle, marks, regionId): number
catsTouch(a, b): boolean
findConflicts(puzzle, marks): Conflict[]
isComplete(puzzle, marks): boolean
isValidPartialState(puzzle, marks): boolean
```

Suggested conflict types:

```ts
export type ConflictType = "row" | "column" | "region" | "touching";

export interface Conflict {
  type: ConflictType;
  cells: Position[];
}
```

No DOM access in `src/game/`.

## 12. State management

Required actions: set cell mark, cycle cell mark, undo, redo, restart.

Every user mutation is undoable. Undo restores exact prior state. Redo restores undone state. A new move after undo clears redo. Restart clears marks/history and completion state. Avoid state-management libraries.

## 13. Solver

Required API:

```ts
solvePuzzle(puzzle: Puzzle): Position[] | null
countSolutions(puzzle: Puzzle, limit?: number): number
```

`countSolutions(puzzle, 2)` must stop as soon as two solutions are known.

The solver must enforce all four rules, work without UI, be deterministic unless randomization is explicitly requested, use backtracking with pruning, support up to 11x11 in practical time for generated puzzles, and avoid brute-force enumeration of arbitrary cell subsets.

Recommended representation: assign one column per row; maintain used columns and regions; reject touching cats while assigning rows; use constrained ordering where useful.

Prefer clear correct backtracking over cleverness.

## 14. Puzzle validation

Required API:

```ts
export interface PuzzleValidationResult {
  valid: boolean;
  errors: string[];
  solutionCount?: number;
}

validatePuzzle(puzzle: Puzzle): PuzzleValidationResult
```

Validate size, square region matrix, exactly `size` distinct regions, non-empty regions, orthogonal connectivity, at least one solution, and exactly one solution. Use `countSolutions(puzzle, 2)`.

Built-in puzzles with zero or multiple solutions are invalid.

## 15. Puzzle generator

Suggested API:

```ts
export interface GeneratorOptions {
  size: number;
  seed?: string;
  maxAttempts?: number;
}

export interface GeneratedPuzzle {
  puzzle: Puzzle;
  solution: Position[];
}

generatePuzzle(options: GeneratorOptions): GeneratedPuzzle
```

Seeded generation must be reproducible using a small deterministic PRNG.

Generation strategy:

1. Generate a valid cat placement: one cat per row/column and no touching. This is a column permutation with consecutive row columns differing by more than 1; use backtracking if needed.
2. Construct exactly `size` orthogonally connected regions, seeded by solution cats. Grow regions via randomized frontier expansion, never merging two cat-containing regions, until every cell is assigned.
3. Validate with `countSolutions(puzzle, 2)`. Accept only exactly-one-solution puzzles; otherwise retry region generation.

For sizes 5-9 generation should normally complete within a few seconds on a development machine. 10-11 may be slower and need not be exposed interactively.

If `maxAttempts` is exhausted, throw a descriptive error.

## 16. Difficulty

Built-ins may be manually labeled easy/medium/hard. Do not claim rigorous difficulty scoring. A documented solver-branching heuristic is optional.

## 17. Built-in puzzles

Ship at least 10 original puzzles. Every puzzle must pass validation and have exactly one solution. At least two sizes must be represented. Do not copy puzzle data from other apps.

Preferred distribution: 4 easy, 4 medium, 2 hard.

## 18. Completion behavior

Detect completion immediately, show success and elapsed time, and provide restart and next-puzzle actions. No server call.

## 19. Persistence

Persist current puzzle ID, marks, and timing via localStorage using a versioned key such as `catdoku:v1:game-state`.

Store no analytics, identifiers, or personal data. Malformed/incompatible storage must be safely discarded.

## 20. Hint system

Optional for Version 1. If implemented, analyze the current partial state and return a logically safe placement/exclusion with a brief explanation. Do not reveal a stored answer and do not provide fake/random hints. Omit entirely if it makes V1 materially larger.

## 21. Testing

Use Vitest. All game logic must be testable without a browser.

Rules tests: row, column, region, horizontal/vertical/diagonal touching, non-conflicts, valid completion, incomplete board, conflicting partial state.

State tests: cycle behavior, undo, redo, redo clearing, restart, completion.

Solver tests: solvable, unsolvable, unique, multi-solution, early termination semantics, returned solution validity.

Validator tests: malformed dimensions, wrong region count, disconnected region, zero solution, multiple solutions, valid unique puzzle.

Generator tests: structural validity, connected regions, unique solution, solution validity, same-seed reproducibility, typical different-seed difference.

Every committed built-in puzzle must be validated by automated tests.

## 22. Quality gates

All must succeed:

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run build
```

Recommended scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

No TypeScript or lint errors.

## 23. Dependency policy

Keep dependencies minimal. Prefer zero runtime dependencies. Expected development dependencies: Vite, TypeScript, ESLint, Prettier, Vitest. Do not add UI kits, CSS frameworks, state frameworks, utility mega-libraries, or analytics SDKs without documented need.

## 24. Docker

Use a multi-stage build:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

Node.js must not be required at runtime.

## 25. Nginx container

Serve static assets and index.html, use sensible cache headers for fingerprinted assets, avoid aggressive caching of index.html, and add basic appropriate security headers. No reverse proxy inside the app container.

Target topology:

```text
Internet
   |
Host Nginx / TLS
   |
localhost:3002
   |
Catdoku container :80
```

## 26. Docker Compose

Provide:

```yaml
services:
  catdoku:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3002:80"
```

Bind to localhost because host Nginx is the public entry point.

## 27. Hetzner deployment documentation

README must document a deployment path such as `/opt/apps/catdoku` and:

```bash
git clone <repo>
cd catdoku
docker compose up -d --build
```

Include an example host Nginx virtual host for `catdoku.vier99.de` proxying to `http://127.0.0.1:3002`. Document TLS/Certbot separately. Never store VPS IPs or secrets.

## 28. Privacy and security

Normal gameplay makes no third-party requests. No trackers, ad networks, cookies, personal-data collection, accounts, backend, or external fonts. Use system fonts. The production page must work without access to external services.

## 29. Performance

Keep bundle small; no large images or runtime framework. Gameplay operations should feel immediate. Avoid unnecessary full-app re-renders. Solver/generator must not interfere with normal gameplay. A Web Worker for future interactive generation is optional, not required.

## 30. Error handling

Fail safely: reject invalid built-ins, reset corrupt localStorage, give descriptive generator exhaustion errors, and never crash the page due to impossible state. Avoid silent failures.

## 31. Logging

Do not spam production console. Development diagnostics are acceptable. Do not log localStorage contents or unnecessary user data.

## 32. README requirements

README must eventually cover: description, rules, screenshot placeholder/instructions, stack, architecture, development, tests, puzzle format, solver, generator, Docker, Hetzner deployment, privacy, and independence from Meowdoku code/assets/puzzles.

## 33. Implementation sequence

### Milestone 1 — skeleton
Vite TypeScript, lint/format/test setup, directories, Docker, minimal README. Acceptance: dev server starts, tests run, build succeeds.

### Milestone 2 — domain/rules
Types, rules, conflicts, completeness. Acceptance: rule tests pass.

### Milestone 3 — solver/validator
Backtracking solver, solution counting, structural/connectivity/uniqueness validation. Acceptance: solver and validator tests pass.

### Milestone 4 — game state
Marks, cycling, undo/redo, restart, completion. Acceptance: state tests pass.

### Milestone 5 — UI
Board, regions/borders, interaction, conflict styling, controls, status, responsive design. Acceptance: playable on desktop/mobile viewport.

### Milestone 6 — built-ins
At least 10 original unique puzzles. Acceptance: all validate uniquely in tests.

### Milestone 7 — generator
Seeded PRNG, solution placement, region generation, uniqueness retry. Acceptance: generator tests and deterministic seed tests pass.

### Milestone 8 — persistence/polish
localStorage, elapsed time, completion UI, next puzzle, accessibility. Acceptance: refresh preserves progress and completed state.

### Milestone 9 — deployment verification
Docker image and Compose work; production build makes no required third-party HTTP requests.

## 34. Definition of Done

Version 1 is done only when:
- [ ] `npm ci` succeeds from clean checkout
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] mobile and desktop board work
- [ ] state cycling, undo, redo, restart work
- [ ] all four rules are implemented
- [ ] conflicts are visible
- [ ] completion is detected
- [ ] solver and solution counting work
- [ ] validator rejects non-unique puzzles
- [ ] at least 10 original unique built-ins exist
- [ ] generator exists and supports deterministic seeds
- [ ] generated regions are connected and puzzles unique
- [ ] local progress persists
- [ ] no third-party network dependency, ads, analytics, or cookies
- [ ] Docker image and Compose work
- [ ] README explains Hetzner deployment
- [ ] code and assets are original

## 35. Implementation principles

Prefer pure functions, explicit types, deterministic tests, small modules, understandable algorithms, readable names, minimal dependencies, and correctness before optimization.

Avoid premature abstractions, duplicated rule logic, UI/solver coupling, giant files, hidden global state, unnecessary classes, mutable shared state, hard-coded board size, and hard-coded answers in gameplay.

## 36. Codex task

Implement Version 1 according to this specification.

Before coding:
1. read `AGENTS.md`
2. read all of `SPEC.md`
3. inspect the repository
4. produce a short implementation plan

Implement milestone by milestone. After each major milestone run relevant tests and fix failures.

Before declaring completion run:

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run build
```

Do not declare completion unless every command succeeds.

If a requirement is ambiguous, choose the simplest interpretation consistent with this specification, document the choice in the final summary, and do not add unnecessary scope.
