---
name: prisma-schema
description: Guide for Prisma schema definition, migrations, and database patterns in apps/api. Use when creating models, relations, enums, indexes, or running migrations for PostgreSQL database.
---

# Prisma Schema Guide

## Architecture

```
apps/api/src/infrastructure/prisma/
├── schema/                    # Multi-file schema
│   ├── schema.prisma          # Generator + datasource config
│   ├── {feature}.prisma       # Feature-specific models
│   └── master-data.prisma     # Master data models
├── migrations/                # Manual migration files
├── prisma.service.ts          # Prisma client service
├── error-mapping.ts           # prismaError() utility
└── extensions/
    └── pagination.extension.ts
```

## Model Conventions

```prisma
/// リソースの説明（日本語）
model Resource {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  name       String                         /// 名前
  status     ResourceStatus @default(draft) /// ステータス
  startDate  DateTime @db.Date              /// 開始日
  memo       String?                        /// メモ

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  items      ResourceItem[]
  customer   Customer  @relation(fields: [customerId], references: [id], onDelete: Restrict)
  customerId String    @db.Uuid

  @@unique([code])
  @@index([customerId])
  @@map("resources")   // Always snake_case
}
```

**Rules:**
- ID: Always UUID with `@default(dbgenerated("gen_random_uuid()"))` — never autoincrement
- Field comments: Use `/// 日本語` doc comments
- `@@map("snake_case_table_name")` is required on every model
- `@@index` on every FK column
- Date-only fields: `DateTime @db.Date`
- `onDelete`: `Cascade` for owned children, `Restrict` for referenced masters

## Migration Policy (MANDATORY)

### Pre-Production: Edit Existing Migrations

**This project has NOT launched to production.** The DB can always be reset.

- **DO NOT** create ALTER TABLE / ADD COLUMN migrations for existing tables
- **Instead**, edit the original migration file, then `make db-reset`

| Scenario | Action |
|----------|--------|
| Modify existing table (add/remove/rename column, index, constraint) | **Edit** the original migration |
| Add new enum value | **Edit** the migration that defined the enum |
| Create an entirely new table | **Create** a new migration file |

### AI Agent Workflow

**NEVER** use `prisma migrate dev` or `make db-migrate-create`. Always create/edit migration SQL manually.

**Steps for new tables:**
1. Edit `.prisma` schema files
2. Create migration directory: `YYYYMMDDHHMMSS_{description}/migration.sql`
3. Write CREATE TABLE / CREATE TYPE SQL manually
4. `make db-migrate` → `make db-generate`

**Steps for modifying existing tables:**
1. Edit `.prisma` schema files
2. Edit the existing `migration.sql` that created the table
3. `make db-reset` → `make db-generate` → `make db-seed`

### Migration Granularity

Split by logical unit — never pack everything into one migration.

| Unit | Content | Example |
|------|---------|---------|
| Main entity | Primary table + enums | `booking` |
| Sub-entities | 1:1 child tables | `booking_sub_entities` |
| Auxiliary | Comments, files | `booking_comment` |
| Audit | History tables | `booking_operation_history` |

Use sequential timestamps to express FK dependency order.

### Naming Convention

Format: `YYYYMMDDHHMMSS_{description}` (e.g., `20260207000016_booking`)

## Error Handling

Use `prismaError()` from `infrastructure/prisma/error-mapping`:

```typescript
import { prismaError } from '../../../infrastructure/prisma/error-mapping'

return await this.prisma.resource
  .create({ data })
  .catch((err) => {
    throw prismaError(err, {
      UniqueConstraint: { code: 'Code already exists' },
      ForeignKeyConstraint: 'Customer not found',
    })
  })
```

For `findUniqueOrThrow`, map `NotFoundException`.

## Seed Data

Location: `apps/api/src/interfaces/cli/seed/`

**Rules:**
- File: `XX.{feature}.seed.ts` (sequential numbering for dependency order)
- Function: `seed{Model}(prisma: PrismaService)` — no return value
- Fetch related records with `findFirstOrThrow` inside the seed
- Use realistic Japanese sample data
- Register in `seed/index.ts` (call in dependency order)

## Implementation Checklist

1. [ ] Create/update `schema/{feature}.prisma`
2. [ ] Add `@@map`, `@@index`, proper relations
3. [ ] Create or edit migration SQL (follow Migration Policy above)
4. [ ] `make db-migrate` (or `make db-reset` if editing existing migration)
5. [ ] `make db-generate`
6. [ ] Update domain entity in `packages/domain`
7. [ ] Create seed file and register in `seed/index.ts`
