# Catdoku

Catdoku is a small, advertisement-free browser logic game based on the general puzzle pattern “one marker per row, column, and region, with markers not touching.”

This repository is intended to be implemented according to [`SPEC.md`](SPEC.md).

## Rules

Place exactly one cat:
- in every row
- in every column
- in every colored region

Cats may not touch, including diagonally.

Cells can be marked as empty, excluded (`X`), or cat.

## Project goals

Catdoku is designed to be small, fast, mobile-friendly, privacy-friendly, self-hosted, independent of third-party services, and free of ads and tracking.

## Planned stack

- TypeScript
- Vite
- Vanilla browser APIs
- CSS Grid
- Vitest
- Nginx
- Docker

## Development

The implementation should ultimately support:

```bash
npm ci
npm run dev
```

Quality gates:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

## Deployment target

```text
Internet
  |
Host Nginx + TLS
  |
127.0.0.1:3002
  |
Catdoku Docker container
```

Typical server path: `/opt/apps/catdoku`.

The host reverse proxy can later expose the app as `catdoku.vier99.de`.

## Specification

See [`SPEC.md`](SPEC.md). Instructions for coding agents are in [`AGENTS.md`](AGENTS.md).

## Independence

Catdoku is intended as an original implementation. Do not copy code, assets, branding, screenshots, level data, or text from Meowdoku or another commercial puzzle app.
