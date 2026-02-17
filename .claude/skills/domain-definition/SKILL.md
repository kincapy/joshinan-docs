---
name: domain-definition
description: ドメイン層（packages/domain）の定義ガイド。Value Object（Enum）の定義パターンを説明。新しいカテゴリ実装時の VO 追加・既存 VO の確認に使用する。
---

# ドメイン定義ガイド

## When to Use

- 新しい Value Object（Enum）を追加するとき
- 既存 VO の構造・パターンを確認したいとき
- `@joshinan/domain` からのインポートパターンを確認したいとき

## ディレクトリ構成

```
packages/domain/src/
├── index.ts              # export * from './value-object'
└── value-object/
    ├── index.ts          # 全 VO の re-export（カテゴリ別にコメント分類）
    └── *.vo.ts           # 約47個の Value Object ファイル
```

**重要:** このプロジェクトでは `entity/` ディレクトリは**存在しない**。ドメイン層は Value Object（主に Enum）のみで構成されている。

## Value Object（Enum）の定義パターン

```typescript
// value-object/resource-status.vo.ts
import { z } from 'zod'

/** ステータスの選択肢 */
const values = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELED'] as const

/** Zod スキーマ */
const schema = z.enum(values)

/** TypeScript 型 */
type ResourceStatus = z.input<typeof schema>

/** 日本語ラベル */
const labelMap: Record<ResourceStatus, string> = {
  DRAFT: '下書き',
  ACTIVE: '有効',
  COMPLETED: '完了',
  CANCELED: 'キャンセル',
} as const

/** ラベル → 値の逆マッピング */
const valueMap: Record<string, ResourceStatus> = Object.fromEntries(
  Object.entries(labelMap).map(([value, label]) => [
    label,
    value as ResourceStatus,
  ]),
)

/** セレクトボックス用オプション配列 */
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

## index.ts への登録パターン

```typescript
// value-object/index.ts

// =============================================
// XX-category-name
// =============================================
export { resourceStatus } from './resource-status.vo'
export type { ResourceStatus } from './resource-status.vo'
```

カテゴリ番号のコメントで分類されている。新しい VO を追加する場合は、対応するカテゴリセクションに追加する。

## 使用パターン

### API Route での使用

```typescript
// apps/web/app/api/resources/route.ts
import { resourceStatus } from '@joshinan/domain'

const createSchema = z.object({
  status: resourceStatus.schema,  // Zod スキーマとして使用
})
```

### フロントエンドでの使用

```typescript
// apps/web/app/(auth)/resources/page.tsx
import { resourceStatus } from '@joshinan/domain'

// セレクトボックス
<Select options={resourceStatus.options} />

// バッジ表示
<Badge>{resourceStatus.labelMap[item.status]}</Badge>
```

## 既存 VO の状態

**全カテゴリの VO は定義済み（約47個）。** 新しいカテゴリの実装時に VO を一から書く必要はほとんどない。既存の VO を確認してから使用すること。

### カテゴリ別 VO 数

| カテゴリ | VO 数 |
|----------|--------|
| 01-school-info | 3 |
| 02-student-management | 9 |
| 03-curriculum | 5 |
| 04-class-assignment | 2 |
| 05-attendance | 3 |
| 06-tuition | 2 |
| 07-agent-management | 2 |
| 08-facility-management | 1 |
| 09-staff-management | 4 |
| 11-immigration-report | 5 |
| 12-internal-documents | 1 |
| 14-recruitment | 5 |
| 15-specified-skilled-worker | 4 |

## 実装チェックリスト

1. [ ] `packages/domain/src/value-object/` に既存の VO がないか確認
2. [ ] 新規 VO が必要なら `{type}.vo.ts` を作成
3. [ ] `values`, `schema`, `labelMap`, `options` を必ず定義
4. [ ] `value-object/index.ts` に export を追加（カテゴリコメント内）
5. [ ] Prisma Enum の値と VO の `values` が一致していることを確認
