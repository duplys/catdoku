# Catdoku

A small, original browser logic game. Ten puzzles, a quiet interface, and no ads or tracking. Built with TypeScript, Vite, vanilla browser APIs, and CSS Grid. Production is static HTML/CSS/JS served by Nginx; there are **zero runtime npm dependencies**.

## Play

Place exactly one cat in every row, column, and bordered region. Cats cannot touch, including diagonally. Tap/click a cell to cycle **empty → × → cat → empty**. Conflicting moves remain visible with an outline, an exclamation mark, and a status explanation.

Tab moves between buttons. Arrow keys move between cells; Home/End move to the start/end of a row. Enter or Space cycles a cell. Undo and redo restore moves and completion timing. A new move clears redo. Restart clears the board, undo/redo history, and timer. Next puzzle cycles through the collection.

Progress, the selected puzzle, and timing persist in this browser. Undo/redo history is session-local. The timer includes time away from the page and freezes on completion. Changing puzzles starts a fresh board; only the current puzzle is saved. Storage failures show a notice and leave the game playable.

**Screenshot:** run `npm run dev`, open the page at desktop and phone viewport sizes, and capture the board with browser developer tools. The interface uses original inline SVG cats and local system fonts.

## Development

Node.js 22.13+ (or 24+) and npm are required by the development tooling.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). To inspect the static production build:

```bash
npm run build
npm run preview
```

## Verification

Every required quality gate must pass:

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run build
```

`npm run build` includes strict TypeScript checking. `npm run format` formats code; repository instructions and the authoritative specification are deliberately preserved as supplied. `npm run test:watch` starts Vitest in watch mode.

Tests cover each conflict rule, completion, immutable moves, exact undo/redo, the solver, invalid and non-unique puzzles, every built-in, deterministic generation, connected regions, generation exhaustion, storage corruption, and elapsed time. Generator tests cover all sizes 5–11 without fragile timing assertions.

For a browser check, verify desktop and phone widths: cell cycling, visible conflicts, keyboard focus/navigation, undo/redo, restart, puzzle selection, completion, next puzzle, and persistence after refresh. Also try disabled storage, corrupt saved data, and a 9×9 board at phone width. Inspect the production page's Network panel: every request should be to the app's origin; there should be no cookies or requests during ordinary moves.

## Architecture

- `src/game/`: pure rules, model, state, solver, structural validation, seeded random utilities, and generator. No DOM or UI imports. ESLint enforces this boundary.
- `src/ui/`: board rendering, controls, status/timing, SVG icons, and storage validation/recovery.
- `src/puzzles/`: ten original static puzzle definitions, all uniqueness-tested. No stored answers.
- `src/app.ts`: connects engine state to browser events. Cell elements stay in place during moves to preserve focus; only the board is rebuilt when changing puzzles.
- `tests/`: Vitest tests that run without a browser.
- `nginx/`, `Dockerfile`, `docker-compose.yml`: static production deployment.

Gameplay checks the four rules directly. It never compares moves with a hidden answer. The built-in collection is validated on startup and rejected safely if invalid. The generator is a separate engine API and does not run during gameplay.

## Puzzle format

```ts
interface Puzzle {
  id: string;
  title?: string;
  size: number;
  regions: number[][];
  difficulty?: 'easy' | 'medium' | 'hard';
  seed?: string;
}
```

`size` is an integer from 5 through 11. `regions` is a square matrix containing exactly `size` distinct integer region IDs. IDs need not be contiguous. Every region must be orthogonally connected. A valid puzzle has exactly one solution. Use `validatePuzzle(puzzle)` before committing a new definition and add it to the automated collection test.

The built-ins were constructed offline using original randomized growth from non-touching cat placements, then checked by the TypeScript validator. They span 5×5–9×9, with four easy, four medium, and two hard manual labels. These labels are informal, mostly based on board size; they are not a rigorous measure of logical difficulty. No third-party puzzle data was used.

## Solver and validator

```ts
import { solvePuzzle, countSolutions } from './src/game/solver';
import { validatePuzzle } from './src/game/validator';

const solution = solvePuzzle(puzzle); // Position[] or null
const count = countSolutions(puzzle, 2); // 0, 1, or 2 (two means at least two)
const result = validatePuzzle(puzzle); // { valid, errors, solutionCount? }
```

The deterministic backtracking solver assigns one column per row, selecting the most constrained unassigned row. It tracks occupied columns and regions and checks touching against adjacent assigned rows. It stops immediately at the requested solution limit (default two). `Infinity` requests all solutions and can be expensive. Structural/connectivity validation is shared by the solver and validator in `src/game/structure.ts` to keep invalid input out of the search.

## Generator

```ts
import { generatePuzzle } from './src/game/generator';

const { puzzle, solution } = generatePuzzle({
  size: 7,
  seed: 'my-original-puzzle',
  maxAttempts: 1000,
});
```

The same seed and size produce identical output with this version of the algorithm. Unseeded calls retain their generated seed for reproducibility. A small FNV-1a/Mulberry32 PRNG drives shuffled backtracking placements and randomized orthogonal frontier growth. Per-region growth rates vary to encourage irregular shapes and reduce uniqueness retries. Each region starts at one cat, remains connected, and never consumes another cat's region. Non-unique boards are retried; budget exhaustion throws a descriptive error.

All sizes 5–11 are supported by the engine. Interactive generation is intentionally omitted, so generation cannot block normal gameplay. The returned solution is for tooling/tests and is never stored in built-in data or used for gameplay. Optional hints are also omitted.

## Docker

```bash
docker compose up -d --build
curl -I http://127.0.0.1:3002/
docker compose logs catdoku
docker compose down
```

The multi-stage Dockerfile builds with Node 22 and runs only Nginx. Compose binds **`127.0.0.1:3002:80`**, leaving public access to the host reverse proxy. The container serves fingerprinted assets with immutable cache headers, HTML with revalidation, and security headers including a restrictive content policy. Unknown paths return 404.

If your development environment uses a trusted TLS interception proxy, the build accepts an optional BuildKit CA secret, without copying it into an image layer:

```bash
docker build --secret id=proxy_ca,src=/path/to/proxy-ca.pem -t catdoku .
```

Ordinary self-hosted builds do not need this secret. Preserve your environment's configured proxy settings and keep TLS verification enabled.

## Hetzner deployment

Prerequisites: a Linux VPS with Docker Engine and the Compose plugin, host Nginx, and a DNS record for `catdoku.vier99.de` pointing to the server. Do not commit server addresses, credentials, or secrets.

Use `/opt/apps/catdoku` as the application directory:

```bash
sudo mkdir -p /opt/apps
sudo chown "$USER":"$USER" /opt/apps
cd /opt/apps
git clone https://github.com/duplys/catdoku.git
cd catdoku
docker compose up -d --build
curl -I http://127.0.0.1:3002/
```

Because this repository is private, use your own authorized Git credentials on the server; do not place tokens in clone URLs or configuration files committed to Git.

Create `/etc/nginx/sites-available/catdoku` on the **host**:

```nginx
server {
    listen 80;
    server_name catdoku.vier99.de;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and check it:

```bash
sudo ln -s /etc/nginx/sites-available/catdoku /etc/nginx/sites-enabled/catdoku
sudo nginx -t
sudo systemctl reload nginx
```

### TLS (separate host setup)

For Debian/Ubuntu, install Certbot and its Nginx plugin using the supported packages for your distribution, then:

```bash
sudo certbot --nginx -d catdoku.vier99.de
sudo certbot renew --dry-run
```

Permit ports 80 and 443 in the host/cloud firewall, keep port 3002 bound to localhost, and ensure automatic certificate renewal is enabled. The app container does not handle TLS or reverse proxying.

For updates, pull the desired reviewed revision in `/opt/apps/catdoku` and run `docker compose up -d --build`. Keep a known-good Git revision for rollback and rebuild that revision if needed.

## Privacy and independence

Normal gameplay makes no third-party requests. There are no analytics, trackers, advertisements, cookies, accounts, external fonts, APIs, cloud saves, or server-side game logic. A versioned localStorage key (`catdoku:v1:game-state`) stores only the selected puzzle ID, marks, and timing. Clear that key or this site's browser storage to erase progress. Standard host Nginx access logs, if enabled by the operator, are a hosting setting rather than game telemetry.

Catdoku is an independent original implementation of the general one-marker-per-row/column/region, no-touching puzzle family. It uses no Meowdoku code, assets, branding, screenshots, text, or puzzle sets.

Product and engineering requirements are in [SPEC.md](SPEC.md); contributor instructions are in [AGENTS.md](AGENTS.md).
