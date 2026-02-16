---
name: building-api-features
description: Guide for NestJS API architecture, layer structure, and implementation patterns. Use when creating controllers, use cases, repositories, query services, or working with authentication, validation, and database access in apps/api.
---

# API Architecture Guide

## When to Use

- Creating or modifying controllers in `apps/api`
- Implementing use cases, repositories, or query services
- Working with authentication/authorization
- Adding validation or error handling
- Database operations with Prisma

## Architecture Overview

NestJS 11 RESTful API based on Clean Architecture principles.

```
apps/api/src/
├── interfaces/     # Presentation layer (REST API, CLI)
├── application/    # Application layer (use cases, queries, repository interfaces)
└── infrastructure/ # Infrastructure layer (Prisma, auth, event bus)
```

## Layer Responsibilities

### 1. Interfaces Layer (Presentation)

Location: `interfaces/rest/`

| Directory            | Purpose                         |
| -------------------- | ------------------------------- |
| `controllers/`       | REST API endpoints              |
| `decorators/`        | Custom decorators               |
| `guards/`            | Authentication guards           |
| `exception-filters/` | Error handling                  |
| `interceptors/`      | Request/response transformation |
| `middleware/`        | Request middleware              |

CLI tools: `interfaces/cli/seed/`

### 2. Application Layer (Business Logic)

| Component         | Location                  | Responsibility                                                                                                    |
| ----------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Query Service** | `application/query/`      | Generate DTOs for frontend. Can optimize with joins for performance. NOT for internal entity fetching.            |
| **Repository**    | `application/repository/` | Entity persistence interface. Fetch entities for internal logic. No business logic - just save received entities. |
| **Use Case**      | `application/usecase/`    | Business logic implementation. DTO to Entity conversion. Add computed/external values.                            |

### 3. Infrastructure Layer (External Interfaces)

| Component  | Location                 | Purpose                                        |
| ---------- | ------------------------ | ---------------------------------------------- |
| **Prisma** | `infrastructure/prisma/` | DB connections, query implementations, mappers |
| **Auth**   | `infrastructure/auth/`   | Authentication service implementations         |

**Key principle:** Infrastructure (especially repositories) focuses on external connections. Business logic belongs in Use Cases.

## Validation

Schema-based validation using Zod from `@repo/api-client`:

| Target       | Decorator                                               |
| ------------ | ------------------------------------------------------- |
| Query params | `@QuerySchema(path, method)`                            |
| Request body | `@BodySchema(path, method)`                             |
| Response     | `@ResponseSchema(path, method)` + `ResponseInterceptor` |

## Common Commands

```bash
# Database
make db-migrate-create name=<name>  # Create migration file only (non-interactive)
make db-migrate                     # Apply pending migrations (non-interactive)
make db-generate                    # Generate Prisma Client
make db-reset                       # Reset database (dev only)

# Test
make test-db-setup                  # Reset test database
make test-api path=<path>           # Run tests with Jest
```

## Implementation Checklist

When adding a new feature:

1. [ ] Define Zod schemas in `@repo/api-client`
2. [ ] Create/update domain entity in `packages/domain`
3. [ ] Implement repository interface in `application/repository/`
4. [ ] Implement repository in `infrastructure/prisma/`
5. [ ] Create use case in `application/usecase/`
6. [ ] Create query service in `application/query/` (if needed for frontend)
7. [ ] Add controller in `interfaces/rest/controllers/`
8. [ ] Add appropriate decorators (`@AccountType`, `@QuerySchema`, etc.)
