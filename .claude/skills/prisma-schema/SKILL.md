---
name: prisma-schema
description: Prisma スキーマ定義のガイド。packages/database 配下のモデル定義・マイグレーション方針・命名規則を定義。新しいテーブルの追加やスキーマ変更時に参照する。
---

# Prisma スキーマガイド

## When to Use

- 新しいテーブル（モデル）を追加するとき
- 既存テーブルの構造を変更するとき
- マイグレーション方針を確認したいとき

## ディレクトリ構成

```
packages/database/
├── prisma/
│   ├── schema/                    # マルチファイルスキーマ
│   │   ├── schema.prisma          # generator + datasource 設定
│   │   ├── school.prisma          # 学校基本情報
│   │   ├── student.prisma         # 学生管理
│   │   ├── curriculum.prisma      # カリキュラム
│   │   ├── class.prisma           # クラス編成
│   │   ├── attendance.prisma      # 出席管理
│   │   ├── tuition.prisma         # 学費管理
│   │   ├── agent.prisma           # エージェント管理
│   │   ├── facility.prisma        # 施設・備品管理
│   │   ├── staff.prisma           # 教職員管理
│   │   ├── immigration.prisma     # 入管報告
│   │   ├── document.prisma        # 社内文書
│   │   ├── recruitment.prisma     # 募集業務
│   │   └── skilled-worker.prisma  # 特定技能
│   └── migrations/                # マイグレーションファイル
├── src/
│   └── index.ts                   # PrismaClient の re-export
└── package.json
```

## モデル定義規則

```prisma
/// リソースの日本語説明
model Resource {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  name       String                         /// 名前
  status     ResourceStatus @default(DRAFT) /// ステータス
  startDate  DateTime @db.Date              /// 開始日
  memo       String?                        /// メモ

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // リレーション
  items      ResourceItem[]
  school     School   @relation(fields: [schoolId], references: [id], onDelete: Restrict)
  schoolId   String   @db.Uuid

  @@index([schoolId])
  @@map("resources")
}
```

### 必須ルール

| 項目 | 規則 |
|------|------|
| ID | UUID `@default(dbgenerated("gen_random_uuid()"))` — autoincrement は使わない |
| コメント | `///` で日本語ドキュメントコメント |
| テーブル名 | `@@map("snake_case")` を必ず付ける |
| FK インデックス | `@@index([foreignKeyId])` を FK ごとに付ける |
| 日付のみ | `DateTime @db.Date` |
| 削除制約 | 子テーブル: `Cascade`、マスタ参照: `Restrict` |
| タイムスタンプ | `createdAt` + `updatedAt` を全モデルに付ける |

## Enum 定義

```prisma
enum ResourceStatus {
  DRAFT
  ACTIVE
  COMPLETED

  @@map("resource_status")
}
```

## マイグレーション方針

### 本番未稼働: 既存マイグレーションを編集

このプロジェクトは**まだ本番稼働していない**。DBはいつでもリセット可能。

- 既存テーブルの変更 → **既存のマイグレーション SQL を直接編集**
- 新しいテーブルの追加 → **新しいマイグレーションファイルを作成**

### Supabase 環境でのマイグレーション

ローカル DB に直接接続できない（IPv4/IPv6 問題）ため、以下の手順を使う：

1. `.prisma` スキーマファイルを編集
2. `npx prisma migrate diff` で SQL を生成
3. Supabase SQL Editor で手動実行

### AI エージェントのワークフロー

`prisma migrate dev` は**使わない**。手動で SQL を書く。

**新しいテーブルの場合:**
1. `.prisma` スキーマファイルを編集
2. マイグレーションディレクトリ作成: `YYYYMMDDHHMMSS_{description}/migration.sql`
3. CREATE TABLE / CREATE TYPE SQL を手書き
4. `npx prisma generate` で Client を再生成

**既存テーブルの変更:**
1. `.prisma` スキーマファイルを編集
2. 元のマイグレーション SQL を直接編集
3. DB リセットが必要な場合はユーザーに確認

## 既存スキーマとの整合性

**全カテゴリの Prisma スキーマは定義済み。** 新しいカテゴリの実装時に DB スキーマを一から書く必要はない。既存の `.prisma` ファイルを確認してから API/フロントエンドを実装すること。

## 実装チェックリスト

1. [ ] `packages/database/prisma/schema/{feature}.prisma` を確認（既存なら読む、新規なら作成）
2. [ ] `@@map`, `@@index`, リレーション、日本語コメントを確認
3. [ ] 必要ならマイグレーション SQL を作成・編集
4. [ ] `npx prisma generate` で Client を再生成
5. [ ] `@joshinan/domain` の VO と Prisma Enum が一致していることを確認
