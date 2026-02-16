---
name: api-endpoint-definition
description: Guide for defining API endpoints and DTOs in packages/api-client. Use when creating REST API contracts, query/repository DTOs, endpoint manifests, or working with type-safe API client definitions.
---

# API Endpoint Definition Guide

## When to Use

- Defining new REST API endpoints
- Creating request/response DTOs
- Adding query parameters or path parameters
- Working with type-safe API contracts in `packages/api-client`

## Architecture Overview

The `packages/api-client` package provides type-safe API contracts shared between frontend and backend.

```
packages/api-client/src/
├── endpoints/              # Endpoint manifests (path → schema mapping)
│   ├── user/               # User endpoints
│   ├── public/             # Public endpoints
│   ├── admin/              # Admin endpoints
│   └── manifests.ts        # Combined export
├── dto/
│   ├── query/              # GET response DTOs (query services)
│   │   └── user/{resource}/
│   │       ├── dto.ts           # Base DTO schema
│   │       ├── find-many.query.ts
│   │       └── find-one.query.ts
│   └── repository/         # POST/PUT/DELETE DTOs (use cases)
│       └── user/{resource}/
│           ├── create.dto.ts
│           └── update.dto.ts
├── client.ts               # RestApiClient implementation
└── index.ts                # Public exports
```

## Endpoint Definition

### Basic Structure

```typescript
// endpoints/user/{resources}.endpoint.ts
import { resourceFindMany } from "../../dto/query/user/resource/find-many.query";
import { resourceFindOne } from "../../dto/query/user/resource/find-one.query";
import { resourceCreate } from "../../dto/repository/user/resource/create.dto";
import { resourceUpdate } from "../../dto/repository/user/resource/update.dto";
import { okResponse } from "../common";
import { EndpointResource } from "../type";

export default {
  "/user/resources": {
    GET: {
      query: resourceFindMany.querySchema,
      response: resourceFindMany.dtoSchema,
    },
    POST: {
      body: resourceCreate.schema,
      response: resourceFindOne.dtoSchema,
    },
  },
  "/user/resources/:id": {
    GET: {
      pathParams: resourceFindOne.pathParamsSchema,
      response: resourceFindOne.dtoSchema,
    },
    PUT: {
      pathParams: resourceFindOne.pathParamsSchema,
      body: resourceUpdate.schema,
      response: resourceFindOne.dtoSchema,
    },
    DELETE: {
      pathParams: resourceFindOne.pathParamsSchema,
      response: okResponse,
    },
  },
} satisfies EndpointResource;
```

### Registering Endpoints

Add to the appropriate index file:

```typescript
// endpoints/user/index.ts
import resourceEndpoints from "./resources.endpoint";

export default {
  ...resourceEndpoints,
  // ... other endpoints
};
```

## Query DTOs (GET responses)

### Base DTO Schema

```typescript
// dto/query/user/resource/dto.ts
import { resourceEntity } from "@repo/domain/entity/resource.entity";
import { dateString } from "@repo/domain/value-object/date-string.vo";
import { dateWithoutTime } from "@repo/domain/value-object/date-without-time.vo";
import { z } from "zod";

// Extend entity schema with date transformations
const schema = resourceEntity.schema.extend({
    // Date fields use codec for JSON serialization
    createdAt: dateString.schema,
    updatedAt: dateString.schema,
    startDate: dateWithoutTime.schema,
  });

type Dto = z.input<typeof schema>;

export const resourceDto = { schema };
export type { Dto as ResourceDto };
```

### Find Many Query

```typescript
// dto/query/user/resource/find-many.query.ts
import { pagination } from "@repo/domain/value-object/pagination.vo";
import { sortDirection } from "@repo/domain/value-object/sort-direction.vo";
import { dateWithoutTime } from "@repo/domain/value-object/date-without-time.vo";
import { z } from "zod";
import { resourceDto, ResourceDto } from "./dto";

// Query parameters (all optional)
const querySchema = z.object({
  page: pagination.pageSchema.optional(),
  per: pagination.perSchema.optional(),
  sort: z.enum(["createdAt", "name"]).optional(),
  direction: sortDirection.schema.optional(),
  // Search/filter parameters
  name: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  ids: z.array(z.uuid()).optional(),
});

type Query = z.input<typeof querySchema>;

// Response schema
const dtoSchema = z.object({
  resources: z.array(resourceDto.schema),
  pagination: pagination.dtoSchema,
});

type Dto = {
  resources: ResourceDto[];
  pagination: z.input<typeof pagination.dtoSchema>;
};

export const resourceFindMany = { querySchema, dtoSchema };
export type { Query as ResourceFindManyQuery, Dto as ResourceFindManyDto };
```

### Find One Query

```typescript
// dto/query/user/resource/find-one.query.ts
import { z } from "zod";
import { resourceDto, ResourceDto } from "./dto";

// Path parameters
const pathParamsSchema = z.object({
  id: z.uuid(),
});

// Response is the full DTO
const dtoSchema = resourceDto.schema;

type Dto = ResourceDto;

export const resourceFindOne = { pathParamsSchema, dtoSchema };
export type { Dto as ResourceFindOneDto };
```

## Repository DTOs (POST/PUT/DELETE requests)

### Create DTO

```typescript
// dto/repository/user/resource/create.dto.ts
import {
  resourceEntity,
  NewResource,
} from "@repo/domain/entity/resource.entity";
import { dateWithoutTime } from "@repo/domain/value-object/date-without-time.vo";
import { z } from "zod";

// Pick only the fields needed for creation
const schema = resourceEntity.schema
  .pick({
    name: true,
    status: true,
    startDate: true,
  })
  .extend({
    // Override date fields with codec for JSON input
    startDate: dateWithoutTime.schema,
  });

type Create = z.input<typeof schema>;

// Convert DTO to entity (used in UseCase)
const dtoToEntity = (dto: Create): NewResource => {
  return resourceEntity.newSchema.parse({
    ...dto,
    // Add computed fields if needed
  } satisfies NewResource);
};

export const resourceCreate = { schema, dtoToEntity };
export type { Create as ResourceCreate };
```

### Update DTO

```typescript
// dto/repository/user/resource/update.dto.ts
import {
  resourceEntity,
  MutableResource,
} from "@repo/domain/entity/resource.entity";
import { dateWithoutTime } from "@repo/domain/value-object/date-without-time.vo";
import { z } from "zod";

// Pick mutable fields
const schema = resourceEntity.schema
  .pick({
    name: true,
    status: true,
    startDate: true,
  })
  .extend({
    startDate: dateWithoutTime.schema,
  });

type Update = z.input<typeof schema>;

const dtoToEntity = (dto: Update): MutableResource => {
  return resourceEntity.mutableSchema.parse(dto);
};

export const resourceUpdate = { schema, dtoToEntity };
export type { Update as ResourceUpdate };
```

## Date Handling

### Date Codecs

| Codec                    | Input Type | Output Type             | Use Case                                    |
| ------------------------ | ---------- | ----------------------- | ------------------------------------------- |
| `dateString.schema`      | `Date`     | `string` (ISO datetime) | Timestamps (`createdAt`, `updatedAt`)       |
| `dateWithoutTime.schema` | `Date`     | `string` (ISO date)     | Date-only fields (`startDate`, `birthDate`) |

```typescript
// In DTO schemas
import { dateString } from "@repo/domain/value-object/date-string.vo";
import { dateWithoutTime } from "@repo/domain/value-object/date-without-time.vo";

const schema = z.object({
  createdAt: dateString.schema, // "2024-01-15T10:30:00.000Z"
  startDate: dateWithoutTime.schema, // "2024-01-15"
});
```

### Codec Direction

- `schema.decode(date)`: Date → string (API response serialization)
- `schema.encode(string)`: string → Date (API request deserialization)

## Type Helpers

```typescript
import type {
  BodyFor,
  PathParamsFor,
  QueryFor,
  ResponseFor,
} from '@repo/api-client'

// Use in controllers
type Path = '/user/resources'

@Get('/')
async findMany(
  @QuerySchema(path, 'GET') query: QueryFor<Path, 'GET'>,
): Promise<ResponseFor<Path, 'GET'>>

@Post('/')
async create(
  @BodySchema(path, 'POST') body: BodyFor<Path, 'POST'>,
): Promise<ResponseFor<Path, 'POST'>>
```

## Implementation Checklist

When adding a new API endpoint:

1. [ ] Create base DTO in `dto/query/user/{resource}/dto.ts`
2. [ ] Create find-many query in `dto/query/user/{resource}/find-many.query.ts`
3. [ ] Create find-one query in `dto/query/user/{resource}/find-one.query.ts`
4. [ ] Create create DTO in `dto/repository/user/{resource}/create.dto.ts`
5. [ ] Create update DTO in `dto/repository/user/{resource}/update.dto.ts`
6. [ ] Define endpoint manifest in `endpoints/user/{resources}.endpoint.ts`
7. [ ] Export in `endpoints/user/index.ts`

## Common Patterns

### Nested DTOs

```typescript
const schema = resourceEntity.schema.extend({
  createdAt: dateString.schema,
  // Nested relations
  customer: customerDto.schema,
  items: z.array(itemDto.schema),
});
```

### Special Response Types

```typescript
// Status counts response
const dtoSchema = z.object({
  statusCounts: z.array(
    z.object({
      status: resourceStatus.schema,
      count: z.number(),
    })
  ),
  total: z.number(),
});

// File download (Blob response)
const dtoSchema = z.custom<Blob>();
```

### Upsert/Bulk Operations

```typescript
// dto/repository/user/resource/upsert-many.dto.ts
const schema = z.object({
  parentId: z.uuid(),
  items: z.array(
    z.object({
      id: z.uuid().optional(), // Optional for new items
      name: z.string(),
      // ...
    })
  ),
});
```
