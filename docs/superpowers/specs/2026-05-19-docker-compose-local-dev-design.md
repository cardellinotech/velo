# Docker Compose Local Development — Design Spec

**Date:** 2026-05-19  
**Status:** Approved

## Overview

Add a `docker-compose.yml` for local development that runs PostgreSQL and the Next.js app together, with automatic Drizzle migrations on startup and persistent database storage.

## Architecture

Three services in a fixed dependency chain:

```
postgres (healthcheck)
    └─> migrate (drizzle-kit push, one-shot)
            └─> app (npm run dev, port 3003)
```

### Services

**postgres**
- Image: `postgres:17-alpine`
- Exposes port `5432` internally only (no host port binding needed)
- Named volume `velo_pgdata` for data persistence
- Healthcheck: `pg_isready` — blocks downstream services until ready

**migrate**
- Image: `node:22-alpine`
- Mounts source code from host + anonymous volume for `node_modules`
- Runs: `npm install && npx drizzle-kit push`
- `restart: "no"` — exits after successful migration
- `depends_on: postgres: condition: service_healthy`

**app**
- Image: `node:22-alpine`
- Same volume setup as migrate (shares node_modules anonymous volume)
- Runs: `npm run dev`
- Port `3003:3003` mapped to host
- `depends_on: migrate: condition: service_completed_successfully`

## Environment Variables

New file `.env.docker` (not committed, added to `.gitignore`):

```env
POSTGRES_USER=velo
POSTGRES_PASSWORD=velo
POSTGRES_DB=velo
DATABASE_URL=postgresql://velo:velo@postgres:5432/velo
AUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3003
```

- Both `migrate` and `app` use `env_file: .env.docker`
- `.env.docker.example` is committed as a template
- The existing `.env` remains unchanged (points to `192.168.2.90` for direct non-Docker use)

## node_modules Handling

The host's `node_modules` (macOS binaries) must not bleed into the container (Linux binaries). Solution via named volume:

```yaml
volumes:
  - .:/app                              # Host source code
  - velo_node_modules:/app/node_modules # Named volume shadows host node_modules
```

Named volume `velo_node_modules` is shared between `migrate` and `app`: `migrate` runs `npm install` once, `app` reuses the result. Anonymous volumes can't be shared between containers — the named volume is required here.

## Hot-Reload

Source code is mounted live from the host via `.:/app`. File changes on the Mac are immediately visible inside the container. Next.js HMR reacts normally.

## Startup Behavior

- **First start:** `npm install` runs inside the container (~1-2 min). Subsequent starts are fast — the anonymous node_modules volume persists.
- **Migrations:** `drizzle-kit push` runs on every startup. Safe to run repeatedly (idempotent).
- **Data persistence:** `docker compose down` keeps `velo_pgdata`. Only `docker compose down -v` destroys it.

## Files Changed / Added

| File | Action |
|------|--------|
| `docker-compose.yml` | Create |
| `.env.docker.example` | Create |
| `.gitignore` | Update — add `.env.docker` |

## Named Volumes

| Volume | Purpose |
|--------|---------|
| `velo_pgdata` | PostgreSQL data, persists across restarts |
| `velo_node_modules` | Shared Linux node_modules between migrate and app |

The existing `Dockerfile` (production multi-stage build) is untouched.
