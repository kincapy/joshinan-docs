---
name: domain-definition
description: Guide for defining domain entities, value objects, and business logic in packages/domain. Use when creating new entities, enums, validation rules, or domain logic shared between API and Web.
---

# Domain Definition Guide

## When to Use

- Creating new domain entities
- Defining value objects (enums, validated types)
- Implementing business logic shared between API and Web
- Adding validation rules with Zod schemas

## Architecture Overview

The `packages/domain` package contains shared domain definitions used by both `apps/api` and `apps/web`.

```
packages/domain/src/
├── entity/               # Domain entities (Zod schemas)
│   └── {resource}.entity.ts
├── value-object/         # Value objects (enums, validated types)
│   └── {type}.vo.ts
└── logic/                # Business logic (calculations, validations)
    └── {feature}/
        └── {operation}.ts
```

## Entity Definition

### Basic Structure

```typescript
// entity/resource.entity.ts
import { z } from 'zod'
import { resourceStatus } from '../value-object/resource-status.vo'
import { resourceCategory } from '../value-object/resource-category.vo'

// Full entity schema with all fields
const schema = z.object({
  id: z.uuid(),
  customerId: z.uuid('顧客を選択してください'), // Custom error message

  // Required fields with validation
  name: z.string().min(1, '名前を入力してください'),
  status: resourceStatus.schema,
  category: resourceCategory.schema,

  // Date fields
  startDate: z.date(),
  endDate: z.date(),

  // Numeric fields
  amount: z.number().int().nonnegative(),
  rate: z.number().min(0).max(1),

  // Nullable fields
  memo: z.string().nullable(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
})

type Resource = z.infer<typeof schema>

// Schema for creating new entities (exclude auto-generated fields)
const newSchema = schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

type NewResource = z.infer<typeof newSchema>

// Schema for updating entities (exclude immutable fields, make all partial)
const mutableSchema = schema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial()

type MutableResource = z.infer<typeof mutableSchema>

// Helper functions (optional)
const generateCode = (lastCode?: string): string => {
  const now = new Date()
  const prefix = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const lastSuffix = lastCode?.split('-')[1] ?? '0'
  const suffix = Number(lastSuffix) + 1
  return `${prefix}-${suffix}`
}

// Export everything
export const resourceEntity = {
  schema,
  newSchema,
  mutableSchema,
  generateCode,
}

export type { Resource, NewResource, MutableResource }
```

### Entity Schema Patterns

| Schema | Purpose | Fields Excluded |
|--------|---------|-----------------|
| `schema` | Full entity representation | None |
| `newSchema` | Creating new entities | `id`, `createdAt`, `updatedAt` |
| `mutableSchema` | Updating entities | `id`, timestamps + `.partial()` |

## Value Object Definition

### Enum Value Object

```typescript
// value-object/resource-status.vo.ts
import { z } from 'zod'

// Define all possible values as const array
const values = ['draft', 'active', 'completed', 'canceled'] as const

// Create Zod enum schema
const schema = z.enum(values)

// Infer TypeScript type
type ResourceStatus = z.input<typeof schema>

// Japanese label mapping
const labelMap: Record<ResourceStatus, string> = {
  draft: '下書き',
  active: '有効',
  completed: '完了',
  canceled: 'キャンセル',
} as const

// Reverse mapping (label → value)
const valueMap: Record<string, ResourceStatus> = Object.fromEntries(
  Object.entries(labelMap).map(([value, label]) => [
    label,
    value as ResourceStatus,
  ]),
)

// Options for select/dropdown components
const options = Object.entries(labelMap).map(([value, label]) => ({
  value: value as ResourceStatus,
  label,
}))

export const resourceStatus = {
  values,
  schema,
  labelMap,
  valueMap,
  options,
}
export type { ResourceStatus }
```

### Validated String Value Object

```typescript
// value-object/phone-number.vo.ts
import { z } from 'zod'

// Regex for validation
const regex = /^[0-9-]+$/

const schema = z
  .string()
  .refine(
    (val) => val === '' || regex.test(val),
    '電話番号は数字とハイフンのみ入力可能です',
  )

export const phoneNumber = { schema }
```

### Codec Value Object (Type Transformation)

```typescript
// value-object/date-without-time.vo.ts
import { format } from 'date-fns'
import { z } from 'zod'

// Codec: Date ↔ ISO date string ("2024-01-15")
const schema = z.codec(z.date(), z.iso.date(), {
  decode: (date: Date) => format(date, 'yyyy-MM-dd'),
  encode: (value: string) => new Date(`${value}T00:00:00.000Z`),
})

export const dateWithoutTime = { schema }
```

### Composite Value Object

```typescript
// value-object/pagination.vo.ts
import { z } from 'zod'

// Codec for page number (string ↔ number for URL params)
const pageSchema = z.codec(z.string(), z.number().int().positive(), {
  decode: (num) => num.toString(),
  encode: (str) => Math.max(1, Number.parseInt(str, 10) || 1),
})

// Codec for per-page count
const perSchema = z.codec(z.string(), z.number().int().positive(), {
  decode: (num) => num.toString(),
  encode: (str) => Math.min(100, Math.max(1, Number.parseInt(str, 10) || 20)),
})

// Response DTO schema
const dtoSchema = z.object({
  page: z.number(),
  per: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
})

export const pagination = { pageSchema, perSchema, dtoSchema }
```

## Implementation Checklist

When adding a new domain concept:

### For Entities

1. [ ] Create entity file in `entity/{resource}.entity.ts`
2. [ ] Define full `schema` with all fields
3. [ ] Create `newSchema` (omit auto-generated fields)
4. [ ] Create `mutableSchema` (omit immutable fields, make partial)
5. [ ] Export entity object and types

### For Value Objects

1. [ ] Create value object file in `value-object/{type}.vo.ts`
2. [ ] Define schema with validation
3. [ ] Add `labelMap` for Japanese labels (if enum)
4. [ ] Add `options` for UI dropdowns (if enum)
5. [ ] Export value object and type

### For Logic

1. [ ] Create logic file in `logic/{feature}/{operation}.ts`
2. [ ] Define input/output types
3. [ ] Implement pure functions (no side effects)
4. [ ] Export functions

## Naming Conventions

| Type | File Pattern | Export Pattern |
|------|-------------|----------------|
| Entity | `{resource}.entity.ts` | `resourceEntity` + `Resource`, `NewResource`, `MutableResource` |
| Value Object | `{type}.vo.ts` | `typeName` + `TypeName` (type) |
| Logic | `{operation}.ts` | `calcXxx`, `determineXxx`, `validateXxx` |

## Import Patterns

```typescript
// Entity import
import {
  resourceEntity,
  Resource,
  NewResource,
  MutableResource,
} from '@repo/domain/entity/resource.entity'

// Value Object import
import { resourceStatus, ResourceStatus } from '@repo/domain/value-object/resource-status.vo'
```
