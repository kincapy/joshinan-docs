# Project Guidelines

## Overview

常南国際学院の業務ナレッジ・システム仕様・タスク管理のドキュメントサイト。
VitePress による静的ドキュメントサイトと、Next.js + Prisma の業務アプリが同一リポジトリに同居するモノレポ構成。

## Directory Map

- `docs/` — VitePress ドキュメント
  - `01-domain-knowledge/` — 業務ナレッジ（14カテゴリ）
  - `02-system-specification/` — システム仕様
  - `03-tasks/` — タスク管理
  - `.vitepress/config.ts` — サイドバー・ナビゲーション設定
- `apps/web/` — Next.js 業務アプリ（Supabase Auth + Prisma）
- `packages/database/` — Prisma スキーマ・DB 層
- `packages/domain/` — ドメイン層（Entity, ValueObject）
- `scripts/` — ユーティリティスクリプト（Playwright クローラー等）

## Setup

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run preview  # プレビュー
```

## Session Start (MANDATORY)

セッション開始時、コード変更に着手する前に **必ず** 以下を実行すること:

```bash
git fetch origin
git merge origin/main
```

- main ブランチの最新を取り込んでからコンフリクトのない状態で作業を始める
- worktree 環境でも同様。`git pull` ではなく `git fetch + merge` を使う
- コンフリクトが発生した場合は、先に解決してから作業を開始する

## Development Workflow

### Task Scale Decision Matrix (MANDATORY)

タスクに着手する前に、スケールを判定して対応するアプローチを取ること。
`.claude/skills` にプロジェクト固有の実装ガイドがある場合は必ず参照する。

| Scale       | Task Document                                 | Agent Approach             | Examples                                                           |
| ----------- | --------------------------------------------- | -------------------------- | ------------------------------------------------------------------ |
| **Trivial** | Skip                                          | Work alone                 | Fix a typo, update a dependency version, adjust a config value     |
| **Small**   | Ask user                                      | Subagents (`Task` tool)    | Add a field to a form, single-layer implementation, research       |
| **Large**   | Always create (per `docs/03-tasks/README.md`) | Agent Teams (`TeamCreate`) | New feature, multi-layer implementation, parallel frontend/backend |

### Agent Teams Procedure

タスクスケールが **Large** の場合、**必ず** `TeamCreate` を使用する:

1. タスクファイルと仕様を読んで作業スコープを把握する
2. `TeamCreate` でチームを作成する
3. 各レイヤー/領域ごとに `TaskCreate` でタスクを作成し、`addBlockedBy` で依存関係を設定する
4. `Task` ツールで実装担当エージェントを起動する（`subagent_type: "general-purpose"`, `team_name` 指定）
5. リーダーはタスクリストで進捗管理し、**自身は実装しない**
6. 全実装タスク完了後、レビューエージェントを起動する（`subagent_type: "reviewer"`, `team_name` 指定）
7. レビュー指摘 → リーダーが実装エージェントに修正を指示
8. レビューが **PASS** になるまで 6–7 を繰り返す
9. レビュー承認後にタスクを完了とする

## VitePress Sidebar Configuration

このプロジェクトでは `docs/.vitepress/config.ts` にサイドバーを直接記述している。
ファイルやディレクトリを追加・削除・リネームした場合は、`config.ts` のサイドバー定義も手動で更新すること。

## Vercel デプロイ構成

このリポジトリには **2つの Vercel プロジェクト** が紐づいている。`vercel.json` は存在しない（ダッシュボード設定で管理）。

| Vercel プロジェクト | URL | 用途 | Root Directory |
|---|---|---|---|
| joshinan-docs | joshinan-docs.vercel.app | VitePress ドキュメント | (なし=ルート) |
| joshinan-app | joshinan-app.vercel.app | Next.js 業務アプリ | `apps/web` |

### 注意事項

- **vercel.json を作成しないこと** — 2プロジェクトの設定が競合する。ビルド設定は全てダッシュボード側で管理
- **Hobby プランの同時ビルド制限** — main に push すると両プロジェクトのビルドが走るが、同時に1つしかビルドできない。片方が Canceled になることがある。その場合は Vercel ダッシュボードから手動で Redeploy する
- **手動デプロイ方法** — `vercel --prod --yes`（`.vercel/project.json` のリンク先プロジェクトにデプロイされる）
- **DB スキーマ変更時** — `prisma migrate diff` で SQL 生成 → Supabase SQL Editor で手動実行（直接接続は IPv4/IPv6 問題で不可）

## 開発方針

### コード品質

- 時間がかかってもいいので、綺麗でメンテナンスしやすいコードを書く
- バグ発生時に原因が一目でわかるコード構造にする
- 非エンジニアのユーザーがオーナーなので、コードで説明しない。日本語で何をしたか説明する

### QA（品質保証）

コード変更後、以下を必ず実施すること:

1. **ビルド確認**: `npm run build`（worktree 環境では `npm run docs:build` + `npx tsc --noEmit --project apps/web/tsconfig.json`）
2. **テスト**: API Route のテストを Vitest で書く（`apps/web/__tests__/` 配下）
3. **要件定義書との突合**: `docs/02-system-specification/` の仕様と実装が一致しているか確認
4. **影響範囲チェック**: 他テーブルと連携する機能は、既存機能に異変がないか確認

### コミット・PR 方針

- **レイヤーごとにコミット**: API完成→コミット、画面完成→コミット、テスト完成→コミット
- **1カテゴリ完了 = 1PR → マージ**: セッション死亡時のリスク最小化
- **こまめにマージ**: PR が溜まらないようにする

### セッション管理

- **コンテキスト残量を自動判断**: 残りが少なくなったらユーザーに通知
- **通知内容**: 「引き継ぎドキュメントを作りますか？」と聞く
- **引き継ぎ時の指示**: ブランチをどうするか、新規セッションで何から始めるかを明記

### 開発順序

- 他テーブルと繋がっているもの（依存関係の上流）から丁寧に実装
- 具体的な順序は技術的判断で決定

## Post-Implementation Checklist (MANDATORY)

コード変更後、**必ず** 以下を順番に実行すること:

1. **Verification** — 以下のコマンドを実行し、問題があれば修正する:
   - `npm run build` — VitePress ビルドが通ることを確認
2. **Documentation Sync** — `docs/` 配下の関連ドキュメントを同期する。`/docs-maintenance` スキルを参照。

## セッション完了時のワークフロー（MANDATORY）

実装が完了してユーザーに完了報告をした後、**必ず** 以下を順番に実行すること。
ユーザーが「引き継ぎ出して」「/handover」「PRしてマージしてhandover」等と言ったら、まとめて実行する。

1. **PR 作成** — `gh pr create` で PR を作成する（未作成の場合）
2. **マージ** — `gh pr merge` でマージする
3. **引き継ぎドキュメント作成** — `~/.claude/HANDOVER_TEMPLATE.md` のフォーマットに従って作成
   - **保存先**: メインリポジトリ（`/Users/eiji/joshinan-docs/`）に置くこと（worktree ではない）
   - **ファイル名**: `HANDOVER_JOSHINAN_YYYYMMDD_{topic}.md`
