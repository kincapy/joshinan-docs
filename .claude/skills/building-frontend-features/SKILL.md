---
name: building-frontend-features
description: Next.js フロントエンド画面の実装ガイド。新しいカテゴリの一覧・詳細・新規登録画面を作成するときに参照する。コンポーネント構成、データ取得、UI パターンを定義。
---

# フロントエンド実装ガイド

## When to Use

- 新しいカテゴリの画面（一覧・詳細・新規登録）を作成するとき
- 既存画面の修正・機能追加
- UI コンポーネントの使い方を確認したいとき

## アーキテクチャ概要

Next.js App Router を使用。**全ページが `'use client'`** で、`useEffect` + `fetch` でデータを取得するクライアントサイドレンダリング。

```
apps/web/app/(auth)/
├── students/
│   ├── page.tsx                    # 一覧ページ
│   ├── new/page.tsx                # 新規登録ページ
│   └── [id]/
│       ├── page.tsx                # 詳細ページ（タブ構成）
│       └── tabs/
│           ├── basic-info.tsx      # 基本情報タブ
│           ├── enrollment.tsx      # 在籍情報タブ
│           └── edit-helpers.tsx    # 共通編集ロジック
├── settings/
│   ├── school/page.tsx
│   └── enrollment-periods/page.tsx
└── dashboard/page.tsx
```

## 共通 UI コンポーネント

`apps/web/components/ui/` に shadcn/ui ベースのコンポーネント:

| コンポーネント | ファイル | 用途 |
|---|---|---|
| `Button` | `button.tsx` | ボタン |
| `Input` | `input.tsx` | テキスト入力 |
| `Select` | `select.tsx` | セレクトボックス |
| `Table` | `table.tsx` | テーブル（TableHeader, TableBody, TableRow, TableHead, TableCell） |
| `Badge` | `badge.tsx` | ステータス表示 |
| `Card` | `card.tsx` | カード |
| `Dialog` | `dialog.tsx` | モーダル |
| `Tabs` | `tabs.tsx` | タブ |
| `Label` | `label.tsx` | ラベル |
| `Textarea` | `textarea.tsx` | テキストエリア |

アイコン: `lucide-react` を使用

## 実装パターン

### 一覧ページ（`page.tsx`）

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { resourceStatus } from '@joshinan/domain'
import { Plus, Search } from 'lucide-react'

type ResourceRow = {
  id: string
  name: string
  status: string
}

type Pagination = {
  page: number
  per: number
  total: number
  totalPages: number
}

export default function ResourcesPage() {
  const router = useRouter()
  const [data, setData] = useState<ResourceRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  /** データ取得 */
  const fetchData = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(page))

    const res = await fetch(`/api/resources?${params}`)
    const json = await res.json()
    setData(json.data)
    setPagination(json.pagination)
  }, [search, page])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">リソース一覧</h1>
        <Button onClick={() => router.push('/resources/new')}>
          <Plus className="mr-2 h-4 w-4" /> 新規登録
        </Button>
      </div>

      {/* 検索 */}
      <div className="flex gap-2">
        <Input
          placeholder="検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* テーブル */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>ステータス</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => router.push(`/resources/${item.id}`)}
            >
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <Badge>{resourceStatus.labelMap[item.status as keyof typeof resourceStatus.labelMap]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ページネーション */}
      {pagination && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            前へ
          </Button>
          <span>{page} / {pagination.totalPages}</span>
          <Button
            variant="outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            次へ
          </Button>
        </div>
      )}
    </div>
  )
}
```

### 詳細ページ（タブ構成）

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ResourceDetailPage() {
  const params = useParams()
  const [data, setData] = useState<Resource | null>(null)

  useEffect(() => {
    fetch(`/api/resources/${params.id}`)
      .then((res) => res.json())
      .then((json) => setData(json.data))
  }, [params.id])

  if (!data) return <div>読み込み中...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{data.name}</h1>
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="detail">詳細</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          {/* 基本情報タブの中身 */}
        </TabsContent>
        <TabsContent value="detail">
          {/* 詳細タブの中身 */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## データ取得パターン

```typescript
// API レスポンス形式
// 単一: { data: T, error: null }
// 一覧: { data: T[], pagination: {...}, error: null }

const res = await fetch('/api/resources')
const json = await res.json()
// json.data — データ本体
// json.pagination — ページネーション情報
// json.error — エラー情報（成功時は null）
```

## VO の使い方

```typescript
import { resourceStatus } from '@joshinan/domain'

// ラベル表示
resourceStatus.labelMap['ACTIVE']  // → '有効'

// セレクトボックス
resourceStatus.options  // → [{ value: 'DRAFT', label: '下書き' }, ...]

// バリデーション（フロントでも使える）
resourceStatus.schema.parse('ACTIVE')  // → 'ACTIVE'
```

## ルーティング規則

| 画面 | パス | ファイル |
|------|------|----------|
| 一覧 | `/resources` | `app/(auth)/resources/page.tsx` |
| 新規 | `/resources/new` | `app/(auth)/resources/new/page.tsx` |
| 詳細 | `/resources/:id` | `app/(auth)/resources/[id]/page.tsx` |

## 実装チェックリスト

1. [ ] `app/(auth)/{resource}/page.tsx` — 一覧ページ
2. [ ] `app/(auth)/{resource}/new/page.tsx` — 新規登録ページ（必要に応じて）
3. [ ] `app/(auth)/{resource}/[id]/page.tsx` — 詳細ページ
4. [ ] `@joshinan/domain` の VO を使ってラベル表示
5. [ ] `@/components/ui/` の共通コンポーネントを使用
6. [ ] 対応する API Route が存在することを確認
7. [ ] `npm run build` でエラーがないことを確認
