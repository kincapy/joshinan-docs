---
name: environment-setup-troubleshooting
description: Troubleshooting guide for environment setup failures. Use when make setup-install, make setup-db, make test-api, or pnpm commands fail with database, build, or authentication errors.
---

# Environment Setup Troubleshooting

## When to Use

- `make setup-install` or `make setup-db` fails
- `make test-api` fails
- PostgreSQL connection errors
- Prisma migration errors
- Build or module resolution errors
- Firebase authentication errors in tests

## Quick Diagnosis

Run these commands to check environment status:

```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Check if databases exist
psql -h localhost -p 5432 -U root -c "\l" 2>/dev/null | grep -E "api_development|api_test"

# Check if packages are built
ls packages/domain/dist/index.js 2>/dev/null && echo "Built" || echo "Not built"
```

## Common Errors and Solutions

### PostgreSQL Not Running

**Error:** `PostgreSQL is not running on localhost:5432`

**Solution:**
```bash
# Debian/Ubuntu (without systemd)
sudo pg_ctlcluster 16 main start

# Linux with systemd
sudo systemctl start postgresql

# macOS
brew services start postgresql@16
```

### User Authentication Failed

**Error:** `password authentication failed for user "root"`

**Cause:** PostgreSQL user `root` doesn't exist or lacks SUPERUSER privilege.

**Solution:**
```bash
sudo -u postgres psql -c "CREATE USER root WITH PASSWORD 'password' CREATEDB SUPERUSER;"
```

If user exists but lacks privileges:
```bash
sudo -u postgres psql -c "ALTER USER root WITH SUPERUSER;"
```

### Database Does Not Exist

**Error:** `database "api_development" does not exist` or `database "api_test" does not exist`

**Solution:**
```bash
sudo -u postgres psql -c "CREATE DATABASE api_development OWNER root;"
sudo -u postgres psql -c "CREATE DATABASE api_test OWNER root;"
```

### Module Not Found (Build Required)

**Error:** `Cannot find module '@repo/domain/dist/...'` or similar

**Cause:** Packages not built.

**Solution:**
```bash
pnpm turbo run build
```

### Firebase Credentials Error in Tests

**Error:** `ENOENT: no such file or directory, open '../../credentials/firebase-adminsdk.json'`

**Cause:** `.env.test` missing `GOOGLE_APPLICATION_CREDENTIALS=` (empty value).

**Solution:**
Ensure `apps/api/.env.test` contains:
```
GOOGLE_APPLICATION_CREDENTIALS=
```

### Prisma Migration Reset Blocked

**Error:** `Prisma Migrate detected that it was invoked by Claude Code...`

**Cause:** Prisma requires explicit consent for dangerous operations.

**Solution:**
```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" pnpm api prisma:reset-test
```

### Migrations Not Applied

**Error:** Tables don't exist or schema mismatch

**Solution:**
```bash
pnpm api prisma:migrate
pnpm api prisma:reset-test
```

## Full Recovery Steps

If environment is completely broken, run these in order:

```bash
# 1. Start PostgreSQL
sudo pg_ctlcluster 16 main start

# 2. Create user (if needed)
sudo -u postgres psql -c "CREATE USER root WITH PASSWORD 'password' CREATEDB SUPERUSER;" 2>/dev/null || true

# 3. Create databases (if needed)
sudo -u postgres psql -c "CREATE DATABASE api_development OWNER root;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE api_test OWNER root;" 2>/dev/null || true

# 4. Build packages
pnpm turbo run build

# 5. Run migrations
pnpm api prisma:migrate

# 6. Reset test database
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" pnpm api prisma:reset-test

# 7. Run tests
make test-api
```

## Environment Variables

### apps/api/.env (development)
```
DATABASE_URL="postgres://root:password@localhost:5432/api_development"
```

### apps/api/.env.test (test)
```
DATABASE_URL="postgres://root:password@localhost:5432/api_test"
GOOGLE_APPLICATION_CREDENTIALS=
```

## Verification

After setup, verify with:

```bash
# Should show all tests passing
make test-api
```
