---
name: environment-setup
description: Guide for setting up the development environment and running tests. Use when setting up the project for the first time, running API tests, or running E2E tests.
---

# Environment Setup and Test Execution Guide

## Overview

This guide covers the complete setup process from fresh clone to running tests.
Supports both Docker-based (local dev) and Docker-free (cloud agent) environments.

## Quick Start

### Local Development (with Docker)

```bash
make docker-start   # Start PostgreSQL + Firebase Emulator
make setup          # Copy .env, install deps, generate Prisma
make db-seed        # Reset DB and seed data
make dev            # Start API + Web dev servers
```

### Cloud Agent / Docker-Free Setup

```bash
make setup-install  # Full setup without Docker
```

This command (`scripts/setup-install.sh`) performs:
- Checks prerequisites (Node.js >= 22, pnpm, PostgreSQL)
- Copies `.env.sample` to `.env` for all apps
- Installs pnpm dependencies
- Starts PostgreSQL (tries pg_ctlcluster, systemctl, brew, pg_ctl)
- Creates PostgreSQL user (`root`) and databases (`api_development`, `api_test`)
- Starts Firebase Emulator (Docker if available, otherwise native with Java + firebase-tools)
- Generates Prisma client and runs migrations
- Builds all packages

### Database-Only Setup

```bash
make setup-db       # Just PostgreSQL user, databases, and migrations
```

## Running API Tests

```bash
make test-api                                   # Run all API tests
make test-api path=staff/sales/bookings.spec.ts # Run specific test file
make test-api-name name="should create booking" # Run tests by name
make test-db-setup                              # Reset test database
```

## Running E2E Tests

### Full E2E Setup (Recommended for Cloud Agents)

```bash
make setup-e2e
```

This command (`scripts/setup-e2e.sh`) performs:
1. Runs base setup if `node_modules` doesn't exist
2. Starts PostgreSQL and Firebase Emulator (Docker or native)
3. Creates `.env` files with E2E credentials (`e2e@bus-kaku.com`)
4. Resets DB and seeds test data
5. Builds API and Web applications
6. Installs Playwright Chromium browser

After setup, start servers and run tests:

```bash
# Option A: Use dev servers
make dev            # In one terminal
make test-e2e       # In another terminal

# Option B: Use built servers (faster startup)
(cd apps/api && set -a && . .env && node dist/main) &
(cd apps/web && set -a && . .env && node_modules/.bin/next start --port 8080) &
make test-e2e
```

### E2E Test Commands

| Command | Description |
|---------|-------------|
| `make test-e2e` | Run all E2E tests (headless) |
| `make test-e2e-headed` | Run with browser visible |
| `make test-e2e-ui` | Run in Playwright UI mode |

## Prerequisites

- Node.js >= 22
- pnpm (package manager)
- PostgreSQL 16 (Docker or native)
- Firebase Emulator (Docker or Java + firebase-tools)

## Infrastructure

### With Docker (Local Development)

```bash
make docker-start   # Start PostgreSQL + Firebase Emulator
make docker-stop    # Stop services
```

### Without Docker (Cloud Agent)

PostgreSQL:
```bash
# Start PostgreSQL
sudo systemctl start postgresql
# or: sudo pg_ctlcluster <version> main start
# or: brew services start postgresql@16

# Verify
pg_isready -h localhost -p 5432
```

Firebase Emulator:
```bash
# Install prerequisites
sudo apt-get install -y default-jre-headless
npm install -g firebase-tools

# Start emulator
cd middleware/firebase-emulator
firebase emulators:start --only auth,storage --project bus-kaku-local &

# Verify
curl -sf http://localhost:9099/
```

## Environment Variables

### apps/api/.env
```
DATABASE_URL="postgres://root:password@localhost:5432/api_development"
API_PORT=3000
API_BASE_URL=http://localhost:3000
WEB_FRONT_BASE_URL=http://localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_EMAIL=<seed user email>
FIREBASE_PASSWORD=<seed user password>
GCP_PROJECT_ID=bus-kaku-local
```

### apps/web/.env
```
API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### e2e/.env
```
BASE_URL=http://localhost:8080
LOGIN_EMAIL=<same as FIREBASE_EMAIL>
LOGIN_PASSWORD=<same as FIREBASE_PASSWORD>
```

## All Commands Summary

| Command | Description |
|---------|-------------|
| `make setup` | Basic setup (copy .env, install deps) |
| `make setup-install` | Full setup without Docker |
| `make setup-db` | Database-only setup |
| `make setup-e2e` | E2E test environment setup |
| `make docker-start` | Start Docker services |
| `make dev` | Start dev servers |
| `make test-api` | Run API tests |
| `make test-e2e` | Run E2E tests |
| `make db-seed` | Reset DB and seed data |
| `make db-reset` | Reset DB (no seed) |
| `make test-db-setup` | Reset test database |

## Troubleshooting

If setup or tests fail, refer to the `environment-setup-troubleshooting` skill for detailed error resolution.

Common issues:
- PostgreSQL not running → `make setup-db` or `make docker-start`
- Firebase Emulator not running → Check Java installation or use Docker
- User authentication failed → Check PostgreSQL user/password
- Module not found → Run `pnpm build`
- E2E tests fail with auth error → Verify `e2e/.env` credentials match `apps/api/.env`
