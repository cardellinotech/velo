# Docker Compose Local Dev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `docker-compose.yml` that starts PostgreSQL + the Next.js app in dev mode with automatic Drizzle migrations and persistent DB storage.

**Architecture:** Three services in a fixed chain — `postgres` (with healthcheck) → `migrate` (one-shot `drizzle-kit push`) → `app` (`npm run dev`). A named volume `velo_node_modules` is shared between `migrate` and `app` so `npm install` runs once in `migrate` and is reused by `app`. A second named volume `velo_pgdata` persists PostgreSQL data across restarts.

**Tech Stack:** Docker Compose v2, PostgreSQL 17 Alpine, Node 22 Alpine, Drizzle Kit, Next.js 16.2

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `docker-compose.yml` | Create | Defines all three services, volumes, env wiring |
| `.env.docker.example` | Create | Template for local dev env vars |
| `.gitignore` | No change | `.env*` already ignores `.env.docker` |

---

### Task 1: `.env.docker.example` erstellen

**Files:**
- Create: `.env.docker.example`

- [ ] **Step 1: Datei erstellen**

Erstelle `.env.docker.example` im Projektstamm mit folgendem Inhalt:

```env
POSTGRES_USER=velo
POSTGRES_PASSWORD=velo
POSTGRES_DB=velo
DATABASE_URL=postgresql://velo:velo@postgres:5432/velo
AUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3003
```

- [ ] **Step 2: Lokale `.env.docker` Kopie anlegen**

```bash
cp .env.docker.example .env.docker
```

> Hinweis: `.env.docker` wird durch `.env*` in `.gitignore` nicht committet. `.env.docker.example` hingegen wird committet.

- [ ] **Step 3: Committen**

```bash
git add .env.docker.example
git commit -m "feat: add .env.docker.example for local docker dev"
```

---

### Task 2: `docker-compose.yml` erstellen

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: `docker-compose.yml` erstellen**

Erstelle `docker-compose.yml` im Projektstamm mit folgendem Inhalt:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    env_file: .env.docker
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - velo_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  migrate:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - .:/app
      - velo_node_modules:/app/node_modules
    env_file: .env.docker
    command: sh -c "npm install && npx drizzle-kit push"
    depends_on:
      postgres:
        condition: service_healthy
    restart: "no"

  app:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - .:/app
      - velo_node_modules:/app/node_modules
    env_file: .env.docker
    command: npm run dev
    ports:
      - "3003:3003"
    depends_on:
      migrate:
        condition: service_completed_successfully

volumes:
  velo_pgdata:
  velo_node_modules:
```

**Designentscheidungen:**
- `env_file: .env.docker` auf allen 3 Services — `postgres` braucht `POSTGRES_USER/PASSWORD/DB` für den Healthcheck, `migrate` und `app` brauchen `DATABASE_URL`
- `restart: "no"` für `migrate` — explizit, damit Docker den Service nicht nach Abschluss neu startet
- `condition: service_completed_successfully` — `app` startet erst wenn `migrate` mit Exit-Code 0 endet
- `velo_node_modules` als named volume — anonymous volumes können nicht zwischen Containern geteilt werden; named volume ermöglicht dass `migrate`'s `npm install` von `app` wiederverwendet wird

- [ ] **Step 2: YAML-Syntax validieren**

```bash
docker compose config
```

Erwartete Ausgabe: Aufgelöste YAML-Konfiguration ohne Fehler. Falls `.env.docker` fehlt, kommt ein Hinweis — dann Task 1 zuerst abschließen.

- [ ] **Step 3: Committen**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose for local development"
```

---

### Task 3: Erster Start und Verifikation

**Files:** keine Änderungen

- [ ] **Step 1: Stack starten (erster Start, dauert ~2 Min wegen npm install)**

```bash
docker compose up
```

Erwarteter Log-Ablauf:
1. `postgres` startet, Healthcheck wird grün
2. `migrate` startet, `npm install` läuft (~60-90s), dann `drizzle-kit push` — Output zeigt welche Tabellen erstellt werden
3. `migrate` endet mit Exit Code 0
4. `app` startet, `next dev` Ausgabe erscheint mit `✓ Ready in Xms`

- [ ] **Step 2: App erreichbar prüfen**

Browser öffnen: `http://localhost:3003`

Erwartung: Login-Seite von Velo erscheint.

- [ ] **Step 3: Hot-Reload prüfen**

Eine beliebige `.tsx`-Datei im `src/`-Verzeichnis minimal editieren (z.B. Leerzeichen hinzufügen und speichern). Im Terminal sollte Next.js HMR auslösen:

```
○ Compiling ...
✓ Compiled in Xms
```

Seite im Browser aktualisiert sich automatisch.

- [ ] **Step 4: DB-Persistenz prüfen**

```bash
docker compose down
docker compose up
```

Erwartung: `migrate` läuft erneut (`drizzle-kit push` ist idempotent — meldet keine Schema-Änderungen), Daten in der DB sind erhalten.

- [ ] **Step 5: Committen (falls Anpassungen nötig waren)**

```bash
git add -p
git commit -m "fix: adjust docker-compose after first-run verification"
```

Nur committen falls tatsächlich Fixes nötig waren.
