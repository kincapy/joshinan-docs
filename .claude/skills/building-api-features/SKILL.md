---
name: building-api-features
description: Next.js API Route の実装ガイド。新しいカテゴリの API（CRUD）を実装するときに参照する。認証・バリデーション・レスポンス・エラーハンドリングのパターンを定義。
---

# API Route 実装ガイド

## When to Use

- 新しいカテゴリの API Route を作成するとき
- 既存 API Route の修正・機能追加
- 認証・バリデーション・エラーハンドリングのパターンを確認したいとき

## アーキテクチャ概要

Next.js App Router の Route Handler を使用。リポジトリ層・ユースケース層は**なし**。API Route 内で Prisma を直接呼び出すシンプルな構成。

```
apps/web/app/api/
├── students/
│   ├── route.ts                    # GET 一覧 / POST 新規
│   └── [id]/
│       ├── route.ts                # GET 詳細 / PUT 更新
│       └── interviews/route.ts     # 子リソース
├── schools/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── enrollment-periods/
│           ├── route.ts
│           └── [periodId]/route.ts
└── health/route.ts

apps/web/lib/api/                   # 共通ユーティリティ
├── auth.ts                         # requireAuth()
├── error.ts                        # handleApiError(), AuthError
├── response.ts                     # ok(), okList(), errorResponse()
└── validation.ts                   # parseBody(), parseQuery()
```

## 共通ユーティリティ

### 認証 (`lib/api/auth.ts`)

```typescript
import { requireAuth } from '@/lib/api/auth'

// Supabase Auth で認証チェック。未認証なら AuthError を throw
const user = await requireAuth()
```

### バリデーション (`lib/api/validation.ts`)

```typescript
import { parseBody } from '@/lib/api/validation'
import { parseQuery } from '@/lib/api/validation'

// リクエストボディを Zod スキーマでパース
const body = await parseBody(request, createSchema)

// クエリパラメータを Zod スキーマでパース
const query = parseQuery(request, querySchema)
```

### レスポンス (`lib/api/response.ts`)

```typescript
import { ok, okList } from '@/lib/api/response'

// 単一データ: { data: T, error: null }
return ok(student)

// 一覧データ: { data: T[], pagination: {...}, error: null }
return okList(students, { page, per, total })
```

### エラーハンドリング (`lib/api/error.ts`)

```typescript
import { handleApiError } from '@/lib/api/error'

// ZodError → 400, P2002(ユニーク違反) → 409, P2025(未検出) → 404, AuthError → 401, その他 → 500
return handleApiError(error)
```

## 実装パターン（テンプレート）

### GET 一覧 + POST 新規（`route.ts`）

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok, okList } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'
import { someEnum } from '@joshinan/domain'

/** 登録スキーマ */
const createSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  status: someEnum.schema,
  memo: z.string().nullable().optional(),
})

/** GET /api/resources — 一覧 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const per = 50

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
      }),
      prisma.resource.count({ where }),
    ])

    return okList(data, { page, per, total })
  } catch (error) {
    return handleApiError(error)
  }
}

/** POST /api/resources — 新規登録 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await parseBody(request, createSchema)

    const resource = await prisma.resource.create({
      data: {
        name: body.name,
        status: body.status,
        memo: body.memo ?? null,
      },
    })

    return ok(resource)
  } catch (error) {
    return handleApiError(error)
  }
}
```

### GET 詳細 + PUT 更新（`[id]/route.ts`）

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/error'
import { requireAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validation'

/** 更新スキーマ */
const updateSchema = z.object({
  name: z.string().min(1).optional(),
  memo: z.string().nullable().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/resources/:id — 詳細 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const resource = await prisma.resource.findUniqueOrThrow({
      where: { id },
      include: {
        // 必要に応じてリレーションを include
      },
    })

    return ok(resource)
  } catch (error) {
    return handleApiError(error)
  }
}

/** PUT /api/resources/:id — 更新 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await parseBody(request, updateSchema)

    const resource = await prisma.resource.update({
      where: { id },
      data: body,
    })

    return ok(resource)
  } catch (error) {
    return handleApiError(error)
  }
}
```

## ルール

1. **認証は全 Route の冒頭で `await requireAuth()`**
2. **Zod スキーマは Route ファイル内でローカル定義** — `@joshinan/domain` の VO をインポートして使う
3. **Prisma は直接呼び出し** — `import { prisma } from '@/lib/prisma'`
4. **try-catch で囲み `handleApiError` に委譲**
5. **日本語コメント** — 各関数の先頭に `/** POST /api/xxx — 説明 */` を付ける
6. **ページネーション** — `page` と `per` で制御、`okList` で返す

## ディレクトリ命名規則

| リソース | API パス | ディレクトリ |
|----------|----------|--------------|
| 科目 | `/api/subjects` | `app/api/subjects/` |
| クラス | `/api/classes` | `app/api/classes/` |
| 出席 | `/api/attendance` | `app/api/attendance/` |
| 請求 | `/api/invoices` | `app/api/invoices/` |
| エージェント | `/api/agents` | `app/api/agents/` |

## 実装チェックリスト

1. [ ] `app/api/{resource}/route.ts` を作成（GET 一覧 + POST 新規）
2. [ ] `app/api/{resource}/[id]/route.ts` を作成（GET 詳細 + PUT 更新）
3. [ ] 子リソースがあれば `[id]/{child}/route.ts` を追加
4. [ ] Zod スキーマに `@joshinan/domain` の VO を使用
5. [ ] 全 Route で `requireAuth()` を呼び出し
6. [ ] `npm run build` でエラーがないことを確認
