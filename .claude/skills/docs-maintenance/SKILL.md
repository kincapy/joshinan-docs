---
name: docs-maintenance
description: ドキュメント整合性メンテナンススキル。/docs-maintenance で呼び出し、Skills・Docs・実コードの3つを比較して不整合を検出し、ユーザーの判断で正規化する。カテゴリ単位で効率的に監査・修正タスクを作成し、エージェントに修正を委譲する。
---

# Document Maintenance スキル

Skills（`.claude/skills/`）・Docs（`docs/`）の二角検証（将来コード追加時は三角検証）で不整合を検出・修正する。

### 情報源

| 情報源 | 場所 | 役割 |
|--------|------|------|
| **Skills** | `.claude/skills/` | AI の行動指針。パステンプレート、ファイル命名規約、レイヤー構造を定義 |
| **Docs** | `docs/01-domain-knowledge/`, `docs/02-system-specification/`, `docs/03-tasks/` | 業務知識・システム仕様・タスク管理 |

※ 将来システム開発フェーズに入ったら、Code（`apps/`, `packages/`）を追加して三角検証にする。

## 起動時の処理

### 1. スコープの確認

`AskUserQuestion` で以下を確認する:

- **監査対象**: 全カテゴリ or 特定カテゴリ（例: `02-student-management`）
- **監査レベル**:
  - **Quick**: パス・構造の検証のみ（機械的に検出可能な不整合）
  - **Standard**: Quick + ドキュメント間の内容整合性チェック
  - **Deep**: Standard + Docs と実コードの内容突合（システム開発フェーズ以降）
- **修正モード**:
  - **Report のみ**: 不整合レポートを出力して終了
  - **Task 作成**: 修正タスクを `docs/03-tasks/` に作成
  - **即時修正**: エージェントに修正を委譲して実行

### 2. カテゴリマッピングの構築

情報源間でカテゴリがどう対応しているかをマッピングする:

```
カテゴリ: student-management
├── Skills: docs-domain-knowledge, docs-system-specification
├── Docs:
│   ├── docs/01-domain-knowledge/02-student-management/
│   ├── docs/02-system-specification/02-student-management/
│   └── docs/03-tasks/ 関連タスク
└── Config:
    └── docs/.vitepress/config.ts のサイドバー定義
```

## 監査フェーズ

### Phase 1: パス・構造の検証（Quick）

機械的に検出可能な不整合。**Explore エージェントを並列**で走らせて効率化する。

#### 1-A. Skills 内のパス参照チェック

`.claude/skills/` 配下の全 SKILL.md を読み、記載されたパスが実在するか検証する。

```
検証パターン:
- `docs/` で始まるパス → Glob で実在確認
```

#### 1-B. ドキュメント構造の検証

各カテゴリについて、期待されるファイル構成が揃っているか確認する。

```
docs/01-domain-knowledge/{category}/:
  必須: index.md（or README.md）, 01-work-flow.md, 02-data.md, 03-issues.md

docs/02-system-specification/{category}/:
  必須: index.md（or README.md）, 01-entity.md, 02-uiux.md
```

#### 1-C. サイドバー整合性チェック

`docs/.vitepress/config.ts` のサイドバー定義に記載されたリンク先が実在するか確認する。
逆に、実在するドキュメントがサイドバーに登録されているか確認する。

### Phase 2: ドキュメント間の内容整合性（Standard）

#### 2-A. domain-knowledge → system-specification

| チェック項目 | 方法 |
|-------------|------|
| `02-data.md` のオブジェクト → `01-entity.md` のエンティティ | オブジェクト名の存在確認 |
| `01-work-flow.md` の業務ステップ → `02-uiux.md` の画面 | ステップと画面の対応確認 |
| `03-issues.md` の課題 → `02-uiux.md` | 課題が仕様に反映されているか |

#### 2-B. system-specification 内部

| チェック項目 | 方法 |
|-------------|------|
| `01-entity.md` のエンティティ名 → `02-uiux.md` の参照エンティティ | 名前の一致確認 |
| `01-entity.md` のプロパティ → `02-uiux.md` のフォームフィールド | プロパティがフォームに反映されているか |

## レポート出力

監査結果を以下のフォーマットで出力する:

```markdown
# ドキュメント整合性レポート

## サマリー

| カテゴリ | Quick | Standard | 不整合数 |
|---------|-------|----------|---------|
| {category} | {ok/NG} | {ok/NG/-} | {n} |

## 不整合一覧

### {カテゴリ名}

#### [Quick] パス・構造の不整合

| # | 情報源 | 問題 | 該当箇所 |
|---|--------|------|---------|
| 1 | Skills | パス不在 | `docs-domain-knowledge:L42` → `docs/foo/bar.md` |
| 2 | Docs | ファイル欠損 | `02-system-specification/XX/02-uiux.md` |
| 3 | Config | サイドバー不整合 | `config.ts` に未登録のファイルあり |

#### [Standard] ドキュメント間の不整合

| # | 元ドキュメント | 先ドキュメント | 問題 |
|---|--------------|--------------|------|
| 1 | `01-entity.md` の Foo エンティティ | `02-uiux.md` | 参照されていない |
```

## 判断フェーズ

不整合ごとに **どちらを正（Source of Truth）とするか** ユーザーに確認する。

`AskUserQuestion` で、不整合のカテゴリ単位で確認する:

- **ドキュメントAが正**: ドキュメントBを修正
- **ドキュメントBが正**: ドキュメントAを修正
- **要検討**: 判断を保留し、メモとして記録

## 修正フェーズ

### Report のみの場合

レポートを `docs/03-tasks/{年}/{月}/{日}/{HHMM}-docs-maintenance-report.md` に保存する。

### Task 作成の場合

不整合を修正カテゴリ別にグルーピングし、タスクファイルを作成する。
タスクファイルは `docs-tasks` スキルのフォーマットに従う。

### 即時修正の場合

Task ツールで並列エージェントを起動し、修正を実行する。

## 効率化ガイドライン

### 全体方針

1. **カテゴリ単位で処理する**: 全カテゴリを一度にやらない。1カテゴリずつ監査→判断→修正のサイクルを回す
2. **Quick → Standard の段階的深掘り**: まず Quick で全体像を把握し、問題の多いカテゴリを優先的に掘る
3. **並列エージェントを活用**: Phase 1 の検証は独立性が高いため、並列 Explore エージェントで実行可能

### スキップすべきケース

- `00-common` や `00-concept` のような横断カテゴリは独立した監査が難しいため、最後に回す
- `docs/03-tasks/` の過去タスク（ステータスが「完了」）は監査対象外とする
- `docs/01-domain-knowledge/` のみ存在し `docs/02-system-specification/` が未作成のカテゴリは、Standard をスキップ

## 対話のルール

- 監査結果は**サマリーを先に提示**し、詳細は求められたら展開する
- 不整合の判断は**バッチで提示**し、1件ずつ聞かない
- 修正量が多い場合は**優先度を提案**する
- 修正完了後は `npm run build` の実行結果を報告する

## 完了時の処理

1. 修正したファイルの一覧をユーザーに提示
2. 残存する不整合（要検討としたもの）があれば一覧化
3. 次のステップを確認:
   - 別のカテゴリの監査に進むか？
   - 残存不整合の判断を行うか？
   - 一旦ここで終了するか？
