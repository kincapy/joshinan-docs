# Project Guidelines

## Overview

常南国際学院の業務ナレッジ・システム仕様・タスク管理のドキュメントサイト。
現在は VitePress による静的ドキュメントサイト。将来 NestJS + Next.js + Prisma でシステム開発予定。

## Directory Map

- `docs/` — VitePress ドキュメント
  - `01-domain-knowledge/` — 業務ナレッジ（14カテゴリ）
  - `02-system-specification/` — システム仕様
  - `03-tasks/` — タスク管理
  - `.vitepress/config.ts` — サイドバー・ナビゲーション設定
- `scripts/` — ユーティリティスクリプト（Playwright クローラー等）
- `middleware.ts` — Vercel Edge Middleware（Basic認証）

## Setup

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # ビルド
npm run preview  # プレビュー
```

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

## Post-Implementation Checklist (MANDATORY)

コード変更後、**必ず** 以下を順番に実行すること:

1. **Verification** — 以下のコマンドを実行し、問題があれば修正する:
   - `npm run build` — VitePress ビルドが通ることを確認
2. **Documentation Sync** — `docs/` 配下の関連ドキュメントを同期する。`/docs-maintenance` スキルを参照。
