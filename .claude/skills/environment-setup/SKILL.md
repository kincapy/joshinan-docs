---
name: environment-setup
description: joshinan-docs プロジェクトの環境セットアップガイド。初回セットアップ、開発サーバー起動、ビルド確認の手順を定義。
---

# 環境セットアップガイド

## When to Use

- プロジェクトの初回セットアップ
- 開発サーバーの起動方法を確認したいとき
- ビルド・デプロイの手順を確認したいとき

## プロジェクト構成

モノレポ構成（npm workspaces）:

```
joshinan-docs/
├── docs/                     # VitePress ドキュメントサイト
├── apps/web/                 # Next.js 業務アプリ
├── packages/database/        # Prisma スキーマ・DB 層
├── packages/domain/          # ドメイン層（Value Object）
└── package.json              # ルート（workspaces 定義）
```

## セットアップ手順

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数ファイルの作成（apps/web/.env.local）
#    → Supabase の接続情報を設定

# 3. Prisma Client 生成
npx prisma generate --schema=packages/database/prisma/schema
```

## 開発コマンド

| コマンド | 用途 |
|----------|------|
| `npm run dev` | VitePress 開発サーバー起動 |
| `npm run build` | VitePress ビルド |
| `npm run docs:build` | VitePress ビルド（worktree 環境用） |
| `npm run preview` | ビルド後のプレビュー |

### worktree 環境での注意

- `npm run build` は Next.js 側のビルドも走るため、worktree 環境では失敗することがある
- **worktree 環境では `npm run docs:build` を使う**

## 認証

- **Supabase Auth** を使用（Firebase ではない）
- 環境変数: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## DB 接続

- **Supabase PostgreSQL** に接続
- 環境変数: `DATABASE_URL`（`apps/web/.env.local` に設定）
- ローカル DB ではなく Supabase のリモート DB を使用

## デプロイ

2つの Vercel プロジェクトが紐づいている:

| プロジェクト | URL | 用途 |
|---|---|---|
| joshinan-docs | joshinan-docs.vercel.app | VitePress ドキュメント |
| joshinan-app | joshinan-app.vercel.app | Next.js 業務アプリ |

- `vercel.json` は**作成しない**（ダッシュボード設定で管理）
- main に push → 両プロジェクトのビルドが走る（同時ビルド制限あり）

## ビルド確認

コード変更後は必ずビルドを通す:

```bash
# 通常環境
npm run build

# worktree 環境
npm run docs:build
```
